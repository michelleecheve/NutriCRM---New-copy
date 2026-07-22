// Supabase Edge Function — recurrente-webhook
// Receives subscription event webhooks from Recurrente payment platform.
// Updates subscriptions table and profiles.plan on payment events.
//
// Deploy: supabase functions deploy recurrente-webhook
// Secrets: RECURRENTE_SECRET_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL (optional)
//          SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Email helpers ────────────────────────────────────────────────────────────

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

function layout(content: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#059669;padding:28px 40px;"><p style="margin:0;color:#fff;font-size:22px;font-weight:700;">NutriFollow</p></td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.6;">${content}</td></tr>
<tr><td style="background:#f1f5f9;padding:20px 40px;text-align:center;"><p style="margin:0;color:#94a3b8;font-size:12px;">NutriFollow · La herramienta de los nutricionistas modernos</p></td></tr>
</table></td></tr></table></body></html>`;
}

const APP_URL = 'https://www.nutrifollow.app';
const btn = (text: string, href: string) =>
  `<div style="text-align:center;margin:32px 0;"><a href="${href}" style="display:inline-block;background:#059669;color:#fff;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">${text} →</a></div>`;

function emailWelcomePro(name: string, nextBilling: string): string {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#059669;">¡Bienvenida a NutriFollow Pro! 🎉</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Tu suscripción Pro está activa. A partir de ahora tienes acceso completo:</p>
    <table cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="padding:6px 0;"><span style="color:#059669;font-weight:700;margin-right:8px;">✓</span>Pacientes ilimitados</td></tr>
      <tr><td style="padding:6px 0;"><span style="color:#059669;font-weight:700;margin-right:8px;">✓</span>Citas y facturas ilimitadas</td></tr>
    </table>
    <p style="background:#f0fdf4;border-left:3px solid #059669;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
      📅 Tu próximo cobro es el <strong>${nextBilling}</strong>.
    </p>
    ${btn('Ir a NutriFollow', APP_URL)}
    <p style="color:#64748b;font-size:13px;">Si tienes dudas, escribe a nutrifollow.app@outlook.com</p>
  `);
}

function emailPastDue(name: string): string {
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
    <p style="color:#64748b;font-size:13px;">Tus datos y pacientes están seguros.</p>
  `);
}

function emailDowngradedByFailure(name: string): string {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#dc2626;">Tu suscripción Pro ha sido cancelada</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Después de varios intentos de cobro sin éxito, tu suscripción NutriFollow Pro fue cancelada y tu cuenta ha regresado al Plan Básico.</p>
    <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
      Tu historial, pacientes y datos están completamente seguros.
    </p>
    <p>Puedes volver a suscribirte en cualquier momento desde tu perfil con un método de pago válido.</p>
    ${btn('Volver a suscribirme', `${APP_URL}/profile`)}
  `);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
}

function extractPeriodEnd(payload: Record<string, unknown>, subObj?: Record<string, unknown>): string {
  const candidates = [
    subObj?.current_period_end,
    subObj?.billing_cycle_end,
    subObj?.next_billing_date,
    payload.current_period_end,
    payload.billing_cycle_end,
    payload.next_billing_date,
  ];
  for (const val of candidates) {
    if (typeof val === 'string' && val) return val;
    if (typeof val === 'number' && val > 0) return new Date(val * 1000).toISOString();
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback.toISOString();
}

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ─── Svix signature verification ─────────────────────────────────────────────

const WEBHOOK_SECRET = Deno.env.get('RECURRENTE_SECRET_KEY')!;

async function verifySvix(body: string, svixId: string, svixTimestamp: string, svixSignature: string): Promise<boolean> {
  try {
    const rawSecret = Uint8Array.from(atob(WEBHOOK_SECRET.replace('whsec_', '')), c => c.charCodeAt(0));
    const toSign    = `${svixId}.${svixTimestamp}.${body}`;
    const key       = await crypto.subtle.importKey('raw', rawSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBytes  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
    const computed  = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
    return svixSignature.split(' ').some(s => s.replace('v1,', '') === computed);
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const svixId        = req.headers.get('svix-id')        ?? '';
  const svixTimestamp = req.headers.get('svix-timestamp')  ?? '';
  const svixSignature = req.headers.get('svix-signature')  ?? '';

  const body = await req.text();

  const valid = await verifySvix(body, svixId, svixTimestamp, svixSignature);
  if (!valid) {
    console.error('Unauthorized: invalid Svix signature');
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const eventType = payload.event_type as string;
  const eventId   = payload.id         as string;

  if (!eventType) {
    console.error('Missing event_type in payload', JSON.stringify(payload));
    return new Response('Missing event_type', { status: 400 });
  }

  const checkout = payload.checkout    as Record<string, unknown> | undefined;
  const metadata = checkout?.metadata  as Record<string, unknown> | undefined;
  const customer = payload.customer    as Record<string, unknown> | undefined;
  const subObj   = payload.subscription as Record<string, unknown> | undefined;

  const recurrenteSubId = (
    subObj?.id as string | undefined
    ?? (eventType === 'subscription.create' ? eventId : undefined)
  );

  const metadataOwnerId     = metadata?.owner_id as string | undefined;
  const customerEmail       = (payload.customer_email as string | undefined) ?? (customer?.email as string | undefined);
  const recurrenteCustomerId = payload.user_id as string | undefined;

  let ownerId: string | null = metadataOwnerId ?? null;
  if (!ownerId && customerEmail?.includes('@')) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', customerEmail).single();
    ownerId = profile?.id ?? null;
  }

  if (!ownerId) {
    console.error('Could not resolve owner_id for event', eventType, eventId);
    return new Response('Owner not found — ignored', { status: 200 });
  }

  // Deduplicate
  if (eventId) {
    const { data: existing } = await supabase.from('subscription_events').select('id').eq('recurrente_id', eventId).single();
    if (existing) return new Response('Duplicate event — ignored', { status: 200 });
  }

  await supabase.from('subscription_events').insert({
    owner_id: ownerId, event_type: eventType, recurrente_id: eventId ?? null, payload,
  });

  switch (eventType) {

    case 'setup_intent.succeeded':
    case 'subscription.create': {
      // Cambio de tarjeta sin cancelar: checkout mode=setup creado por update-payment-method,
      // identificado por metadata.purpose. Solo reemplaza la tarjeta en Recurrente — no toca
      // plan/status/período, así que se maneja aparte y no sigue al flujo de "activar Pro".
      if (metadata?.purpose === 'update_card') {
        const newPaymentMethodId = (checkout?.payment_method as Record<string, unknown> | undefined)?.id as string | undefined;
        if (!newPaymentMethodId) {
          console.error(`update_card for owner ${ownerId} — no payment_method.id in payload`);
          break;
        }
        const { data: existingSub } = await supabase.from('subscriptions').select('recurrente_subscription_id').eq('owner_id', ownerId).single();
        if (!existingSub?.recurrente_subscription_id) {
          console.error(`update_card for owner ${ownerId} — no recurrente_subscription_id on file`);
          break;
        }
        const RECURRENTE_API_SECRET_KEY = Deno.env.get('RECURRENTE_API_SECRET_KEY')!;
        const updateRes = await fetch(`https://app.recurrente.com/api/subscriptions/${existingSub.recurrente_subscription_id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json', 'X-SECRET-KEY': RECURRENTE_API_SECRET_KEY },
          body:    JSON.stringify({ payment_method_id: newPaymentMethodId }),
        });
        if (!updateRes.ok) {
          console.error('Recurrente update payment_method error:', updateRes.status, await updateRes.text());
        } else {
          console.log(`Payment method updated for owner ${ownerId}`);
        }
        break;
      }

      const periodEnd = extractPeriodEnd(payload, subObj);
      await supabase.from('subscriptions').upsert({
        owner_id: ownerId, plan: 'pro', status: 'active',
        recurrente_subscription_id: recurrenteSubId ?? null,
        recurrente_customer_id:     recurrenteCustomerId ?? null,
        current_period_start: new Date().toISOString(),
        current_period_end:   periodEnd,
        updated_at:           new Date().toISOString(),
      }, { onConflict: 'owner_id' });
      await supabase.from('profiles').update({ plan: 'pro' }).eq('id', ownerId);
      console.log(`Activated Pro for owner ${ownerId} via ${eventType}`);

      const { data: prof } = await supabase.from('profiles').select('name, email').eq('id', ownerId).single();
      const toEmail = prof?.email ?? customerEmail;
      if (toEmail) await sendEmail({
        to: toEmail,
        subject: '¡Bienvenida a NutriFollow Pro!',
        html: emailWelcomePro(prof?.name ?? 'Nutricionista', fmtDate(periodEnd)),
      });
      break;
    }

    case 'subscription.cancel': {
      const { data: currentSub } = await supabase.from('subscriptions').select('status').eq('owner_id', ownerId).single();

      if (currentSub?.status === 'cancelled_pending') {
        console.log(`subscription.cancel for voluntarily-cancelled user ${ownerId} — no immediate downgrade`);
        break;
      }

      // Payment-failure cancellation → downgrade immediately
      await supabase.from('subscriptions').upsert({
        owner_id: ownerId, plan: 'free', status: 'cancelled', updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });
      await supabase.from('profiles').update({ plan: 'free' }).eq('id', ownerId);
      console.log(`subscription.cancel: payment-failure downgrade for owner ${ownerId}`);

      const { data: profDown } = await supabase.from('profiles').select('name, email').eq('id', ownerId).single();
      if (profDown?.email) await sendEmail({
        to: profDown.email,
        subject: 'Tu suscripción Pro ha sido cancelada',
        html: emailDowngradedByFailure(profDown.name ?? 'Nutricionista'),
      });
      break;
    }

    case 'subscription.renew':
    case 'subscription.renewed': {
      const newPeriodEnd = extractPeriodEnd(payload, subObj);
      await supabase.from('subscriptions').update({
        status: 'active', current_period_end: newPeriodEnd, updated_at: new Date().toISOString(),
      }).eq('owner_id', ownerId);
      console.log(`Renewed subscription for owner ${ownerId}, period ends ${newPeriodEnd}`);
      break;
    }

    case 'payment_intent.succeeded': {
      // Recurrente no manda subscription.renew para cobros recurrentes — el evento real es
      // payment_intent.succeeded. Su payload no trae fecha de próximo cobro, así que se calcula
      // desde el billing_interval del precio recurrente en vez de confiar en un campo inexistente.
      const paymentObj      = (payload.payment as Record<string, unknown> | undefined) ?? (checkout?.payment as Record<string, unknown> | undefined);
      const paymentable     = paymentObj?.paymentable as Record<string, unknown> | undefined;
      const isSubscription  = paymentable?.type === 'Subscription';

      if (!isSubscription) {
        console.log(`payment_intent.succeeded for owner ${ownerId} is not a subscription payment — ignored`);
        break;
      }

      const products        = (payload.products as Record<string, unknown>[] | undefined) ?? [];
      const recurringPrice  = products
        .flatMap(p => (p.prices as Record<string, unknown>[] | undefined) ?? [])
        .find(pr => pr.charge_type === 'recurring');

      const intervalCount = (recurringPrice?.billing_interval_count as number) || 1;
      const interval       = (recurringPrice?.billing_interval as string) || 'month';

      const chargedAt = new Date((payload.created_at as string) ?? Date.now());
      const periodEnd = new Date(chargedAt);
      if (interval === 'year')      periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount);
      else if (interval === 'week') periodEnd.setDate(periodEnd.getDate() + 7 * intervalCount);
      else if (interval === 'day')  periodEnd.setDate(periodEnd.getDate() + intervalCount);
      else                          periodEnd.setMonth(periodEnd.getMonth() + intervalCount); // 'month' default

      await supabase.from('subscriptions').upsert({
        owner_id: ownerId, plan: 'pro', status: 'active',
        recurrente_subscription_id: (paymentable?.id as string) ?? recurrenteSubId ?? null,
        recurrente_customer_id:     recurrenteCustomerId ?? null,
        current_period_start: chargedAt.toISOString(),
        current_period_end:   periodEnd.toISOString(),
        updated_at:           new Date().toISOString(),
      }, { onConflict: 'owner_id' });
      await supabase.from('profiles').update({ plan: 'pro' }).eq('id', ownerId);
      console.log(`Renewed (payment_intent.succeeded) for owner ${ownerId}: ${chargedAt.toISOString()} → ${periodEnd.toISOString()}`);
      break;
    }

    case 'intent.succeeded': {
      // Mismo cobro que payment_intent.succeeded bajo otro nombre de evento — no reprocesar.
      console.log(`intent.succeeded for owner ${ownerId} — duplicate of payment_intent.succeeded, ignored`);
      break;
    }

    case 'subscription.past_due': {
      await supabase.from('subscriptions').upsert({
        owner_id: ownerId, plan: 'pro', status: 'past_due', updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      const { data: profDue } = await supabase.from('profiles').select('name, email').eq('id', ownerId).single();
      if (profDue?.email) await sendEmail({
        to: profDue.email,
        subject: 'Problema con tu pago en NutriFollow',
        html: emailPastDue(profDue.name ?? 'Nutricionista'),
      });
      break;
    }

    case 'subscription.paused': {
      await supabase.from('subscriptions').upsert({
        owner_id: ownerId, plan: 'free', status: 'paused', updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });
      await supabase.from('profiles').update({ plan: 'free' }).eq('id', ownerId);
      break;
    }

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
