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
    .select('owner_id, access_token, refresh_token, token_expiry')
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

  // ── Fetch events from Google (30 days ago → 1 year ahead) ────────────────────
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
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

  if (!appointments?.length) return new Response('OK', { status: 200 });

  // Build lookup map: googleEventId → appointment
  const byGoogleId: Record<string, typeof appointments[0]> = {};
  for (const a of appointments) byGoogleId[a.google_event_id] = a;

  // ── Apply changes ─────────────────────────────────────────────────────────────
  for (const event of eventsData.items) {
    const appt = byGoogleId[event.id];
    if (!appt) continue; // Event not in our system — skip

    if (event.status === 'cancelled') {
      // Deleted in Google Calendar → mark as Cancelada in our DB
      await supabase
        .from('appointments')
        .update({ status: 'Cancelada' })
        .eq('id', appt.id);
      continue;
    }

    // Parse start/end to extract date, time, duration
    const startDt     = new Date(event.start?.dateTime ?? event.start?.date);
    const endDt       = new Date(event.end?.dateTime   ?? event.end?.date);
    const durationMin = Math.round((endDt.getTime() - startDt.getTime()) / 60_000);
    const date        = startDt.toISOString().split('T')[0];
    const time        = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;

    await supabase
      .from('appointments')
      .update({ date, time, duration: durationMin })
      .eq('id', appt.id);
  }

  return new Response('OK', { status: 200 });
});
