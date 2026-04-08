// services/aiService.ts
import { authStore } from './authStore';

export interface AIResponse {
  output: any;
  tokens: number;
  price_usd: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const aiService = {
  async invokeGemini(
    promptOrParts: string | any[],
    category: 'menu' | 'labs' | 'general' = 'general',
    systemInstruction?: string
  ): Promise<AIResponse> {
    const currentUser = authStore.getCurrentUser();
    if (!currentUser) throw new Error('No hay sesión activa.');

    const body: any = typeof promptOrParts === 'string'
      ? { prompt: promptOrParts, category, owner_id: currentUser.id }
      : { parts: promptOrParts, category, owner_id: currentUser.id };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('nutriflow-plan-limit-ai'));
        throw new Error('Límite de tokens de IA excedido.');
      }
      if (res.status === 403) throw new Error('Configuración de IA no habilitada.');
      throw new Error(`Error ${res.status}: ${errText}`);
    }

    return res.json();
  }
};