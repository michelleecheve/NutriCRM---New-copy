import React, { useState } from 'react';
import { HeartPulse, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { authStore } from '../services/authStore';
import { AppRoute, UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = authStore.login(email, password);
      setIsLoading(false);

      if (!user) {
        setError('Correo o contraseña incorrectos.');
        return;
      }

      onLogin(user.role);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <HeartPulse className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Bienvenido a NutriCRM</h1>
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

            {/* Error message */}
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

          {/* Demo credentials hint */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Accesos de prueba</p>
            {[
              { role: 'Nutricionista',   email: 'blancamoralesc96@gmail.com', pass: 'nutri123' },
              // ✅ Nuevo acceso rápido
              { role: 'Nutricionista 2', email: 'nutri2@nutricrm.com',        pass: 'nutri123' },
              { role: 'Recepcionista',   email: 'secretaria@nutricrm.com',    pass: 'recep123' },
              { role: 'Admin',           email: 'admin@nutricrm.com',         pass: 'admin123' },
            ].map(c => (
              <button
                key={c.role}
                type="button"
                onClick={() => { setEmail(c.email); setPassword(c.pass); setError(''); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white transition-colors group"
              >
                <span className="text-xs font-bold text-emerald-600">{c.role}</span>
                <span className="text-xs text-slate-400 ml-2">{c.email}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">¿Olvidaste tu contraseña?</a>
          </div>
        </div>
      </div>
    </div>
  );
};