import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { authStore } from '../services/authStore';

type VerifyStatus = 'checking' | 'confirmed' | 'timeout';

export const CheckoutSuccess: React.FC<{ onGoToProfile: () => void }> = ({ onGoToProfile }) => {
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('checking');

  useEffect(() => {
    window.history.replaceState({}, '', '/checkout-success');

    let attempts = 0;
    const MAX_ATTEMPTS = 5; // 5 × 2s = 10s

    const poll = async () => {
      await authStore.refreshSubscription();
      const sub = authStore.getSubscription();
      if (sub?.status === 'active' || sub?.plan === 'pro') {
        setVerifyStatus('confirmed');
        return;
      }
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setVerifyStatus('timeout');
        return;
      }
      setTimeout(poll, 2000);
    };

    poll();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 max-w-md w-full p-8 text-center space-y-6">

        {/* Icono */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            {verifyStatus === 'checking'
              ? <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              : <CheckCircle className="w-10 h-10 text-emerald-500" />
            }
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800">
            {verifyStatus === 'checking'  ? 'Verificando tu pago...'    : 'Pago exitoso'}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {verifyStatus === 'checking' && 'Estamos confirmando tu suscripción. Esto toma unos segundos.'}
            {verifyStatus === 'confirmed' && <>Tu suscripción <span className="font-bold text-emerald-600">NutriFlow Pro</span> está activa. ¡Bienvenida al plan completo!</>}
            {verifyStatus === 'timeout'  && 'Tu pago fue procesado. Si tu plan no aparece actualizado, recarga la página en unos minutos.'}
          </p>
        </div>

        {/* Beneficios */}
        <div className="bg-emerald-50 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Lo que tienes ahora
          </p>
          <ul className="space-y-1.5 text-sm text-emerald-800">
            <li>Pacientes ilimitados</li>
            <li>Citas y facturas ilimitadas</li>
            <li>200,000 tokens de IA por mes</li>
          </ul>
        </div>

        {/* CTA — solo visible cuando ya confirmado o timeout */}
        {verifyStatus !== 'checking' && (
          <button
            type="button"
            onClick={() => { window.location.href = 'https://www.nutrifollow.app'; }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20"
          >
            Entrar a NutriFlow
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {verifyStatus === 'timeout' && (
          <p className="text-xs text-slate-400">
            Si tu plan no aparece actualizado en unos minutos, recarga la página.
          </p>
        )}
      </div>
    </div>
  );
};
