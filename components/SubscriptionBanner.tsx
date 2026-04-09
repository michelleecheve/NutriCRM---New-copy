import React, { useState, useEffect } from 'react';
import { X, Zap, Rocket } from 'lucide-react';
import { authStore } from '../services/authStore';

interface SubscriptionBannerProps {
  onNavigate: (page: string) => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  // Re-render when authStore finishes loading the subscription
  useEffect(() => {
    const unsub = authStore.onAuthReady(() => forceUpdate(n => n + 1));
    return unsub;
  }, []);

  const currentUser  = authStore.getCurrentUser();
  const isPro        = authStore.isPro();
  const isTrialing   = authStore.isOnTrial();
  const hasUsedTrial = authStore.hasUsedTrial();

  const handleTrial = async () => {
    setLoading(true);
    setTrialError(null);
    const result = await authStore.startTrial();
    if (!result.ok) setTrialError(result.message ?? 'Error al activar el trial.');
    setLoading(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    await authStore.startCheckout();
    setLoading(false);
  };

  // Solo visible para nutricionistas no-Pro
  if (!currentUser || currentUser.role !== 'nutricionista' || (isPro && !isTrialing) || dismissed) {
    return null;
  }

  const daysLeft = authStore.trialDaysLeft();

  if (isTrialing) {
    return (
      <div className="relative flex items-center justify-center gap-3 bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex-shrink-0">
        <Rocket className="w-4 h-4 shrink-0" />
        <span>
          Cuenta en Trial Activo · {daysLeft} días restantes, ¿Te está gustando NutriFlow?{' '}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="underline underline-offset-2 font-bold hover:text-indigo-100 transition-colors disabled:opacity-60"
          >
            {loading ? 'Redirigiendo...' : 'Suscríbete a Pro aquí'}
          </button>
          {' '}y mantén todos tus beneficios sin interrupciones.
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 p-1 hover:bg-indigo-700 rounded transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!hasUsedTrial) {
    // Nunca hicieron trial
    return (
      <div className="relative flex items-center justify-center gap-3 bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium flex-shrink-0">
        <Rocket className="w-4 h-4 shrink-0" />
        <span>
          Plan Gratuito —{' '}
          <button
            onClick={handleTrial}
            disabled={loading}
            className="underline underline-offset-2 font-bold hover:text-emerald-100 transition-colors disabled:opacity-60"
          >
            {loading ? 'Activando...' : 'prueba 14 días gratis aquí'}
          </button>
          {trialError && <span className="ml-2 text-red-200 text-xs">{trialError}</span>}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 p-1 hover:bg-emerald-700 rounded transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Ya usaron trial, ahora en plan gratuito
  return (
    <div className="relative flex items-center justify-center gap-3 bg-amber-500 text-white px-4 py-2.5 text-sm font-medium flex-shrink-0">
      <Zap className="w-4 h-4 shrink-0" />
      <span>
        Estás usando la versión gratuita.{' '}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="underline underline-offset-2 font-bold hover:text-amber-100 transition-colors disabled:opacity-60"
        >
          {loading ? 'Redirigiendo...' : 'Suscríbete a Pro para acceso completo'}
        </button>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 p-1 hover:bg-amber-600 rounded transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
