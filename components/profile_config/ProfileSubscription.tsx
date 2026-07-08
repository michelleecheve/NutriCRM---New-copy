import React, { useState } from 'react';
import { authStore } from '../../services/authStore';
import { Zap, CheckCircle, AlertCircle, CreditCard, Star, ChevronDown, XCircle, RefreshCw, Clock } from 'lucide-react';

export const ProfileSubscription: React.FC = () => {
  const sub   = authStore.getSubscription();
  const isPro = authStore.isPro();

  const [isOpen, setIsOpen]                   = useState(!isPro);
  const [isLoading, setIsLoading]             = useState(false);
  const [msg, setMsg]                         = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const statusLabel = () => {
    if (!sub || sub.status === 'free')     return { text: 'Plan Básico',    color: 'text-slate-500',   bg: 'bg-slate-100'   };
    if (sub.status === 'active')           return { text: 'Pro Activo',     color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (sub.status === 'cancelled_pending') return {
      text: `Pro · Cancela el ${formatDate(sub.current_period_end)}`,
      color: 'text-amber-700', bg: 'bg-amber-100',
    };
    if (sub.status === 'past_due')         return { text: 'Pago pendiente', color: 'text-red-700',     bg: 'bg-red-100'     };
    if (sub.status === 'paused')           return { text: 'Pausado',        color: 'text-orange-700',  bg: 'bg-orange-100'  };
    if (sub.status === 'cancelled')        return { text: 'Cancelado',      color: 'text-slate-500',   bg: 'bg-slate-100'   };
    return { text: sub.status, color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  const badge = statusLabel();

  const handleUpgrade = async () => {
    setIsLoading(true);
    setMsg(null);
    const result = await authStore.startCheckout();
    if (!result.ok) setMsg(result.message ?? 'Error al crear el checkout. Intenta de nuevo.');
    setIsLoading(false);
  };

  const handleUpdateCard = async () => {
    setIsLoading(true);
    setMsg(null);
    const result = await authStore.updatePaymentMethod();
    if (!result.ok) {
      setMsg(result.message ?? 'Error al actualizar tarjeta.');
      setIsLoading(false);
    }
    // En éxito, updatePaymentMethod ya redirige — no hace falta setIsLoading(false) aquí.
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setMsg(null);
    const result = await authStore.cancelSubscription();
    if (result.ok) {
      setMsg(`Suscripción cancelada. Tu acceso Pro continúa hasta el ${formatDate(result.access_until ?? null)}.`);
      setShowCancelConfirm(false);
    } else {
      setMsg(result.message ?? 'Error al cancelar.');
    }
    setIsLoading(false);
  };

  const isCancelledPending = sub?.status === 'cancelled_pending';
  const showCancelButton   = (sub?.status === 'active' || sub?.status === 'past_due') && !isCancelledPending && !showCancelConfirm;
  const showCardButton     = !!sub?.recurrente_subscription_id && (sub?.status === 'active' || sub?.status === 'past_due' || isCancelledPending);

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
            {/* Básico */}
            <div className={`rounded-xl border-2 p-4 space-y-3 ${!isPro ? 'border-slate-300 bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Básico</span>
                {!isPro && <span className="text-xs bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">Plan actual</span>}
              </div>
              <p className="text-2xl font-black text-slate-800">$0 <span className="text-sm font-normal text-slate-400">/mes</span></p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> Hasta 10 pacientes activos</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> Hasta 20 citas en calendario</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400 shrink-0" /> Hasta 20 facturas registradas</li>
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
              </ul>
            </div>
          </div>

          {/* Subscription period info — only when Pro or cancelled_pending */}
          {isPro && (sub?.current_period_start || sub?.current_period_end) && (
            <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Inicio</p>
                <p className="font-semibold text-slate-700">{formatDate(sub?.current_period_start ?? null) || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{isCancelledPending ? 'Acceso hasta' : 'Próximo cobro'}</p>
                <p className="font-semibold text-slate-700">{formatDate(sub?.current_period_end ?? null) || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Renovación</p>
                {isCancelledPending
                  ? <p className="font-semibold text-amber-600">Cancelada</p>
                  : <p className="font-semibold text-emerald-600">Activa ✓</p>
                }
              </div>
            </div>
          )}

          {/* past_due warning */}
          {sub?.status === 'past_due' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Pago pendiente</p>
                <p className="text-xs text-red-600">Tu suscripción tiene un pago sin completar. Para resolverlo, actualiza tu tarjeta de pago abajo.</p>
              </div>
            </div>
          )}

          {/* cancelled_pending info */}
          {isCancelledPending && sub?.current_period_end && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700">Suscripción cancelada — acceso activo</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Tu acceso Pro continuará hasta el <strong>{formatDate(sub.current_period_end)}</strong>. Después pasarás al Plan Básico automáticamente. Tus datos nunca se eliminan.
                </p>
              </div>
            </div>
          )}

          {/* Cambiar tarjeta */}
          {showCardButton && (
            <button
              type="button"
              onClick={handleUpdateCard}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {isLoading ? 'Redirigiendo...' : 'Cambiar tarjeta de pago'}
            </button>
          )}

          {/* Cancel confirmation */}
          {showCancelConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-700">¿Confirmar cancelación?</p>
              <p className="text-xs text-red-600">
                Tu acceso Pro continuará hasta el <strong>{formatDate(sub?.current_period_end ?? null)}</strong>. Después pasarás al Plan Básico automáticamente. Tus datos no se eliminarán.
              </p>
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
            {!isPro && (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20 text-sm disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {isLoading ? 'Redirigiendo...' : 'Suscribirse a Pro'}
              </button>
            )}

            {showCancelButton && (
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

          {msg && (
            <p className={`text-sm font-medium px-1 ${msg.includes('cancelada') ? 'text-amber-600' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
