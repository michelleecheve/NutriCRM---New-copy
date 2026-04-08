// Supabase Edge Function — cancel-subscription
// Cancels the active Recurrente subscription for the authenticated user.
// Uses service role to read the recurrente_subscription_id securely.
//
// Deploy: supabase functions deploy cancel-subscription
// Secrets: supabase secrets set RECURRENTE_PUBLIC_KEY=pk_xxx
//          (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    .select('status, recurrente_subscription_id')
    .eq('owner_id', user.id)
    .single();

  if (!sub || sub.status === 'free' || sub.status === 'cancelled') {
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

  // Update DB regardless (covers trial cancellations that have no recurrente_subscription_id)
  await supabase
    .from('subscriptions')
    .update({ plan: 'free', status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('owner_id', user.id);

  await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', user.id);

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
