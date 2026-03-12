import React, { useState, useEffect } from 'react';
import { HeartPulse, Lock, Mail, ArrowRight, AlertCircle, User, Globe, Camera, ArrowLeft } from 'lucide-react';
import { authStore } from '../services/authStore';
import { supabaseService } from '../services/supabaseService';
import { compressImage } from '../services/imageUtils';
import { AppRoute, UserRole } from '../types';

interface RegisterProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('nutricionista');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'America/Guatemala';
    }
  });

  const getTimezones = () => {
    try {
      return (Intl as any).supportedValuesOf('timeZone');
    } catch (e) {
      return [
        'America/Guatemala',
        'America/Mexico_City',
        'America/Bogota',
        'America/Lima',
        'America/Santiago',
        'America/Argentina/Buenos_Aires',
        'Europe/Madrid',
        'UTC'
      ];
    }
  };
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let avatarUrl = '';
      
      // 1. Sign up in Supabase Auth and create profile
      // We need to pass the avatar URL if we have one, but we don't have the user ID yet.
      // So we sign up first, then upload, then update profile? 
      // Or we can use a temporary ID or just update after.
      // Actually, my updated authStore.signUp creates the profile.
      
      const result = await authStore.signUp(email, password, fullName, role, timezone);
      
      if (!result.ok) {
        setError(result.message || 'Error al registrarse.');
        setIsLoading(false);
        return;
      }

      // 2. If there's an avatar, upload it and update the profile
      const user = authStore.getCurrentUser();
      if (user && avatarFile) {
        try {
          // Compress image before upload (max 500KB)
          const compressedFile = await compressImage(avatarFile, 500);
          avatarUrl = await supabaseService.uploadAvatar(user.id, compressedFile);
          await supabaseService.updateProfile(user.id, { avatar: avatarUrl });
        } catch (uploadErr) {
          console.error('Error uploading avatar:', uploadErr);
          // Don't fail the whole registration if just the avatar fails
        }
      }

      setIsLoading(false);
      onSuccess();
    } catch (err) {
      setIsLoading(false);
      setError('Ocurrió un error inesperado.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="p-8 text-center relative">
          <button 
            onClick={onBack}
            className="absolute left-6 top-8 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
            <HeartPulse className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Crea tu cuenta</h1>
          <p className="text-slate-500 text-sm">Únete a NutriCRM y gestiona tus pacientes eficientemente.</p>
        </div>

        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-emerald-300">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-white shadow-lg rounded-xl p-2 cursor-pointer border border-slate-100 hover:bg-slate-50 transition-all">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Foto de perfil (opcional)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium"
                    placeholder="Ej. Blanca Morales"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium appearance-none"
                >
                  <option value="nutricionista">Nutricionista</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="admin">Administrador (Temporal)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Zona Horaria</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium appearance-none"
                >
                  {getTimezones().map((tz: string) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
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
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-70 mt-6"
            >
              {isLoading ? (
                <span>Creando cuenta...</span>
              ) : (
                <>
                  <span>Registrarse</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
