// Supabase Edge Function — update-payment-method
// Starts a Recurrente "setup" checkout to replace the payment method on the
// caller's existing subscription, WITHOUT cancelling or creating a new one.
// The actual swap happens later when recurrente-webhook receives
// setup_intent.succeeded with metadata.purpose === 'update_card'.
//
// Deploy: supabase functions deploy update-payment-method
// Secrets: supabase secrets set RECURRENTE_API_SECRET_KEY=sk_xxx  (Recurrente's Secret Key,
//          NOT the same as RECURRENTE_SECRET_KEY which is the Svix webhook signing secret)
//          (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_URL = 'https://www.nutrifollow.app';

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
    .select('status, recurrente_subscription_id, recurrente_customer_id')
    .eq('owner_id', user.id)
    .single();

  if (!sub || !['active', 'past_due', 'cancelled_pending'].includes(sub.status)) {
    return json({ ok: false, message: 'No hay una suscripción Pro para actualizar.' }, 200);
  }
  if (!sub.recurrente_subscription_id) {
    return json({ ok: false, message: 'Esta suscripción no tiene un ID de Recurrente asociado. Contacta soporte.' }, 200);
  }
  if (!sub.recurrente_customer_id) {
    return json({ ok: false, message: 'No pudimos identificar tu cuenta en Recurrente. Contacta soporte para actualizar tu tarjeta.' }, 200);
  }

  const RECURRENTE_API_SECRET_KEY = Deno.env.get('RECURRENTE_API_SECRET_KEY')!;

  const res = await fetch('https://app.recurrente.com/api/checkouts', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-SECRET-KEY': RECURRENTE_API_SECRET_KEY },
    body: JSON.stringify({
      mode:        'setup',
      user_id:     sub.recurrente_customer_id,
      success_url: `${APP_URL}/checkout-success?type=card_update`,
      cancel_url:  `${APP_URL}/profile`,
      metadata:    { owner_id: user.id, purpose: 'update_card' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Recurrente setup checkout error:', res.status, errText);
    return json({ ok: false, message: 'Error al iniciar la actualización de tarjeta. Intenta de nuevo.' }, 500);
  }

  const { checkout_url } = await res.json();
  if (!checkout_url) {
    return json({ ok: false, message: 'No se recibió URL de actualización.' }, 500);
  }

  return json({ ok: true, checkout_url }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
