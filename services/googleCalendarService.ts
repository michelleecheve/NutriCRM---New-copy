import { supabase } from "./supabase";
import { Appointment } from "../types";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPES = "https://www.googleapis.com/auth/calendar";
const CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function getRedirectUri(): string {
  return `${window.location.origin}/oauth/google/callback`;
}

function getWebhookUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}/functions/v1/google-calendar-webhook`;
}

// ─── Internal token cache (avoids repeated DB reads) ──────────────────────────
interface CachedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  watchChannelId?: string;
  watchResourceId?: string;
  watchExpiry?: number;
}

class GoogleCalendarService {
  private cache: CachedTokens | null = null;

  // ── Connection status ────────────────────────────────────────────────────────

  async loadTokens(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("google_calendar_tokens")
      .select(
        "access_token, refresh_token, token_expiry, watch_channel_id, watch_resource_id, watch_expiry",
      )
      .eq("owner_id", userId)
      .maybeSingle();

    if (error || !data?.access_token) {
      this.cache = null;
      return false;
    }

    this.cache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.token_expiry,
      watchChannelId: data.watch_channel_id ?? undefined,
      watchResourceId: data.watch_resource_id ?? undefined,
      watchExpiry: data.watch_expiry ?? undefined,
    };
    return true;
  }

  isConnected(): boolean {
    return !!this.cache?.accessToken;
  }

  clearCache(): void {
    this.cache = null;
  }

  // ── OAuth connect ────────────────────────────────────────────────────────────

  private openOAuthPopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: getRedirectUri(),
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
      });

      const popup = window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        "google-oauth",
        "width=500,height=620,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        reject(
          new Error(
            "No se pudo abrir la ventana de Google. Permite las ventanas emergentes para este sitio.",
          ),
        );
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== "GOOGLE_OAUTH_CALLBACK") return;
        window.removeEventListener("message", messageHandler);
        clearInterval(closedChecker);
        if (event.data.error) {
          reject(
            new Error(`Google rechazó la autorización: ${event.data.error}`),
          );
        } else if (event.data.code) {
          resolve(event.data.code as string);
        } else {
          reject(new Error("No se recibió código de autorización"));
        }
      };

      window.addEventListener("message", messageHandler);

      const closedChecker = setInterval(() => {
        if (popup.closed) {
          clearInterval(closedChecker);
          window.removeEventListener("message", messageHandler);
          reject(
            new Error("Ventana cerrada antes de completar la autorización"),
          );
        }
      }, 1000);
    });
  }

  async connect(userId: string): Promise<void> {
    const code = await this.openOAuthPopup();

    // Exchange code for tokens via Supabase Edge Function (keeps client_secret server-side)
    const { data, error } = await supabase.functions.invoke("google-oauth", {
      body: { action: "exchange", code, redirect_uri: getRedirectUri() },
    });

    if (error || !data?.access_token) {
      throw new Error(
        error?.message ?? "No se pudo obtener el token de Google Calendar",
      );
    }

    const expiresAt = Date.now() + (data.expires_in as number) * 1000;

    // Upsert into dedicated table — one row per user
    await supabase.from("google_calendar_tokens").upsert(
      {
        owner_id: userId,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expiry: expiresAt,
      },
      { onConflict: "owner_id" },
    );

    this.cache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };

    // Register webhook watch so Google notifies us of external changes
    await this.setupWatch(userId);
  }

  async disconnect(userId: string): Promise<void> {
    // Stop the Google push channel
    if (this.cache?.watchChannelId && this.cache?.watchResourceId) {
      await this.stopWatch(
        this.cache.watchChannelId,
        this.cache.watchResourceId,
        userId,
      );
    }

    // Revoke the token at Google (best-effort)
    if (this.cache?.accessToken) {
      fetch(
        `https://oauth2.googleapis.com/revoke?token=${this.cache.accessToken}`,
        { method: "POST" },
      ).catch(() => {});
    }

    // Delete the row — clean and simple
    await supabase
      .from("google_calendar_tokens")
      .delete()
      .eq("owner_id", userId);

    this.cache = null;
  }

  // ── Token management ─────────────────────────────────────────────────────────

  async getValidAccessToken(userId: string): Promise<string | null> {
    if (!this.cache) {
      const loaded = await this.loadTokens(userId);
      if (!loaded) return null;
    }

    // Refresh if expiring within 5 minutes
    if (this.cache!.expiresAt - Date.now() < 5 * 60 * 1000) {
      await this.refreshToken(userId);
    }

    return this.cache?.accessToken ?? null;
  }

  private async refreshToken(userId: string): Promise<void> {
    if (!this.cache?.refreshToken) return;

    const { data, error } = await supabase.functions.invoke("google-oauth", {
      body: { action: "refresh", refresh_token: this.cache.refreshToken },
    });

    if (error || !data?.access_token) return;

    const expiresAt = Date.now() + (data.expires_in as number) * 1000;

    await supabase
      .from("google_calendar_tokens")
      .update({
        access_token: data.access_token,
        token_expiry: expiresAt,
      })
      .eq("owner_id", userId);

    this.cache = { ...this.cache!, accessToken: data.access_token, expiresAt };
  }

  // ── Calendar CRUD ────────────────────────────────────────────────────────────

  /** Creates a Google Calendar event and returns its ID, or null on failure. */
  async createEvent(
    appointment: Appointment,
    userId: string,
  ): Promise<string | null> {
    const token = await this.getValidAccessToken(userId);
    if (!token) return null;

    try {
      const res = await fetch(CALENDAR_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.toGoogleEvent(appointment)),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.id as string;
    } catch {
      return null;
    }
  }

  /** Updates an existing Google Calendar event. Silent on failure. */
  async updateEvent(
    googleEventId: string,
    appointment: Appointment,
    userId: string,
  ): Promise<void> {
    const token = await this.getValidAccessToken(userId);
    if (!token) return;

    fetch(`${CALENDAR_API}/${encodeURIComponent(googleEventId)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.toGoogleEvent(appointment)),
    }).catch(() => {});
  }

  /** Deletes a Google Calendar event. Silent on failure. */
  async deleteEvent(googleEventId: string, userId: string): Promise<void> {
    const token = await this.getValidAccessToken(userId);
    if (!token) return;

    fetch(`${CALENDAR_API}/${encodeURIComponent(googleEventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  // ── Webhook watch ────────────────────────────────────────────────────────────

  async setupWatch(userId: string): Promise<void> {
    const token = await this.getValidAccessToken(userId);
    if (!token) return;

    const channelId = crypto.randomUUID();

    try {
      const res = await fetch(`${CALENDAR_API}/watch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: getWebhookUrl(),
          params: { ttl: "604800" }, // 7 days max
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const watchExpiry = parseInt(data.expiration as string, 10);

      await supabase
        .from("google_calendar_tokens")
        .update({
          watch_channel_id: channelId,
          watch_resource_id: data.resourceId,
          watch_expiry: watchExpiry,
        })
        .eq("owner_id", userId);

      if (this.cache) {
        this.cache.watchChannelId = channelId;
        this.cache.watchResourceId = data.resourceId;
        this.cache.watchExpiry = watchExpiry;
      }
    } catch {
      // Watch setup is best-effort; the app works without it
    }
  }

  /** Call on CalendarPage mount to renew the watch if it expires within 24 h. */
  async renewWatchIfNeeded(userId: string): Promise<void> {
    if (!this.cache) await this.loadTokens(userId);
    if (!this.isConnected()) return;

    const oneDayMs = 24 * 60 * 60 * 1000;
    if (
      !this.cache!.watchExpiry ||
      this.cache!.watchExpiry - Date.now() < oneDayMs
    ) {
      await this.setupWatch(userId);
    }
  }

  private async stopWatch(
    channelId: string,
    resourceId: string,
    userId: string,
  ): Promise<void> {
    const token = await this.getValidAccessToken(userId);
    if (!token) return;

    fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: channelId, resourceId }),
    }).catch(() => {});
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private toGoogleEvent(appt: Appointment) {
    const [year, month, day] = appt.date.split("-").map(Number);
    const [hour, minute] = appt.time.split(":").map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end = new Date(start.getTime() + appt.duration * 60_000);

    return {
      summary: `${appt.type} — ${appt.patientName}`,
      description: `Modalidad: ${appt.modality}\nEstado: ${appt.status}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      status: appt.status === "Cancelada" ? "cancelled" : "confirmed",
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();
