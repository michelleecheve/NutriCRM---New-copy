// Supabase Edge Function — recurrente-webhook
// Receives subscription event webhooks from Recurrente payment platform.
// Updates subscriptions table and profiles.plan on payment events.
//
// Deploy: supabase functions deploy recurrente-webhook
// Secrets: supabase secrets set RECURRENTE_SECRET_KEY=sk_live_xxx
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
    console.error('Unauthorized: invalid X-SECRET-KEY');
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Recurrente sends event_type at the root (not "type")
  const eventType = payload.event_type as string;
  // Recurrente event ID is at payload.id (e.g. "se_8qhwyjaw")
  const eventId   = payload.id as string;

  if (!eventType) {
    console.error('Missing event_type in payload', JSON.stringify(payload));
    return new Response('Missing event_type', { status: 400 });
  }

  // Extract owner info — structure differs per event type:
  //   setup_intent.succeeded → customer email at payload.customer.email
  //                          → owner_id at payload.checkout.metadata.owner_id
  //                          → subscription id at payload.subscription.id
  //   subscription.create   → customer email at payload.customer_email (root)
  //                          → no metadata owner_id, resolve via email
  //                          → subscription id = payload.id (root)

  const checkout  = payload.checkout   as Record<string, unknown> | undefined;
  const metadata  = checkout?.metadata as Record<string, unknown> | undefined;
  const customer  = payload.customer   as Record<string, unknown> | undefined;
  const subObj    = payload.subscription as Record<string, unknown> | undefined;

  // Subscription ID: explicit object first, else root id (subscription.create)
  const recurrenteSubId = (
    subObj?.id as string | undefined
    ?? (eventType === 'subscription.create' ? eventId : undefined)
  );

  const metadataOwnerId = metadata?.owner_id as string | undefined;

  // Customer email: try both locations
  const customerEmail = (
    payload.customer_email as string | undefined
    ?? customer?.email    as string | undefined
  );

  // Resolve owner_id: prefer metadata, fallback to email lookup
  let ownerId: string | null = metadataOwnerId ?? null;

  if (!ownerId && customerEmail && customerEmail.includes('@')) {
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
    owner_id:      ownerId,
    event_type:    eventType,
    recurrente_id: eventId ?? null,
    payload,
  });

  // Handle each event type
  switch (eventType) {

    // setup_intent.succeeded = payment method confirmed, subscription just created
    case 'setup_intent.succeeded':
    case 'subscription.create': {
      await supabase.from('subscriptions').upsert({
        owner_id:                   ownerId,
        plan:                       'pro',
        status:                     'active',
        recurrente_subscription_id: recurrenteSubId ?? null,
        updated_at:                 new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', ownerId);

      await supabase
        .from('ai_rate_limits')
        .update({ max_tokens: 200000 })
        .eq('owner_id', ownerId);

      console.log(`Activated Pro for owner ${ownerId} via ${eventType}`);
      break;
    }

    case 'subscription.cancel': {
      await supabase.from('subscriptions').upsert({
        owner_id:   ownerId,
        plan:       'free',
        status:     'cancelled',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', ownerId);

      await supabase
        .from('ai_rate_limits')
        .update({ max_tokens: 30000 })
        .eq('owner_id', ownerId);

      break;
    }

    case 'subscription.past_due': {
      await supabase.from('subscriptions').upsert({
        owner_id:   ownerId,
        plan:       'pro',
        status:     'past_due',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });
      break;
    }

    case 'subscription.paused': {
      await supabase.from('subscriptions').upsert({
        owner_id:   ownerId,
        plan:       'free',
        status:     'paused',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id' });

      await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', ownerId);

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
