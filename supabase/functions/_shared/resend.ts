// Shared Resend email helper for NutriFollow edge functions.
// Set RESEND_API_KEY in Supabase secrets.
// Set RESEND_FROM_EMAIL once your domain is verified in Resend (e.g. hola@nutrifollow.app).
// Until then, leave unset and emails go out from onboarding@resend.dev.

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email skipped');
    return;
  }
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `NutriFollow <${fromEmail}>`,
        to:   [opts.to],
        subject: opts.subject,
        html:    opts.html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', res.status, err);
    } else {
      console.log(`Email sent → ${opts.to} | ${opts.subject}`);
    }
  } catch (e) {
    console.error('Email send failed:', e);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <!-- Header -->
      <tr><td style="background:#059669;padding:28px 40px;">
        <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">NutriFollow</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.6;">
        ${content}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f1f5f9;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">NutriFollow · La herramienta de los nutricionistas modernos</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(text: string, href: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="display:inline-block;background:#059669;color:#ffffff;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">${text} →</a>
  </div>`;
}

const APP_URL = 'https://www.nutrifollow.app';

export function emailWelcomePro(name: string, nextBilling: string): string {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#059669;">¡Bienvenida a NutriFollow Pro! 🎉</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Tu suscripción Pro está activa. A partir de ahora tienes acceso completo a todo lo que NutriFollow ofrece:</p>
    <table cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="padding:6px 0;"><span style="color:#059669;font-weight:700;margin-right:8px;">✓</span>Pacientes ilimitados</td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#059669;font-weight:700;margin-right:8px;">✓</span>Citas y facturas ilimitadas</td></tr>
    </table>
    <p style="background:#f0fdf4;border-left:3px solid #059669;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
      📅 Tu próximo cobro es el <strong>${nextBilling}</strong>.
    </p>
    ${btn('Ir a NutriFollow', APP_URL)}
    <p style="color:#64748b;font-size:13px;">Si tienes alguna pregunta, responde este correo y te ayudamos.</p>
  `);
}

export function emailPastDue(name: string): string {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#dc2626;">Problema con tu pago</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>No pudimos procesar el cobro de tu suscripción NutriFollow Pro. Intentaremos de nuevo en los próximos días.</p>
    <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
      ⚠️ Si el cobro sigue fallando, tu suscripción se cancelará automáticamente.
    </p>
    <p><strong>¿Qué puedes hacer?</strong></p>
    <ol style="padding-left:20px;color:#475569;">
      <li style="margin-bottom:8px;">Ingresa a NutriFollow → Perfil → Suscripción.</li>
      <li style="margin-bottom:8px;">Cancela tu suscripción actual.</li>
      <li style="margin-bottom:8px;">Vuelve a suscribirte con un método de pago válido.</li>
    </ol>
    ${btn('Ir a mi perfil', `${APP_URL}/profile`)}
    <p style="color:#64748b;font-size:13px;">Tus datos y pacientes están seguros, sin importar lo que pase con tu plan.</p>
  `);
}

export function emailCancellationConfirmed(name: string, accessUntil: string): string {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#d97706;">Suscripción cancelada</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Confirmamos que tu suscripción NutriFollow Pro ha sido cancelada.</p>
    <p style="background:#fffbeb;border-left:3px solid #d97706;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
      📅 Tu acceso Pro continuará activo hasta el <strong>${accessUntil}</strong>. Después pasarás al Plan Básico automáticamente.
    </p>
    <p>Si cambias de opinión, cuando finalice tu acceso Pro y pases al Plan Básico podrás volver a suscribirte desde tu perfil cuando quieras.</p>
    <p style="color:#64748b;font-size:13px;">Tus datos y pacientes están a salvo: solo vuelves a los límites del Plan Básico.</p>
  `);
}

export function emailDowngradedByFailure(name: string): string {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#dc2626;">Tu suscripción Pro ha sido cancelada</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Después de varios intentos de cobro sin éxito, tu suscripción NutriFollow Pro fue cancelada y tu cuenta ha regresado al Plan Básico.</p>
    <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
      Tu historial, pacientes y datos están completamente seguros.
    </p>
    <p><strong>¿Quieres volver a Pro?</strong><br>
    Puedes suscribirte nuevamente en cualquier momento desde tu perfil con un método de pago válido.</p>
    ${btn('Volver a suscribirme', `${APP_URL}/profile`)}
    <p style="color:#64748b;font-size:13px;">Si tienes preguntas, responde este correo.</p>
  `);
}
