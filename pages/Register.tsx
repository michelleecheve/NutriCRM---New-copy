import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, User, Globe, Camera, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { authStore } from '../services/authStore';
import { supabaseService } from '../services/supabaseService';
import { compressImage } from '../services/imageUtils';
import { AppRoute, UserRole } from '../types';

interface RegisterProps {
  onBack: () => void;
  onSuccess: () => void;
}

const COUNTRIES = [
  'Afganistán','Albania','Alemania','Andorra','Angola','Antigua y Barbuda','Arabia Saudita',
  'Argelia','Argentina','Armenia','Australia','Austria','Azerbaiyán','Bahamas','Bahrein',
  'Bangladesh','Barbados','Bélgica','Belice','Benín','Bielorrusia','Bolivia','Bosnia y Herzegovina',
  'Botsuana','Brasil','Brunéi','Bulgaria','Burkina Faso','Burundi','Bután','Cabo Verde',
  'Camboya','Camerún','Canadá','Catar','Chad','Chile','China','Chipre','Colombia','Comoras',
  'Congo','Corea del Norte','Corea del Sur','Costa de Marfil','Costa Rica','Croacia','Cuba',
  'Dinamarca','Djibouti','Dominica','Ecuador','Egipto','El Salvador','Emiratos Árabes Unidos',
  'Eritrea','Eslovaquia','Eslovenia','España','Estados Unidos','Estonia','Esuatini','Etiopía',
  'Filipinas','Finlandia','Fiyi','Francia','Gabón','Gambia','Georgia','Ghana','Granada',
  'Grecia','Guatemala','Guinea','Guinea-Bisáu','Guinea Ecuatorial','Guyana','Haití','Honduras',
  'Hungría','India','Indonesia','Irak','Irán','Irlanda','Islandia','Islas Marshall',
  'Islas Salomón','Israel','Italia','Jamaica','Japón','Jordania','Kazajistán','Kenia',
  'Kirguistán','Kiribati','Kosovo','Kuwait','Laos','Lesoto','Letonia','Líbano','Liberia',
  'Libia','Liechtenstein','Lituania','Luxemburgo','Madagascar','Malasia','Malaui','Maldivas',
  'Malí','Malta','Marruecos','Mauricio','Mauritania','México','Micronesia','Moldavia','Mónaco',
  'Mongolia','Montenegro','Mozambique','Namibia','Nauru','Nepal','Nicaragua','Níger','Nigeria',
  'Noruega','Nueva Zelanda','Omán','Países Bajos','Pakistán','Palaos','Palestina','Panamá',
  'Papúa Nueva Guinea','Paraguay','Perú','Polonia','Portugal','Reino Unido','República Centroafricana',
  'República Checa','República Democrática del Congo','República Dominicana','Ruanda','Rumanía',
  'Rusia','Samoa','San Cristóbal y Nieves','San Marino','San Vicente y las Granadinas',
  'Santa Lucía','Santo Tomé y Príncipe','Senegal','Serbia','Seychelles','Sierra Leona',
  'Singapur','Siria','Somalia','Sri Lanka','Sudáfrica','Sudán','Sudán del Sur','Suecia',
  'Suiza','Surinam','Tailandia','Tanzania','Tayikistán','Timor Oriental','Togo','Tonga',
  'Trinidad y Tobago','Túnez','Turkmenistán','Turquía','Tuvalu','Ucrania','Uganda','Uruguay',
  'Uzbekistán','Vanuatu','Venezuela','Vietnam','Yemen','Yibuti','Zambia','Zimbabue',
];

const UTC_TIMEZONES = [
  "UTC-12:00","UTC-11:00","UTC-10:00","UTC-09:30","UTC-09:00","UTC-08:00",
  "UTC-07:00","UTC-06:00","UTC-05:00","UTC-04:00","UTC-03:30","UTC-03:00",
  "UTC-02:00","UTC-01:00","UTC±00:00","UTC+01:00","UTC+02:00","UTC+03:00",
  "UTC+03:30","UTC+04:00","UTC+04:30","UTC+05:00","UTC+05:30","UTC+05:45",
  "UTC+06:00","UTC+06:30","UTC+07:00","UTC+08:00","UTC+08:45","UTC+09:00",
  "UTC+09:30","UTC+10:00","UTC+10:30","UTC+11:00","UTC+12:00","UTC+12:45",
  "UTC+13:00","UTC+14:00"
];

const getLocalTimezone = (): string => {
  const offset = new Date().getTimezoneOffset();
  if (offset === 0) return "UTC±00:00";
  const absOffset = Math.abs(offset);
  const h = Math.floor(absOffset / 60);
  const m = absOffset % 60;
  const sign = offset > 0 ? "-" : "+";
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const Register: React.FC<RegisterProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('nutricionista');
  const [timezone, setTimezone] = useState(() => {
    const local = getLocalTimezone();
    return UTC_TIMEZONES.includes(local) ? local : 'UTC±00:00';
  });
  const [country, setCountry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormComplete = fullName.trim() !== '' && email.trim() !== '' && password.length >= 6 && country !== '' && dateOfBirth !== '';

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
      
      const result = await authStore.signUp(email, password, fullName, role, timezone, undefined, country, dateOfBirth);
      
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
    <div className="min-h-screen flex items-center justify-center p-6 py-12" style={{ backgroundImage: 'url(/backgroundimage.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="p-8 text-center relative">
          <button 
            onClick={onBack}
            className="absolute left-6 top-8 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4">
            <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Crea tu cuenta</h1>
          <p className="text-slate-500 text-sm">Únete a NutriFollow y gestiona tus pacientes eficientemente.</p>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Foto de Logo (opcional)</p>
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Zona Horaria (UTC)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium appearance-none"
                >
                  {UTC_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 px-1 mt-1">Detectada automáticamente. Ajústala si es necesario.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">País</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium appearance-none ${country === '' ? 'text-slate-400' : 'text-slate-900'}`}
                  >
                    <option value="" disabled>Selecciona tu país</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fecha de Nacimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {!isFormComplete && !isLoading && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Por favor llena todos los campos.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isFormComplete}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
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
