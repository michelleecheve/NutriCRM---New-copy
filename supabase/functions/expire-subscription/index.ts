// Supabase Edge Function — expire-subscription
// Called by the client (authStore) when it detects a 'cancelled_pending'
// subscription whose current_period_end has already passed. Performs the
// server-side downgrade to Plan Básico and sends the "ahora estás en el Plan
// Básico" email — the one place the "Volver a suscribirme" button belongs,
// since resubscribing is blocked while status is still 'cancelled_pending'.
//
// Idempotent by design: the update only matches rows still in
// 'cancelled_pending', so repeated calls (multiple tabs, re-login) after the
// first successful downgrade are no-ops and never re-send the email.
//
// Deploy: supabase functions deploy expire-subscription
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (optional)
//          (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Email helpers ─────────────────────────────────────────────────────────────

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) { console.warn('RESEND_API_KEY not set — email skipped'); return; }
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: `NutriFollow <${from}>`, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) console.error('Resend error:', res.status, await res.text());
    else console.log(`Email sent → ${opts.to} | ${opts.subject}`);
  } catch (e) { console.error('Email send failed:', e); }
}

function emailDowngradedToBasic(name: string): string {
  const APP_URL = 'https://www.nutrifollow.app';
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#059669;padding:28px 40px;"><p style="margin:0;color:#fff;font-size:22px;font-weight:700;">NutriFollow</p></td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.6;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#1e293b;">Tu cuenta ahora está en el Plan Básico</h1>
  <p>Hola <strong>${name}</strong>,</p>
  <p>Tu acceso a NutriFollow Pro terminó y tu cuenta pasó al Plan Básico, tal como te confirmamos al cancelar.</p>
  <p style="background:#f1f5f9;border-left:3px solid #64748b;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
    Tus datos y pacientes siguen intactos. Ahora aplican los límites del Plan Básico para crear nuevos registros.
  </p>
  <p>Cuando quieras, puedes volver a suscribirte a Pro.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${APP_URL}/profile" style="display:inline-block;background:#059669;color:#fff;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">Volver a suscribirme →</a>
  </div>
</td></tr>
<tr><td style="background:#f1f5f9;padding:20px 40px;text-align:center;"><p style="margin:0;color:#94a3b8;font-size:12px;">NutriFollow · La herramienta de los nutricionistas modernos</p></td></tr>
</table></td></tr></table></body></html>`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ ok: false, message: 'Unauthorized' }, 401);
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ ok: false, message: 'Invalid token' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('owner_id', user.id)
    .single();

  if (!sub || sub.status !== 'cancelled_pending') {
    return json({ ok: true, downgraded: false }, 200);
  }
  if (!sub.current_period_end || new Date(sub.current_period_end) >= new Date()) {
    return json({ ok: true, downgraded: false }, 200);
  }

  // Guard on status='cancelled_pending' so only the first caller to reach this
  // (across tabs/re-logins) actually downgrades and triggers the email.
  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({ plan: 'free', status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('owner_id', user.id)
    .eq('status', 'cancelled_pending')
    .select('owner_id');

  if (updateError) {
    console.error('Failed to downgrade expired subscription:', updateError);
    return json({ ok: false, message: 'Error al actualizar la suscripción.' }, 500);
  }
  if (!updated || updated.length === 0) {
    return json({ ok: true, downgraded: false }, 200);
  }

  await supabase.from('profiles').update({ plan: 'free' }).eq('id', user.id);

  const { data: prof } = await supabase.from('profiles').select('name').eq('id', user.id).single();
  if (user.email) await sendEmail({
    to:      user.email,
    subject: 'Tu cuenta ahora está en el Plan Básico',
    html:    emailDowngradedToBasic(prof?.name ?? 'Nutricionista'),
  });

  return json({ ok: true, downgraded: true }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
