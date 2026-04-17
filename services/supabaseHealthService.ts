type HealthStatus = 'ok' | 'no-internet' | 'supabase-issue';
type Listener = (status: HealthStatus, dismissed: boolean) => void;

const RECOVERY_INTERVAL_MS = 15 * 60 * 1000;
const EDGE_FN_WINDOW_MS    = 5  * 60 * 1000;
const EDGE_FN_THRESHOLD    = 2;
const STORAGE_KEY          = 'nutriflow_supabase_health_v1';

const SKIP_PATTERNS = [
  'invalid api key',
  'permission denied',
  'jwt expired',
  'relation does not exist',
  'column does not exist',
  'invalid login credentials',
  'email not confirmed',
  'user not found',
  'invalid password',
  'email already',
  'already registered',
  'weak password',
  'invalid email',
  'signup disabled',
];

function containsSkipPattern(text: string): boolean {
  const lower = text.toLowerCase();
  return SKIP_PATTERNS.some(p => lower.includes(p));
}

function readPersistedStatus(): HealthStatus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'supabase-issue' || raw === 'no-internet') return raw;
  } catch { /* ignore */ }
  return 'ok';
}

class SupabaseHealthService {
  private status: HealthStatus = readPersistedStatus();
  private dismissed             = false;
  private listeners             = new Set<Listener>();
  private recoveryTimer: ReturnType<typeof setInterval> | null = null;
  private isChecking            = false;

  // Recent edge-function errors for threshold tracking
  private edgeFnErrors: { time: number; url: string }[] = [];

  constructor() {
    // If we restored a problem status from storage, start polling for recovery immediately
    if (this.status !== 'ok') this.startPolling();
  }

  getStatus()    { return this.status;    }
  isDismissed()  { return this.dismissed; }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  dismiss() {
    this.dismissed = true;
    this.notify();
  }

  // ── Called by the fetch wrapper ──────────────────────────────────────────

  reportHttpError(status: number, url: string): void {
    if (status < 500) return;
    this.handleDetected(url).catch(() => undefined);
  }

  reportNetworkError(error: unknown, url: string): void {
    const msg = error instanceof Error ? error.message : String(error);
    if (containsSkipPattern(msg)) return;
    const isNetErr = error instanceof TypeError &&
      /fetch|network|failed to fetch|load failed|networkerror/i.test(msg);
    if (!isNetErr) return;
    this.handleDetected(url).catch(() => undefined);
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private notify() {
    this.listeners.forEach(cb => cb(this.status, this.dismissed));
  }

  private setStatus(next: HealthStatus) {
    if (this.status === next) return;
    this.status    = next;
    this.dismissed = false;
    try {
      if (next === 'ok') localStorage.removeItem(STORAGE_KEY);
      else               localStorage.setItem(STORAGE_KEY, next);
    } catch { /* ignore */ }
    this.notify();
  }

  private async handleDetected(url: string): Promise<void> {
    // Edge functions: apply multi-error threshold
    const isEdgeFn = url.includes('/functions/v1/');
    if (isEdgeFn) {
      const now = Date.now();
      this.edgeFnErrors = this.edgeFnErrors.filter(e => now - e.time < EDGE_FN_WINDOW_MS);
      this.edgeFnErrors.push({ time: now, url });

      const uniqueUrls   = new Set(this.edgeFnErrors.map(e => e.url));
      const sameUrlCount = this.edgeFnErrors.filter(e => e.url === url).length;
      if (uniqueUrls.size < EDGE_FN_THRESHOLD && sameUrlCount < 3) return;
    }

    const hasInternet = await this.checkInternet();
    this.setStatus(hasInternet ? 'supabase-issue' : 'no-internet');
    this.startPolling();
  }

  private startPolling() {
    if (this.recoveryTimer) return;
    this.recoveryTimer = setInterval(() => this.checkRecovery(), RECOVERY_INTERVAL_MS);
  }

  private stopPolling() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  private async checkRecovery(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;
    try {
      const hasInternet = await this.checkInternet();
      if (!hasInternet) { this.setStatus('no-internet'); return; }

      const supabaseOk = await this.pingSupabase();
      if (supabaseOk) {
        this.stopPolling();
        this.setStatus('ok');
      }
    } finally {
      this.isChecking = false;
    }
  }

  private async checkInternet(): Promise<boolean> {
    try {
      await fetch('https://www.google.com', {
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      return true;
    } catch {
      return false;
    }
  }

  private async pingSupabase(): Promise<boolean> {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url) return true;
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        headers: { apikey: key || '' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      return res.status < 500;
    } catch {
      return false;
    }
  }
}

export const supabaseHealthService = new SupabaseHealthService();
