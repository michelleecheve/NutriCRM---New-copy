import React, { useState, useEffect, useRef } from 'react';
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
  const [showHelp, setShowHelp] = useState(false);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Renderiza el widget de Cloudflare Turnstile (captcha) apenas el script esté disponible.
  useEffect(() => {
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      const turnstile = (window as any).turnstile;
      if (turnstile && turnstileRef.current && !turnstileWidgetId.current) {
        turnstileWidgetId.current = turnstile.render(turnstileRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => setCaptchaToken(''),
        });
      } else if (!turnstile) {
        setTimeout(tryRender, 200);
      }
    };
    tryRender();
    return () => { cancelled = true; };
  }, []);

  const resetCaptcha = () => {
    const turnstile = (window as any).turnstile;
    if (turnstile && turnstileWidgetId.current) {
      turnstile.reset(turnstileWidgetId.current);
    }
    setCaptchaToken('');
  };

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authStore.login(email, password, captchaToken);
      setIsLoading(false);

      if (!user) {
        setError('Correo o contraseña incorrectos.');
        resetCaptcha();
        return;
      }

      onLogin(user.role);
    } catch (err) {
      setIsLoading(false);
      setError('Ocurrió un error al iniciar sesión.');
      resetCaptcha();
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: forgotEmail.trim(), redirectTo: window.location.origin },
    });

    setForgotLoading(false);

    if (error || !data?.ok) {
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
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6" style={{ backgroundImage: 'url(/backgroundimage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {onNavigateToLanding && (
        <div className="w-full max-w-md pt-2 sm:pt-3">
          <button
            onClick={onNavigateToLanding}
            className="flex items-center gap-1.5 text-slate-900 hover:text-slate-700 text-sm sm:text-base font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir a Inicio
          </button>
        </div>
      )}
      <div className="flex-1 w-full flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-6 sm:p-10 text-center">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-6 cursor-pointer"
            onClick={onNavigateToLanding}
            title="Ir a Inicio"
          >
            <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight whitespace-nowrap">Bienvenido a NutriFollow</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Inicia sesión para acceder al panel.</p>
        </div>

        <div className="px-6 pb-6 sm:px-10 sm:pb-10">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 sm:mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 sm:py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  placeholder="doctor@nutricrm.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 sm:mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 sm:py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
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
              disabled={isLoading || !captchaToken}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 sm:py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-70 mt-2 sm:mt-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span>Verificando</span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  </span>
                </span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center space-y-3 sm:space-y-4">
            <button
              type="button"
              onClick={() => { setView('forgot'); setForgotEmail(email); setForgotError(''); }}
              className="block w-full text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="pt-3 sm:pt-4 border-t border-slate-100">
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
            <div>
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Ayuda
              </button>
              {showHelp && (
                <p className="mt-2 text-sm text-slate-500">
                  ¿Tienes problemas para ingresar? Comunícate a{' '}
                  <a href="mailto:nutrifollow.app@outlook.com" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                    nutrifollow.app@outlook.com
                  </a>{' '}
                  o a{' '}
                  <a href={`https://wa.me/50252720714?text=${encodeURIComponent('Hola quisiera ayuda de NutriFollow')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                    WhatsApp aquí
                  </a>{' '}
                  y rápidamente te apoyaremos.
                </p>
              )}
            </div>
            <div ref={turnstileRef} className="flex justify-center pt-1" />
            <p className="text-center text-[10px] text-slate-400 mt-1">
              Cloudflare verifica que eres una persona real y no un bot.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
