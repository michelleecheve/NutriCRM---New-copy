import { createClient } from 'npm:@supabase/supabase-js@2.34.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { owner_id } = body;

    // 1. Validar owner_id
    if (!owner_id) {
      return new Response(
        JSON.stringify({ error: 'owner_id requerido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Evitar duplicados
    const { data: existing } = await supabase
      .from('ai_rate_limits')
      .select('id')
      .eq('owner_id', owner_id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Rate limit already exists for this user' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Crear rate limit con valores fijos (el usuario no los controla)
    const resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('ai_rate_limits')
      .insert({
        owner_id,
        max_tokens: 30000,
        max_requests_per_minute: 3,
        tokens: 0,
        reset_at: resetAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});