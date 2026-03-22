import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, BarChart3, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { authStore } from '../../services/authStore';

export const ProfileAIConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rateLimit, setRateLimit] = useState<any>(null);
  const user = authStore.getCurrentUser();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (user) {
      fetchRateLimit();
    }
  }, [user]);

  const fetchRateLimit = async () => {
    try {
      const data = await supabaseService.getAIRateLimit(user!.id);
      setRateLimit(data);
    } catch (error) {
      console.error('Error fetching AI rate limit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAI = async () => {
    setProcessing(true);
    try {
      const data = await supabaseService.createAIRateLimit(user!.id);
      setRateLimit(data);
    } catch (error) {
      console.error('Error enabling AI:', error);
      alert('Error al habilitar la IA. Por favor intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Sparkles className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-800">Ai Configurator</h3>
      </div>

      {!rateLimit ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-emerald-100 p-4 rounded-2xl">
            <Zap className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-bold text-slate-800 text-lg">Habilitar Funciones de IA</h4>
            <p className="text-slate-500 text-sm mt-1">
              Activa las capacidades de Inteligencia Artificial para generar menús personalizados, interpretar laboratorios y más.
            </p>
          </div>
          <button
            onClick={handleEnableAI}
            disabled={processing}
            className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Habilitar AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Velocidad</p>
                <p className="text-lg font-bold text-slate-800">
                  {rateLimit.max_requests_per_minute} req/min
                </p>
              </div>
            </div>
            
            {rateLimit.reset_at && (
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Próximo Reinicio</p>
                  <p className="text-sm font-bold text-slate-800">
                    {formatDate(rateLimit.reset_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
