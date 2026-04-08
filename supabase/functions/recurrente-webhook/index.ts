// Supabase Edge Function — recurrente-webhook
// Receives subscription event webhooks from Recurrente payment platform.
// Updates subscriptions table and profiles.plan on payment events.
//
// Deploy: supabase functions deploy recurrente-webhook
// Secrets: supabase secrets set RECURRENTE_SECRET_KEY=sk_test_xxx
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RECURRENTE_SECRET_KEY = Deno.env.get('RECURRENTE_SECRET_KEY')!;

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify the request comes from Recurrente using the secret key header
  const authHeader = req.headers.get('X-SECRET-KEY');
  if (authHeader !== RECURRENTE_SECRET_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType   = payload.type as string;
  const eventId     = payload.id   as string;
  const subscription = payload.data as Record<string, unknown> | undefined;

  if (!eventType || !subscription) {
    return new Response('Missing event type or data', { status: 400 });
  }

  // Find the owner by recurrente_subscription_id or metadata
  // Recurrente sends customer email or metadata we embed at checkout creation
  const recurrenteSubId  = subscription.id            as string | undefined;
  const customerEmail    = (subscription.customer as Record<string, unknown>)?.email as string | undefined;
  const metadataOwnerId  = (subscription.metadata as Record<string, unknown>)?.owner_id as string | undefined;

  // Resolve owner_id: prefer metadata, fallback to email lookup
  let ownerId: string | null = metadataOwnerId ?? null;

  if (!ownerId && customerEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .single();
    ownerId = profile?.id ?? null;
  }

  if (!ownerId) {
    console.error('Could not resolve owner_id for event', eventType, eventId);
    // Return 200 so Recurrente doesn't keep retrying for unresolvable events
    return new Response('Owner not found — ignored', { status: 200 });
  }

  // Deduplicate: skip if this exact event was already processed
  if (eventId) {
    const { data: existing } = await supabase
      .from('subscription_events')
      .select('id')
      .eq('recurrente_id', eventId)
      .single();

    if (existing) {
      return new Response('Duplicate event — ignored', { status: 200 });
    }
  }

  // Log the event (append-only)
  await supabase.from('subscription_events').insert({
    owner_id:       ownerId,
    event_type:     eventType,
    recurrente_id:  eventId ?? null,
    payload,
  });

  // Handle each event type
  switch (eventType) {
    case 'subscription.create': {
      // New paying subscription — activate Pro
      const periodStart = subscription.current_period_start as string | undefined;
      const periodEnd   = subscription.current_period_end   as string | undefined;

      await supabase.from('subscriptions').upsert({
        owner_id:                   ownerId,
        plan:                       'pro',
        status:                     'active',
        recurrente_subscription_id: recurrenteSubId ?? null,
        recurrente_product_id:      subscription.product_id as string ?? null,
        current_period_start:       periodStart ?? null,
        current_period_end:         periodEnd   ?? null,
        updated_at:                 new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', ownerId);

      // Aumentar límite de tokens de IA a plan Pro (200,000/mes)
      await supabase
        .from('ai_rate_limits')
        .update({ max_tokens: 200000 })
        .eq('owner_id', ownerId);

      break;
    }

    case 'subscription.cancel': {
      // Subscription cancelled — downgrade to free
      await supabase.from('subscriptions').upsert({
        owner_id:  ownerId,
        plan:      'free',
        status:    'cancelled',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', ownerId);

      // Reducir límite de tokens de IA a plan gratuito (30,000/mes)
      await supabase
        .from('ai_rate_limits')
        .update({ max_tokens: 30000 })
        .eq('owner_id', ownerId);

      break;
    }

    case 'subscription.past_due': {
      await supabase.from('subscriptions').upsert({
        owner_id:  ownerId,
        plan:      'pro',
        status:    'past_due',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });
      break;
    }

    case 'subscription.paused': {
      await supabase.from('subscriptions').upsert({
        owner_id:  ownerId,
        plan:      'free',
        status:    'paused',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', ownerId);

      // Reducir límite de tokens de IA a plan gratuito (30,000/mes)
      await supabase
        .from('ai_rate_limits')
        .update({ max_tokens: 30000 })
        .eq('owner_id', ownerId);

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
