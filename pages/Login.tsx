import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { authStore } from '../services/authStore';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  onNavigateToRegister: () => void;
  onNavigateToLanding?: () => void;
}

type LoginView = 'login' | 'forgot' | 'forgot-sent';

export const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister, onNavigateToLanding }) => {
  const [view, setView] = useState<LoginView>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authStore.login(email, password);
      setIsLoading(false);

      if (!user) {
        setError('Correo o contraseña incorrectos.');
        return;
      }

      onLogin(user.role);
    } catch (err) {
      setIsLoading(false);
      setError('Ocurrió un error al iniciar sesión.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin,
    });

    setForgotLoading(false);

    if (error) {
      setForgotError('No se pudo enviar el correo. Verifica la dirección e intenta de nuevo.');
      return;
    }

    setView('forgot-sent');
  };

  // ── Vista: correo enviado ─────────────────────────────────────────────────
  if (view === 'forgot-sent') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: 'url(/backgroundimage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Revisa tu correo</h1>
            <p className="text-slate-500 text-sm mb-2">
              Enviamos un enlace de recuperación a:
            </p>
            <p className="font-semibold text-slate-800 text-sm mb-6">{forgotEmail}</p>
            <p className="text-slate-400 text-xs mb-8">
              Haz clic en el enlace del correo para definir tu nueva contraseña. Si no lo ves, revisa tu carpeta de spam.
            </p>
            <button
              onClick={() => { setView('login'); setForgotEmail(''); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: formulario recuperar contraseña ────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: 'url(/backgroundimage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Recuperar contraseña</h1>
            <p className="text-slate-500 text-sm">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <div className="px-10 pb-10">
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                    placeholder="doctor@nutricrm.com"
                    autoFocus
                  />
                </div>
              </div>

              {forgotError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {forgotError}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-70"
              >
                {forgotLoading ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <span>Enviar enlace de recuperación</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); setForgotError(''); }}
                className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1 pt-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: login principal ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundImage: 'url(/backgroundimage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {onNavigateToLanding && (
        <button
          onClick={onNavigateToLanding}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-slate-900 hover:text-slate-700 text-base font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir a Inicio
        </button>
      )}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-10 text-center">
          <div
            className="w-16 h-16 mx-auto mb-6 cursor-pointer"
            onClick={onNavigateToLanding}
            title="Ir a Inicio"
          >
            <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Bienvenido a NutriFollow</h1>
          <p className="text-slate-500 text-sm">Ingresa tus credenciales para acceder al panel.</p>
        </div>

        <div className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  placeholder="doctor@nutricrm.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-1">
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
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
              className="block w-full text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                ¿No tienes una cuenta?{' '}
                <button
                  onClick={onNavigateToRegister}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-slate-400">
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Política de Privacidad</a>
                {' · '}
                <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Términos de Servicio</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
