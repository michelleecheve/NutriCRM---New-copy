// Supabase Edge Function — send-password-reset
// Generates a password-recovery link via the Supabase admin API and delivers
// it through Resend, instead of Supabase Auth's own (unreliable, rate-limited)
// built-in email sender. Called anonymously from Login.tsx's "olvidé mi
// contraseña" form.
//
// Always responds { ok: true } regardless of whether the email is registered,
// to avoid leaking which addresses have an account.
//
// Deploy: supabase functions deploy send-password-reset --no-verify-jwt
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (optional)
//          (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

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

function emailPasswordReset(name: string, link: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#059669;padding:28px 40px;"><p style="margin:0;color:#fff;font-size:22px;font-weight:700;">NutriFollow</p></td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.6;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#1e293b;">Recuperar contraseña</h1>
  <p>Hola <strong>${name}</strong>,</p>
  <p>Recibimos una solicitud para restablecer tu contraseña de NutriFollow. Haz clic en el botón para elegir una nueva.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${link}" style="display:inline-block;background:#059669;color:#fff;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">Restablecer contraseña →</a>
  </div>
  <p style="color:#64748b;font-size:13px;">Si tú no solicitaste esto, puedes ignorar este correo — tu contraseña actual sigue siendo válida.</p>
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

  let email = '';
  let redirectTo = '';
  try {
    const body = await req.json();
    email = (body?.email ?? '').trim();
    redirectTo = (body?.redirectTo ?? '').trim();
  } catch {
    return json({ ok: false, message: 'Solicitud inválida.' }, 400);
  }

  if (!email) {
    return json({ ok: false, message: 'Correo requerido.' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type:  'recovery',
    email,
    options: redirectTo ? { redirectTo } : undefined,
  });

  // Never reveal whether the email exists — always respond ok:true.
  if (error || !data?.properties?.action_link) {
    console.warn('generateLink failed (email may not exist):', email, error?.message);
    return json({ ok: true }, 200);
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', data.user.id)
    .single();

  await sendEmail({
    to:      email,
    subject: 'Recupera tu contraseña de NutriFollow',
    html:    emailPasswordReset(prof?.name ?? 'Nutricionista', data.properties.action_link),
  });

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
