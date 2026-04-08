// Supabase Edge Function — activate-trial
// Activates a 14-day free trial for the authenticated nutricionista.
// Blocks if trial was already used (trial_started_at IS NOT NULL).
//
// Deploy: supabase functions deploy activate-trial
// (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Block if trial was already used
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('trial_started_at, status')
    .eq('owner_id', user.id)
    .single();

  if (existing?.trial_started_at) {
    return json({ ok: false, message: 'El período de prueba ya fue utilizado.' }, 200);
  }

  // Also block if already active or trialing
  if (existing?.status === 'active' || existing?.status === 'trialing') {
    return json({ ok: false, message: 'Ya tienes una suscripción activa.' }, 200);
  }

  const now          = new Date();
  const trialEndsAt  = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await supabase.from('subscriptions').upsert({
    owner_id:         user.id,
    plan:             'pro',
    status:           'trialing',
    trial_started_at: now.toISOString(),
    trial_ends_at:    trialEndsAt.toISOString(),
    updated_at:       now.toISOString(),
  }, { onConflict: 'owner_id' });

  await supabase
    .from('profiles')
    .update({ plan: 'pro' })
    .eq('id', user.id);

  await supabase
    .from('ai_rate_limits')
    .update({ max_tokens: 200000 })
    .eq('owner_id', user.id);

  return json({ ok: true, trial_ends_at: trialEndsAt.toISOString(), trial_started_at: now.toISOString() }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
