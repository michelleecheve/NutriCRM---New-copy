import { createClient } from 'npm:@supabase/supabase-js@2.34.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
const GEMINI_PRICE_PER_1K_OUTPUT = 0.0004;

// Límites por plan — fuente de verdad en el servidor, NO en la columna max_tokens del DB
const FREE_MAX_TOKENS = 30000;
const PRO_MAX_TOKENS  = 200000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
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
    const { prompt, parts, category, owner_id, systemInstruction } = body;

    // 1. Validar owner_id
    if (!owner_id) {
      return new Response(
        JSON.stringify({ error: 'owner_id requerido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validar que haya contenido
    if (!prompt && !parts) {
      return new Response(
        JSON.stringify({ error: 'prompt or parts required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptCategory = category || 'general';
    const contents = parts ? [{ parts }] : [{ parts: [{ text: prompt }] }];

    // 3. Buscar rate limits del usuario
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from('ai_rate_limits')
      .select('*')
      .eq('owner_id', owner_id)
      .single();

    if (rateLimitError || !rateLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limits not configured for this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Reset mensual automático
    const now = new Date();
    const resetAt = rateLimit.reset_at ? new Date(rateLimit.reset_at) : null;
    const isNewMonth =
      !resetAt ||
      now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
      now.getUTCMonth() !== resetAt.getUTCMonth();

    if (isNewMonth) {
      const newResetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      await supabase
        .from('ai_rate_limits')
        .update({ tokens: 0, reset_at: newResetAt })
        .eq('owner_id', owner_id);

      rateLimit.tokens = 0;
      rateLimit.reset_at = newResetAt;
    }

    // 5. Construir body para Gemini
    const geminiBody: any = { contents };
    if (systemInstruction) {
      geminiBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    // 6. Llamar a Gemini
    const geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiBody)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini error: ${geminiRes.status} ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json();

    // 7. Contar tokens
    let tokens = 0;
    if (geminiData.usageMetadata?.candidatesTokenCount) {
      tokens = geminiData.usageMetadata.candidatesTokenCount;
    } else if (geminiData.candidates?.[0]?.tokenCount) {
      tokens = geminiData.candidates[0].tokenCount;
    } else if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      tokens = Math.ceil(geminiData.candidates[0].content.parts[0].text.length / 4);
    }

    // 8. Verificar límite ANTES de guardar
    // El límite se determina por el plan en 'subscriptions', NO por max_tokens del DB
    // Así un usuario no puede hackear su límite modificando max_tokens en SQL
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('owner_id', owner_id)
      .maybeSingle();

    const isPro = subscription?.plan === 'pro' && ['active', 'trialing'].includes(subscription?.status ?? '');
    const maxTokens = isPro ? PRO_MAX_TOKENS : FREE_MAX_TOKENS;

    const currentTokens = rateLimit.tokens ?? 0;
    if (currentTokens + tokens > maxTokens) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cost = Number(((tokens / 1000) * GEMINI_PRICE_PER_1K_OUTPUT).toFixed(6));

    // 9. Guardar en ai_prompts
    await supabase.from('ai_prompts').insert([{
      owner_id,
      category: promptCategory,
      model: GEMINI_MODEL,
      prompt: parts ? { parts } : { input: prompt },
      response: geminiData,
      tokens,
      cost,
      duration_ms: null
    }]);

    // 10. Actualizar tokens usados
    await supabase
      .from('ai_rate_limits')
      .update({ tokens: currentTokens + tokens })
      .eq('owner_id', owner_id);

    // 11. Responder
    return new Response(
      JSON.stringify({ output: geminiData, tokens, price_usd: cost }),
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