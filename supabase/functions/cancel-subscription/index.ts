// Supabase Edge Function — cancel-subscription
// Cancels the active Recurrente subscription for the authenticated user.
// Uses service role to read the recurrente_subscription_id securely.
//
// Deploy: supabase functions deploy cancel-subscription
// Secrets: supabase secrets set RECURRENTE_PUBLIC_KEY=pk_xxx
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

function emailCancellationConfirmed(name: string, accessUntil: string): string {
  const APP_URL = 'https://www.nutrifollow.app';
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#059669;padding:28px 40px;"><p style="margin:0;color:#fff;font-size:22px;font-weight:700;">NutriFollow</p></td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.6;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#d97706;">Suscripción cancelada</h1>
  <p>Hola <strong>${name}</strong>,</p>
  <p>Confirmamos que tu suscripción NutriFollow Pro ha sido cancelada.</p>
  <p style="background:#fffbeb;border-left:3px solid #d97706;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
    📅 Tu acceso Pro continuará activo hasta el <strong>${accessUntil}</strong>. Después pasarás al Plan Básico automáticamente.
  </p>
  <p>Si cambias de opinión, puedes volver a suscribirte en cualquier momento.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${APP_URL}/profile" style="display:inline-block;background:#059669;color:#fff;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">Volver a suscribirme →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Tus datos y pacientes nunca se eliminan, independientemente de tu plan.</p>
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
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  // Verify caller is an authenticated Supabase user
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

  // Use service role to read subscription data
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, recurrente_subscription_id, current_period_end')
    .eq('owner_id', user.id)
    .single();

  if (!sub || sub.status === 'free' || sub.status === 'cancelled' || sub.status === 'cancelled_pending') {
    return json({ ok: false, message: 'No hay suscripción activa para cancelar.' }, 200);
  }

  // If there's a Recurrente subscription ID, cancel it via API
  if (sub.recurrente_subscription_id) {
    const RECURRENTE_PUBLIC_KEY = Deno.env.get('RECURRENTE_PUBLIC_KEY')!;

    const recurrenteRes = await fetch(
      `https://app.recurrente.com/api/subscriptions/${sub.recurrente_subscription_id}`,
      {
        method:  'DELETE',
        headers: { 'X-PUBLIC-KEY': RECURRENTE_PUBLIC_KEY },
      },
    );

    if (!recurrenteRes.ok) {
      const errText = await recurrenteRes.text();
      console.error('Recurrente cancel error:', recurrenteRes.status, errText);
      return json({ ok: false, message: 'Error al cancelar en Recurrente. Intenta de nuevo.' }, 500);
    }
  }

  // Grace period: keep plan = 'pro' and access until current_period_end.
  // The webhook (subscription.cancel) will arrive later — it will see 'cancelled_pending'
  // and skip the immediate downgrade. authStore handles expiry when current_period_end passes.
  await supabase
    .from('subscriptions')
    .update({
      status:       'cancelled_pending',
      cancelled_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('owner_id', user.id);

  // Cancellation confirmation email
  const { data: prof } = await supabase.from('profiles').select('name').eq('id', user.id).single();
  const accessUntilFmt = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  await sendEmail({
    to:      user.email!,
    subject: 'Suscripción cancelada — tu acceso continúa activo',
    html:    emailCancellationConfirmed(prof?.name ?? 'Nutricionista', accessUntilFmt),
  });

  return json({ ok: true, access_until: sub.current_period_end ?? null }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
