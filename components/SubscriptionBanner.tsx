import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { authStore } from '../services/authStore';

interface SubscriptionBannerProps {
  onNavigate: (page: string) => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [, forceUpdate]           = useState(0);

  useEffect(() => {
    const unsub = authStore.onAuthReady(() => forceUpdate(n => n + 1));
    return unsub;
  }, []);

  const currentUser = authStore.getCurrentUser();
  const isPro       = authStore.isPro();

  const handleCheckout = async () => {
    setLoading(true);
    await authStore.startCheckout();
    setLoading(false);
  };

  if (!currentUser || currentUser.role !== 'nutricionista' || isPro || dismissed) {
    return null;
  }

  return (
    <div className="relative flex items-center justify-center gap-3 bg-amber-500 text-white px-4 py-2.5 text-sm font-medium flex-shrink-0">
      <Zap className="w-4 h-4 shrink-0" />
      <span>
        Plan Básico —{' '}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="underline underline-offset-2 font-bold hover:text-amber-100 transition-colors disabled:opacity-60"
        >
          {loading ? 'Redirigiendo...' : 'Suscríbete a Pro para acceso ilimitado'}
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
