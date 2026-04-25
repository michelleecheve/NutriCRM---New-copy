import React, { useEffect, useState } from 'react';
import { X, Rocket, Zap, Lock, BrainCircuit } from 'lucide-react';
import { authStore } from '../services/authStore';

export const PLAN_LIMIT_EVENT    = 'nutriflow-plan-limit';
export const PLAN_LIMIT_AI_EVENT = 'nutriflow-plan-limit-ai';

/** Dispatch this from anywhere to show the plan-limit popup. */
export function showPlanLimitModal() {
  window.dispatchEvent(new CustomEvent(PLAN_LIMIT_EVENT));
}

export const PlanLimitModal: React.FC = () => {
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [isAILimit, setIsAILimit]   = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  const hasUsedTrial = authStore.hasUsedTrial();
  const isPro        = authStore.isPro();

  useEffect(() => {
    const handler    = () => { setIsAILimit(false); setOpen(true); };
    const handlerAI  = () => { setIsAILimit(true);  setOpen(true); };
    window.addEventListener(PLAN_LIMIT_EVENT,    handler);
    window.addEventListener(PLAN_LIMIT_AI_EVENT, handlerAI);
    return () => {
      window.removeEventListener(PLAN_LIMIT_EVENT,    handler);
      window.removeEventListener(PLAN_LIMIT_AI_EVENT, handlerAI);
    };
  }, []);

  if (!open) return null;

  const handleTrial = async () => {
    setLoading(true);
    setTrialError(null);
    const result = await authStore.startTrial();
    if (result.ok) { setOpen(false); }
    else { setTrialError(result.message ?? 'Error al activar el trial.'); }
    setLoading(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    await authStore.startCheckout();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isAILimit ? 'bg-violet-100' : 'bg-amber-100'}`}>
            {isAILimit
              ? <BrainCircuit className="w-7 h-7 text-violet-500" />
              : <Lock className="w-7 h-7 text-amber-500" />
            }
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-slate-800 mb-1">
          {isAILimit ? 'Límite de tokens de IA' : 'Límite del plan gratuito'}
        </h2>
        <p className="text-center text-slate-500 text-sm mb-5">
          {isAILimit
            ? isPro
              ? 'Has usado los 200,000 tokens de IA de este mes. Se reinician el próximo mes.'
              : 'Has usado los 30,000 tokens de IA gratuitos de este mes.'
            : 'Has llegado al límite de tu plan gratuito.'
          }
        </p>

        {isAILimit && isPro ? (
          <button
            onClick={() => setOpen(false)}
            className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
          >
            Entendido
          </button>
        ) : !hasUsedTrial ? (
          <>
            <p className="text-center text-sm text-slate-600 mb-5">
              {isAILimit
                ? <>Activa tu prueba gratuita de <span className="font-semibold text-emerald-600">14 días</span> y obtén <span className="font-semibold text-emerald-600">200,000 tokens de IA</span> al mes.</>
                : <>Activa tu prueba gratuita de <span className="font-semibold text-emerald-600">14 días</span> y accede a todas las funciones sin restricciones.</>
              }
            </p>
            {trialError && <p className="text-center text-xs text-red-500 mb-3">{trialError}</p>}
            <button
              onClick={handleTrial}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              {loading ? 'Activando...' : 'Activar 14 días gratis'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Ahora no
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-slate-600 mb-5">
              {isAILimit
                ? <>Suscríbete a <span className="font-semibold text-amber-600">Plan Pro</span> para obtener <span className="font-semibold">200,000 tokens de IA</span> al mes.</>
                : <>Tu trial ya fue utilizado. Suscríbete a <span className="font-semibold text-amber-600">Plan Pro</span> para continuar sin límites.</>
              }
            </p>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Redirigiendo...' : 'Actualizar a suscripción Pro'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Ahora no
            </button>
          </>
        )}
      </div>
    </div>
  );
};
