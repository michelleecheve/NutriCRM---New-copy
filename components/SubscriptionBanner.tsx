import React, { useState } from 'react';
import { X, Zap, Rocket } from 'lucide-react';
import { authStore } from '../services/authStore';

interface SubscriptionBannerProps {
  onNavigate: (page: string) => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading]     = useState(false);

  const currentUser  = authStore.getCurrentUser();
  const isPro        = authStore.isPro();
  const isTrialing   = authStore.isOnTrial();
  const hasUsedTrial = authStore.hasUsedTrial();

  // Solo visible para nutricionistas no-Pro (incluyendo los que están en trial no, solo free)
  if (!currentUser || currentUser.role !== 'nutricionista' || isPro || isTrialing || dismissed) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    await authStore.startCheckout();
    setLoading(false);
  };

  if (!hasUsedTrial) {
    // Nunca hicieron trial
    return (
      <div className="relative flex items-center justify-center gap-3 bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium flex-shrink-0">
        <Rocket className="w-4 h-4 shrink-0" />
        <span>
          Plan Gratuito —{' '}
          <button
            onClick={handleClick}
            disabled={loading}
            className="underline underline-offset-2 font-bold hover:text-emerald-100 transition-colors disabled:opacity-60"
          >
            {loading ? 'Redirigiendo...' : 'prueba 14 días gratis aquí'}
          </button>
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
          onClick={handleClick}
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
