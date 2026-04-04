// Supabase Edge Function — google-oauth
// Handles token exchange (code → tokens) and token refresh.
// Keeps GOOGLE_CLIENT_SECRET server-side.
//
// Deploy: supabase functions deploy google-oauth
// Secrets: supabase secrets set GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400, headers: CORS });
  }

  const { action } = body;

  // ── Exchange authorization code for access + refresh tokens ──────────────────
  if (action === 'exchange') {
    const { code, redirect_uri } = body;
    if (!code || !redirect_uri) {
      return new Response('Missing code or redirect_uri', { status: 400, headers: CORS });
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri,
        grant_type:    'authorization_code',
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // ── Refresh access token ──────────────────────────────────────────────────────
  if (action === 'refresh') {
    const { refresh_token } = body;
    if (!refresh_token) {
      return new Response('Missing refresh_token', { status: 400, headers: CORS });
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'refresh_token',
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  return new Response('Unknown action', { status: 400, headers: CORS });
});
