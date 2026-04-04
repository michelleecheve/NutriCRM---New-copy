// Supabase Edge Function — google-calendar-webhook
// Receives Google Calendar push notifications (Watch API).
// When Google detects a change on any watched calendar, it POSTs here.
// We then fetch the changed events and update our appointments table.
//
// Deploy: supabase functions deploy google-calendar-webhook
// Secrets: supabase secrets set GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ── Parse description lines into structured fields ───────────────────────────
// Expected format (written by NutriFollow):
//   Tipo: Primera Consulta
//   Modalidad: Presencial
//   Tel: 5512345678
//   Notas: texto libre
function parseDescription(desc: string | undefined): {
  type: string;
  modality: string;
  phone: string | null;
  notes: string | null;
} {
  const defaults = {
    type:     'Primera Consulta',
    modality: 'Presencial',
    phone:    null as string | null,
    notes:    null as string | null,
  };

  if (!desc) return defaults;

  const lines = desc.split('\n');
  const get = (prefix: string) =>
    lines.find(l => l.startsWith(prefix))?.slice(prefix.length).trim() ?? null;

  const rawType     = get('Tipo: ');
  const rawModality = get('Modalidad: ');
  const phone       = get('Tel: ');
  const notes       = get('Notas: ');

  const validTypes     = ['Primera Consulta', 'Seguimiento'];
  const validModality  = ['Presencial', 'Video'];

  return {
    type:     rawType     && validTypes.includes(rawType)    ? rawType     : defaults.type,
    modality: rawModality && validModality.includes(rawModality) ? rawModality : defaults.modality,
    phone,
    notes,
  };
}

serve(async (req) => {
  const channelId     = req.headers.get('X-Goog-Channel-Id');
  const resourceState = req.headers.get('X-Goog-Resource-State');

  // Google sends 'sync' right after watch is registered — just acknowledge it
  if (resourceState === 'sync') {
    return new Response('OK', { status: 200 });
  }

  // Only process 'exists' notifications (actual changes)
  if (!channelId || resourceState !== 'exists') {
    return new Response('OK', { status: 200 });
  }

  // ── Find the token row that owns this watch channel ───────────────────────────
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('google_calendar_tokens')
    .select('owner_id, access_token, refresh_token, token_expiry, calendar_id')
    .eq('watch_channel_id', channelId)
    .single();

  if (tokenErr || !tokenRow) {
    return new Response('Channel not found', { status: 404 });
  }

  // ── Refresh access token if expiring within 5 minutes ────────────────────────
  let accessToken: string = tokenRow.access_token;

  if ((tokenRow.token_expiry as number) - Date.now() < 5 * 60 * 1000) {
    const CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: tokenRow.refresh_token,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'refresh_token',
      }),
    });

    const refreshData = await refreshRes.json();
    if (refreshData.access_token) {
      accessToken = refreshData.access_token;
      await supabase.from('google_calendar_tokens').update({
        access_token: accessToken,
        token_expiry: Date.now() + (refreshData.expires_in as number) * 1000,
      }).eq('owner_id', tokenRow.owner_id);
    }
  }

  // ── Fetch events from the dedicated NutriFollow calendar ─────────────────────
  const calendarId = (tokenRow.calendar_id as string | null) ?? 'primary';
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
    `&showDeleted=true&singleEvents=true&maxResults=250`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!eventsRes.ok) return new Response('Google API error', { status: 502 });

  const eventsData = await eventsRes.json();
  if (!eventsData.items?.length) return new Response('OK', { status: 200 });

  // ── Load our appointments that have a google_event_id ────────────────────────
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, google_event_id, status')
    .eq('owner_id', tokenRow.owner_id)
    .not('google_event_id', 'is', null);

  // Build lookup map: googleEventId → appointment
  const byGoogleId: Record<string, { id: string; google_event_id: string; status: string }> = {};
  for (const a of (appointments ?? [])) byGoogleId[a.google_event_id] = a;

  // ── Apply changes ─────────────────────────────────────────────────────────────
  for (const event of eventsData.items) {
    const appt = byGoogleId[event.id];

    // ── Existing appointment — sync changes ──────────────────────────────────
    if (appt) {
      if (event.status === 'cancelled') {
        await supabase
          .from('appointments')
          .update({ status: 'Cancelada' })
          .eq('id', appt.id);
        continue;
      }

      const startDt     = new Date(event.start?.dateTime ?? event.start?.date);
      const endDt       = new Date(event.end?.dateTime   ?? event.end?.date);
      const durationMin = Math.round((endDt.getTime() - startDt.getTime()) / 60_000);
      const date        = startDt.toISOString().split('T')[0];
      const time        = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;

      // Also re-parse description in case it was edited in GC
      const parsed = parseDescription(event.description);

      await supabase
        .from('appointments')
        .update({
          date,
          time,
          duration:     durationMin,
          type:         parsed.type,
          modality:     parsed.modality,
          ...(parsed.phone !== null ? { phone: parsed.phone } : {}),
          ...(parsed.notes !== null ? { notes: parsed.notes } : {}),
        })
        .eq('id', appt.id);

      continue;
    }

    // ── New event created directly in Google Calendar — import it ────────────
    if (event.status === 'cancelled') continue; // deleted before we saw it

    const startDt     = new Date(event.start?.dateTime ?? event.start?.date);
    const endDt       = new Date(event.end?.dateTime   ?? event.end?.date);
    const durationMin = Math.max(30, Math.round((endDt.getTime() - startDt.getTime()) / 60_000));
    const date        = startDt.toISOString().split('T')[0];
    const time        = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;
    const patientName = (event.summary as string | undefined)?.trim() || 'Paciente';

    const parsed = parseDescription(event.description);

    // Store the raw description in notes if it didn't match our format
    const rawDesc = (event.description as string | undefined)?.trim() || null;
    const hasOurFormat = rawDesc?.startsWith('Tipo:') ?? false;
    const notesValue = parsed.notes ?? (!hasOurFormat && rawDesc ? rawDesc : null);

    const { data: newAppt } = await supabase
      .from('appointments')
      .insert({
        owner_id:        tokenRow.owner_id,
        patient_name:    patientName,
        date,
        time,
        duration:        durationMin,
        type:            parsed.type,
        modality:        parsed.modality,
        status:          'Programada',
        phone:           parsed.phone,
        notes:           notesValue,
        google_event_id: event.id,
      })
      .select('id')
      .single();

    // If insert failed silently, skip
    if (!newAppt) continue;
  }

  return new Response('OK', { status: 200 });
});
