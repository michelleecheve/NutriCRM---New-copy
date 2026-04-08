import React, { useState, useEffect } from 'react';
import { Sparkles, BarChart3, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { authStore } from '../../services/authStore';

const MS_PER_CYCLE = 30 * 24 * 60 * 60 * 1000;

// Calcula el inicio y fin del ciclo actual basado en created_at
function computeCycle(createdAt: string): { cycleStart: Date; nextReset: Date } {
  const start = new Date(createdAt).getTime();
  const now = Date.now();
  const cyclesCompleted = Math.floor((now - start) / MS_PER_CYCLE);
  return {
    cycleStart: new Date(start + cyclesCompleted * MS_PER_CYCLE),
    nextReset:  new Date(start + (cyclesCompleted + 1) * MS_PER_CYCLE),
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const ProfileAIConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rateLimit, setRateLimit] = useState<any>(null);
  const user = authStore.getCurrentUser();

  useEffect(() => {
    if (user) fetchRateLimit();
  }, [user]);

  const fetchRateLimit = async () => {
    try {
      const data = await supabaseService.getAIRateLimit(user!.id);
      setRateLimit(data ?? null);
    } catch (error) {
      console.error('Error fetching AI rate limit:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPro = authStore.isPro();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Calcular ciclo actual desde created_at (fuente de verdad)
  const cycle = rateLimit?.created_at ? computeCycle(rateLimit.created_at) : null;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Sparkles className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-800">Ai Configurator</h3>
      </div>

      {!rateLimit ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="font-semibold text-slate-700">La IA se activa automáticamente en tu primer uso.</p>
          <p className="text-slate-400 text-sm">
            Tu uso aparecerá aquí una vez que generes tu primer menú o interpretes un laboratorio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consumo de tokens */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-700">Consumo de Tokens</span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Activo
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Tokens Utilizados</span>
                <span className="text-slate-800 font-bold">
                  {rateLimit.tokens.toLocaleString()} / {rateLimit.max_tokens.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (rateLimit.tokens / rateLimit.max_tokens) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-right">
                Límite de tokens asignado para tu cuenta.
              </p>
              <p className="text-[10px] text-slate-400 text-right">
                Velocidad: {rateLimit.max_requests_per_minute} req/min
              </p>
            </div>
          </div>

          {/* Ciclo y fechas */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center gap-4">
            {cycle && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex-shrink-0">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inicio del ciclo actual</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(cycle.cycleStart)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Próximo reinicio</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(cycle.nextReset)}</p>
                    <p className="text-[10px] text-slate-400">Ciclos de 30 días desde activación</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info de plan */}
      {!isPro && rateLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Plan gratuito: <span className="font-semibold">30,000 tokens/mes</span>. Actualiza a Pro para obtener 200,000 tokens/mes.
        </div>
      )}
    </div>
  );
};
