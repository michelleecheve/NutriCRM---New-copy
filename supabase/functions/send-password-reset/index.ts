// Supabase Edge Function — send-password-reset
// Generates a password-recovery link via the Supabase admin API and delivers
// it through Resend, instead of Supabase Auth's own (unreliable, rate-limited)
// built-in email sender. Called anonymously from Login.tsx's "olvidé mi
// contraseña" form.
//
// Always responds { ok: true } regardless of whether the email is registered,
// to avoid leaking which addresses have an account.
//
// Protegido contra abuso (spam de correos / agotar cuota de Resend) con:
//  1. Verificación server-side de Cloudflare Turnstile (el mismo par
//     site key/secret key que ya usa el login normal — ver Login.tsx).
//  2. Límite de intentos por correo en la tabla password_reset_requests
//     (ver SAVE_MIGRATION.md / CLAUDE.md para el SQL de creación).
//
// Deploy: supabase functions deploy send-password-reset --no-verify-jwt
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (optional), TURNSTILE_SECRET_KEY
//          (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Turnstile (captcha) ───────────────────────────────────────────────────────

async function verifyTurnstile(token: string, remoteip: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) { console.warn('TURNSTILE_SECRET_KEY not set — skipping captcha verification'); return true; }
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) body.set('remoteip', remoteip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const result = await res.json();
    return result?.success === true;
  } catch (e) {
    console.error('Turnstile verification failed:', e);
    return false;
  }
}

// ─── Rate limiting (por correo) ─────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS   = 3;

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

// ─── Redirect allow-list ───────────────────────────────────────────────────────
// Defensa adicional a la lista de "Redirect URLs" que ya debe estar configurada
// en Supabase Dashboard (Auth → URL Configuration): aunque el cliente envíe
// redirectTo, acá lo validamos explícitamente contra los orígenes conocidos de
// la app antes de pedirle a Supabase que genere el link. Si no matchea, se
// ignora el valor recibido y se usa el default de producción — nunca se deja
// pasar un origen arbitrario (open redirect).
const ALLOWED_REDIRECT_ORIGINS = [
  'https://my.nutrifollow.app', // producción — login/app
  'https://nutrifollow.app',    // fallback mientras se completa la migración al subdominio
  'http://localhost:3000',      // desarrollo local
];
const DEFAULT_REDIRECT = `${ALLOWED_REDIRECT_ORIGINS[0]}/reset-password`;

function safeRedirectTo(candidate: string): string {
  try {
    const url = new URL(candidate);
    if (ALLOWED_REDIRECT_ORIGINS.includes(url.origin) && url.pathname === '/reset-password') {
      return url.toString();
    }
  } catch {
    // candidate no es una URL válida — cae al default abajo
  }
  return DEFAULT_REDIRECT;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed' }, 405);
  }

  let email = '';
  let redirectTo = '';
  let captchaToken = '';
  try {
    const body = await req.json();
    email = (body?.email ?? '').trim().toLowerCase();
    redirectTo = (body?.redirectTo ?? '').trim();
    captchaToken = (body?.captchaToken ?? '').trim();
  } catch {
    return json({ ok: false, message: 'Solicitud inválida.' }, 400);
  }

  if (!email) {
    return json({ ok: false, message: 'Correo requerido.' }, 400);
  }

  const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const captchaOk = await verifyTurnstile(captchaToken, remoteIp);
  if (!captchaOk) {
    return json({ ok: false, message: 'Verificación de seguridad fallida. Intenta de nuevo.' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Límite de intentos por correo. No revela nada al llamante — igual que el
  // caso de "el correo no existe", responde ok:true en silencio.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('password_reset_requests')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('requested_at', since);

  if ((count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
    console.warn('Rate limit hit for password reset:', email);
    return json({ ok: true }, 200);
  }

  await supabase.from('password_reset_requests').insert({ email });

  const { data, error } = await supabase.auth.admin.generateLink({
    type:  'recovery',
    email,
    options: { redirectTo: redirectTo ? safeRedirectTo(redirectTo) : DEFAULT_REDIRECT },
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
