// Supabase Edge Function — create-checkout
// Starts a Recurrente checkout for the Pro subscription. Runs server-side
// because Recurrente's /api/checkouts endpoint now requires X-SECRET-KEY
// (the public key alone is no longer accepted — calling it from the
// frontend returns 401 "Incluye el header X-SECRET-KEY con tu clave secreta.").
//
// Deploy: supabase functions deploy create-checkout
// Secrets: RECURRENTE_API_SECRET_KEY (Recurrente's Secret Key, sk_...) — already set,
//          shared with update-payment-method. NOT the same as RECURRENTE_SECRET_KEY
//          (that one is the Svix webhook signing secret).
//          (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_URL = 'https://my.nutrifollow.app';
const RECURRENTE_PRODUCT_ID = 'prod_22uktkdj';

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
    .select('status')
    .eq('owner_id', user.id)
    .single();

  if (sub && (sub.status === 'active' || sub.status === 'cancelled_pending')) {
    return json({ ok: false, message: 'Ya tienes una suscripción Pro activa.' }, 200);
  }

  const RECURRENTE_API_SECRET_KEY = Deno.env.get('RECURRENTE_API_SECRET_KEY')!;

  const res = await fetch('https://app.recurrente.com/api/checkouts', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-SECRET-KEY': RECURRENTE_API_SECRET_KEY },
    body: JSON.stringify({
      items:       [{ product_id: RECURRENTE_PRODUCT_ID }],
      success_url: `${APP_URL}/checkout-success`,
      cancel_url:  `${APP_URL}/profile`,
      locale:      'es',
      metadata:    { owner_id: user.id, email: user.email },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Recurrente checkout error:', res.status, errText);
    return json({ ok: false, message: 'Error al crear el checkout.' }, 500);
  }

  const { checkout_url } = await res.json();
  if (!checkout_url) {
    return json({ ok: false, message: 'No se recibió URL de pago.' }, 500);
  }

  return json({ ok: true, checkout_url }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
