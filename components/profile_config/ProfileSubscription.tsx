import React, { useState } from 'react';
import { authStore } from '../../services/authStore';
import { Zap, CheckCircle, Clock, AlertCircle, CreditCard, Star, ChevronDown, XCircle, RefreshCw } from 'lucide-react';

export const ProfileSubscription: React.FC = () => {
  const [isOpen, setIsOpen]           = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [trialMsg, setTrialMsg]       = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const sub         = authStore.getSubscription();
  const isPro       = authStore.isPro();
  const isTrialing  = authStore.isOnTrial();
  const daysLeft    = authStore.trialDaysLeft();
  const hasUsedTrial = authStore.hasUsedTrial();

  const statusLabel = () => {
    if (!sub || sub.status === 'free') return { text: 'Plan Gratuito', color: 'text-slate-500', bg: 'bg-slate-100' };
    if (sub.status === 'trialing')     return { text: `Trial · ${daysLeft} días restantes`, color: 'text-amber-700', bg: 'bg-amber-100' };
    if (sub.status === 'active')       return { text: 'Pro Activo', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (sub.status === 'past_due')     return { text: 'Pago pendiente', color: 'text-red-700', bg: 'bg-red-100' };
    if (sub.status === 'paused')       return { text: 'Pausado', color: 'text-orange-700', bg: 'bg-orange-100' };
    if (sub.status === 'cancelled')    return { text: 'Cancelado', color: 'text-slate-500', bg: 'bg-slate-100' };
    return { text: sub.status, color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  const badge = statusLabel();

  const handleUpgrade = async () => {
    setIsLoading(true);
    setTrialMsg(null);
    if (!hasUsedTrial && sub?.status !== 'past_due') {
      // First time: activate internal trial (no payment required)
      const result = await authStore.startTrial();
      if (!result.ok) setTrialMsg(result.message ?? 'Error al activar el trial. Intenta de nuevo.');
    } else {
      // Already used trial or past_due: go to Recurrente checkout
      const result = await authStore.startCheckout();
      if (!result.ok) setTrialMsg(result.message ?? 'Error al crear el checkout. Intenta de nuevo.');
    }
    setIsLoading(false);
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setTrialMsg(null);
    const result = await authStore.cancelSubscription();
    if (result.ok) {
      setTrialMsg('Suscripción cancelada. Tu cuenta ha regresado al plan gratuito.');
      setShowCancelConfirm(false);
    } else {
      setTrialMsg(result.message ?? 'Error al cancelar.');
    }
    setIsLoading(false);
  };

  const isActiveProOrTrial = isPro && (sub?.status === 'active' || sub?.status === 'trialing');
  const hasPaidSubscription = sub?.status === 'active' && sub?.recurrente_subscription_id;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between pb-2 border-b border-slate-100 group"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Suscripción</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
            {badge.text}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-4">

          {/* Plan comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free */}
            <div className={`rounded-xl border-2 p-4 space-y-3 ${!isPro ? 'border-slate-300 bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Gratuito</span>
                {!isPro && <span className="text-xs bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">Plan actual</span>}
              </div>
              <p className="text-2xl font-black text-slate-800">$0 <span className="text-sm font-normal text-slate-400">/mes</span></p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> Hasta 10 pacientes activos</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> Hasta 20 citas en calendario</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> Hasta 20 facturas registradas</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> IA: 30,000 tokens/mes</li>
              </ul>
            </div>

            {/* Pro */}
            <div className={`rounded-xl border-2 p-4 space-y-3 ${isPro ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-emerald-700">Pro</span>
                </div>
                {isPro && <span className="text-xs bg-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Plan actual</span>}
              </div>
              <p className="text-2xl font-black text-slate-800">$32 <span className="text-sm font-normal text-slate-400">USD/mes</span></p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Pacientes ilimitados</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Citas ilimitadas</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Facturas ilimitadas</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> IA: 200,000 tokens/mes</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 14 días de prueba gratis</li>
              </ul>
            </div>
          </div>

          {/* past_due warning */}
          {sub?.status === 'past_due' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Pago pendiente</p>
                <p className="text-xs text-red-600">Tu suscripción tiene un pago sin completar. Para resolverlo, cancela tu suscripción actual y vuelve a suscribirte con un método de pago válido.</p>
              </div>
            </div>
          )}

          {/* Trial countdown */}
          {isTrialing && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700">Trial activo — {daysLeft} días restantes</p>
                <p className="text-xs text-amber-600">Al terminar el trial, tu cuenta regresará al plan gratuito si no tienes suscripción activa.</p>
              </div>
            </div>
          )}

          {/* Change payment method info (only for active paid subscriptions) */}
          {hasPaidSubscription && (
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <RefreshCw className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-600">¿Cambiar método de pago?</p>
                <p className="text-xs text-slate-500">Cancela tu suscripción actual y vuelve a suscribirte. Tus datos no se eliminan.</p>
              </div>
            </div>
          )}

          {/* Cancel confirmation */}
          {showCancelConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-700">¿Confirmar cancelación?</p>
              <p className="text-xs text-red-600">Tu acceso Pro terminará inmediatamente. Tus datos no se eliminarán.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Volver
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {(!isPro || sub?.status === 'past_due') && (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20 text-sm disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {isLoading
                  ? (sub?.status === 'past_due' || hasUsedTrial ? 'Redirigiendo...' : 'Activando...')
                  : sub?.status === 'past_due'
                    ? 'Nueva suscripción'
                    : !hasUsedTrial
                      ? 'Prueba Gratis 14 Días'
                      : 'Suscribirse a Pro'
                }
              </button>
            )}

            {isActiveProOrTrial && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-red-500 border border-red-200 font-bold rounded-xl hover:bg-red-50 transition-all text-sm disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancelar suscripción
              </button>
            )}
          </div>

          {trialMsg && (
            <p className={`text-sm font-medium px-1 ${trialMsg.includes('activado') || trialMsg.includes('cancelada') ? 'text-emerald-600' : 'text-red-600'}`}>
              {trialMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
