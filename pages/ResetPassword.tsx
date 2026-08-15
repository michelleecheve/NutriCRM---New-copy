import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { supabase } from '../services/supabase';
import { authStore } from '../services/authStore';

interface ResetPasswordProps {
  onSuccess: () => void;
}

// 'checking'  → verificando si esta carga de página tiene una sesión de recuperación válida
// 'invalid'   → no hay un link de recuperación válido (no vino de un correo, ya expiró o ya se usó)
// 'form'      → sesión de recovery válida, se puede elegir la nueva contraseña
// 'success'   → contraseña actualizada
type ViewState = 'checking' | 'invalid' | 'form' | 'success';

const CARD_WRAPPER = 'min-h-screen flex items-center justify-center p-6 relative';
const BACKGROUND_STYLE: React.CSSProperties = { backgroundImage: 'url(/backgroundimage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' };

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess }) => {
  const [view, setView] = useState<ViewState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verifica que esta carga de página realmente venga de un link de recuperación
  // de Supabase y que ese link haya producido una sesión de recovery válida.
  // Nunca confiamos en window.location por sí solo ni en que "haya una sesión" a
  // secas: authStore.isPasswordRecovery() se calculó de forma síncrona a partir de
  // la URL original (antes de que Supabase la limpiara) — ver authStore.tsx.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!authStore.isPasswordRecovery()) {
        // El usuario entró manualmente a /reset-password (con o sin sesión normal
        // iniciada) sin pasar por un link de recuperación. No es válido, sin
        // importar si ya tiene sesión iniciada por otro lado.
        if (!cancelled) setView('invalid');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setView(session ? 'form' : 'invalid');
    })();

    return () => { cancelled = true; };
  }, []);

  const handleBackToLogin = async () => {
    // Por si quedó una sesión de recovery a medio usar, cerrarla antes de salir.
    await authStore.logout();
    authStore.exitRecoveryMode();
    window.location.href = '/login?forgot=1';
  };

  const handleCancel = async () => {
    await authStore.logout();
    authStore.exitRecoveryMode();
    window.location.href = '/login';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Completa ambos campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    // Confirmar que la sesión de recovery sigue viva justo antes de intentar el
    // cambio (pudo expirar mientras el usuario escribía la contraseña).
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      setView('invalid');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (updateError) {
      const isSamePassword = (updateError as any).code === 'same_password'
        || /different from the old password|same password/i.test(updateError.message);
      if (isSamePassword) {
        setError('Escribe una contraseña diferente a la que ya tenías anteriormente.');
        return;
      }
      // Sesión de recovery vencida/inválida justo al momento de guardar.
      setView('invalid');
      return;
    }

    // Éxito: cerrar la sesión de recovery de forma segura — nunca dejamos al
    // usuario entrando directo a la app con la sesión de recuperación.
    await authStore.logout();
    authStore.exitRecoveryMode();
    setView('success');
  };

  // ── Vista: verificando el link ────────────────────────────────────────────
  if (view === 'checking') {
    return (
      <div className={CARD_WRAPPER} style={BACKGROUND_STYLE}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // ── Vista: link inválido o expirado ───────────────────────────────────────
  if (view === 'invalid') {
    return (
      <div className={CARD_WRAPPER} style={BACKGROUND_STYLE}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Enlace inválido</h1>
            <p className="text-slate-500 text-sm mb-8">
              Este enlace para restablecer tu contraseña es inválido o ha expirado. Solicita uno nuevo.
            </p>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Solicitar un nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: contraseña actualizada ─────────────────────────────────────────
  if (view === 'success') {
    return (
      <div className={CARD_WRAPPER} style={BACKGROUND_STYLE}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">¡Contraseña actualizada!</h1>
            <p className="text-slate-500 text-sm mb-8">
              Tu contraseña fue actualizada correctamente. Inicia sesión con tu nueva contraseña.
            </p>
            <button
              onClick={onSuccess}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Ir a iniciar sesión
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: formulario de nueva contraseña ─────────────────────────────────
  return (
    <div className={CARD_WRAPPER} style={BACKGROUND_STYLE}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 bg-white rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Nueva contraseña</h1>
          <p className="text-slate-500 text-sm">Elige una contraseña segura para tu cuenta.</p>
        </div>

        <div className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-70 mt-4"
            >
              {isLoading ? (
                <span>Actualizando...</span>
              ) : (
                <>
                  <span>Guardar nueva contraseña</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors pt-1"
            >
              Cancelar y volver a iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
