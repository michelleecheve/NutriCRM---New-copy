import React, { useState, useRef, useEffect } from 'react';
import { authStore, MOCK_USERS } from '../services/authStore';
import { UserProfile } from '../types';
import {
  Save, User, Mail, Phone, Award, Camera, Check, Loader2,
  MapPin, Globe, Lock, Key, ExternalLink, Instagram,
  ChevronDown, Clock, Link2, UserPlus, Trash2, Copy, Users
} from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────────

const InputField = ({ label, icon: Icon, value, onChange, type = "text", readOnly = false, placeholder = "" }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-700 block">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full pl-12 pr-4 py-3 border rounded-xl font-medium outline-none transition-all 
          ${readOnly
            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
            : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
          }`}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, icon: Icon, value, onChange, placeholder = "", rows = 3 }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-700 block">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-6 text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
      />
    </div>
  </div>
);

const UTC_TIMEZONES = [
  "UTC-12:00","UTC-11:00","UTC-10:00","UTC-09:30","UTC-09:00","UTC-08:00",
  "UTC-07:00","UTC-06:00","UTC-05:00","UTC-04:00","UTC-03:30","UTC-03:00",
  "UTC-02:00","UTC-01:00","UTC±00:00","UTC+01:00","UTC+02:00","UTC+03:00",
  "UTC+03:30","UTC+04:00","UTC+04:30","UTC+05:00","UTC+05:30","UTC+05:45",
  "UTC+06:00","UTC+06:30","UTC+07:00","UTC+08:00","UTC+08:45","UTC+09:00",
  "UTC+09:30","UTC+10:00","UTC+10:30","UTC+11:00","UTC+12:00","UTC+12:45",
  "UTC+13:00","UTC+14:00"
];

const getLocalTimezone = () => {
  const offset = new Date().getTimezoneOffset();
  if (offset === 0) return "UTC±00:00";
  const absOffset = Math.abs(offset);
  const h = Math.floor(absOffset / 60);
  const m = absOffset % 60;
  const sign = offset > 0 ? "-" : "+";
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// ─── Vinculacion Section (Nutricionista) ──────────────────────────────────────

const VinculacionNutricionista: React.FC = () => {
  const currentUser = authStore.getCurrentUser();
  const [linkCode, setLinkCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Usar el ID del usuario como código de vinculación
  const myLinkCode = currentUser?.id || '';

  const linkedReceptionists = authStore.getLinkedReceptionists();

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myLinkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkReceptionist = () => {
    if (!linkCode.trim()) {
      setMsg({ type: 'err', text: 'Ingresa un código de vinculación.' });
      return;
    }

    // Buscar la recepcionista por su ID
    const receptionist = MOCK_USERS.find(u => u.id === linkCode && u.role === 'recepcionista');
    
    if (!receptionist) {
      setMsg({ type: 'err', text: 'Código inválido. No se encontró una recepcionista con ese código.' });
      return;
    }

    // Verificar si ya está vinculada
    if (currentUser?.linkedReceptionistIds?.includes(receptionist.id)) {
      setMsg({ type: 'err', text: 'Esta recepcionista ya está vinculada.' });
      return;
    }

    // En producción esto haría un UPDATE en Supabase
    setMsg({ type: 'ok', text: `Recepcionista ${receptionist.profile.name} vinculada correctamente.` });
    setLinkCode('');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUnlink = (receptionistId: string, receptionistName: string) => {
    if (!confirm(`¿Desvincular a ${receptionistName}?`)) return;
    alert(`Desvinculando a ${receptionistName}... (implementar con Supabase)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Link2 className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-slate-800">Vinculación con Recepcionistas</h3>
      </div>

      {/* My linking code */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-3">
        <div>
          <p className="text-sm font-bold text-emerald-800">Tu código de vinculación</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Comparte este código con tu recepcionista para que pueda vincularse a tu cuenta.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-3 font-mono text-base font-bold tracking-wide text-emerald-700 select-all">
            {myLinkCode}
          </div>
          <button
            type="button"
            onClick={handleCopyMyCode}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Link a receptionist by code */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Vincular recepcionista por código</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={linkCode}
              onChange={e => setLinkCode(e.target.value)}
              placeholder="recep-001"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-mono font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleLinkReceptionist}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Vincular
          </button>
        </div>
        {msg && (
          <p className={`text-sm font-medium px-1 ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Linked receptionists */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-700">
          Recepcionistas vinculadas ({linkedReceptionists.length})
        </p>
        {linkedReceptionists.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-5 text-center text-sm text-slate-400">
            No tienes recepcionistas vinculadas aún.
          </div>
        ) : (
          linkedReceptionists.map(recep => (
            <div
              key={recep.id}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {recep.profile.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{recep.profile.name}</p>
                <p className="text-xs text-slate-400 truncate">{recep.email}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">ID: {recep.id}</p>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                Activa
              </span>
              <button
                type="button"
                onClick={() => handleUnlink(recep.id, recep.profile.name)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-red-100 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Vinculacion Section (Recepcionista) ──────────────────────────────────────

const VinculacionRecepcionista: React.FC = () => {
  const currentUser = authStore.getCurrentUser();
  const [linkCode, setLinkCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Usar el ID del usuario como código de vinculación
  const myLinkCode = currentUser?.id || '';

  const linkedNutritionists = authStore.getLinkedNutritionists();

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myLinkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkNutritionist = () => {
    if (!linkCode.trim()) {
      setMsg({ type: 'err', text: 'Ingresa un código de vinculación.' });
      return;
    }

    // Buscar la nutricionista por su ID
    const nutritionist = MOCK_USERS.find(u => u.id === linkCode && u.role === 'nutricionista');
    
    if (!nutritionist) {
      setMsg({ type: 'err', text: 'Código inválido. No se encontró una nutricionista con ese código.' });
      return;
    }

    // Verificar si ya está vinculada
    if (currentUser?.linkedNutritionistIds?.includes(nutritionist.id)) {
      setMsg({ type: 'err', text: 'Esta nutricionista ya está vinculada.' });
      return;
    }

    // En producción esto haría un UPDATE en Supabase
    setMsg({ type: 'ok', text: `Nutricionista ${nutritionist.profile.name} vinculada correctamente.` });
    setLinkCode('');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUnlink = (nutritionistId: string, nutritionistName: string) => {
    if (!confirm(`¿Desvincular a ${nutritionistName}?`)) return;
    alert(`Desvinculando a ${nutritionistName}... (implementar con Supabase)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-slate-800">Vinculación con Nutricionistas</h3>
      </div>

      {/* My linking code */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <div>
          <p className="text-sm font-bold text-blue-800">Tu código de vinculación</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Comparte este código con la nutricionista para que pueda vincularse a tu cuenta.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-3 font-mono text-base font-bold tracking-wide text-blue-700 select-all">
            {myLinkCode}
          </div>
          <button
            type="button"
            onClick={handleCopyMyCode}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              copied
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Link a nutritionist by code */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Vincular nutricionista por código</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={linkCode}
              onChange={e => setLinkCode(e.target.value)}
              placeholder="nutri-001"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-mono font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleLinkNutritionist}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Vincular
          </button>
        </div>
        {msg && (
          <p className={`text-sm font-medium px-1 ${msg.type === 'ok' ? 'text-blue-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Linked nutritionists */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-700">
          Nutricionistas vinculadas ({linkedNutritionists.length})
        </p>
        {linkedNutritionists.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-5 text-center text-sm text-slate-400">
            No tienes nutricionistas vinculadas aún.
          </div>
        ) : (
          linkedNutritionists.map(nutri => (
            <div
              key={nutri.id}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                {nutri.profile.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{nutri.profile.name}</p>
                <p className="text-xs text-slate-400 truncate">{nutri.email}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">ID: {nutri.id}</p>
              </div>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                Activa
              </span>
              <button
                type="button"
                onClick={() => handleUnlink(nutri.id, nutri.profile.name)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-red-100 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Profile Component ───────────────────────────────────────────────────

export const Profile: React.FC = () => {
  const currentUser = authStore.getCurrentUser();
  const role = currentUser?.role ?? 'nutricionista';

  // Helpers para saber qué mostrar basándose en permisos de módulos
  const showNutriFields = authStore.canAccessModule('profile', 'profile-nutri-fields');
  const showSistema = authStore.canAccessModule('profile', 'profile-sistema');
  const showVinculacionRecepcionistas = authStore.canAccessModule('profile', 'profile-vinculacion-recepcionistas');
  const showVinculacionNutricionistas = authStore.canAccessModule('profile', 'profile-vinculacion-nutricionistas');

  const [formData, setFormData] = useState<UserProfile>(authStore.getUserProfile());
  const [isSaved, setIsSaved]   = useState(false);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!formData.timezone || formData.timezone.includes('/') || !UTC_TIMEZONES.includes(formData.timezone)) {
      const localTz = getLocalTimezone();
      setFormData(prev => ({
        ...prev,
        timezone: UTC_TIMEZONES.includes(localTz) ? localTz : 'UTC±00:00'
      }));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    authStore.updateCurrentUserProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const processImage = (file: File) => {
    setIsProcessingImg(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX_SIZE = 1080;
        if (width > height) { if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; } }
        else { if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length * 0.75 > 500000 && quality > 0.1) { quality -= 0.1; dataUrl = canvas.toDataURL('image/jpeg', quality); }
        setFormData(prev => ({ ...prev, avatar: dataUrl }));
        setIsProcessingImg(false);
      };
    };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {role === 'recepcionista' ? 'Mi Perfil' : 'Perfil Profesional'}
        </h2>
        <p className="text-slate-500 mt-1">
          {role === 'recepcionista'
            ? 'Gestiona tu información de contacto y vinculaciones.'
            : 'Gestiona tu información pública y credenciales.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
          <div className="absolute inset-0 bg-white/10"></div>
        </div>

        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg relative overflow-hidden">
                {isProcessingImg ? (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full rounded-xl object-cover bg-slate-100" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl">
                    {formData.name.charAt(0)}
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) processImage(f); }} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors z-10">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            {isSaved && (
              <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4" /> Cambios Guardados
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-10">

            {/* ── SECCIÓN 1: Datos ── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">
                  {role === 'recepcionista' ? 'Mis Datos' : 'Datos de Nutricionista'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campos solo para nutricionista/admin */}
                {showNutriFields && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">Título</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Award className="w-5 h-5" /></div>
                      <select
                        value={formData.professionalTitle || 'Lic.'}
                        onChange={e => setFormData({ ...formData, professionalTitle: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                      >
                        <option value="Lic.">Lic.</option>
                        <option value="Mag.">Mag.</option>
                        <option value="Dra.">Dra.</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                    </div>
                  </div>
                )}

                {/* Nombre — todos lo ven */}
                <InputField label="Nombre Completo" icon={User} value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} />

                {/* Campos solo nutricionista/admin */}
                {showNutriFields && (
                  <>
                    <InputField label="Especialidad / Título" icon={Award} value={formData.specialty} onChange={(e: any) => setFormData({ ...formData, specialty: e.target.value })} />
                    <InputField label="Núm. Colegiado" icon={Award} value={formData.licenseNumber || ''} placeholder="123456" onChange={(e: any) => setFormData({ ...formData, licenseNumber: e.target.value })} />
                  </>
                )}

                {/* Teléfonos — todos los ven */}
                <InputField label="Teléfono de Clínica" icon={Phone} value={formData.phone} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} />
                <InputField label="Teléfono Personal" icon={Phone} value={formData.personalPhone || ''} onChange={(e: any) => setFormData({ ...formData, personalPhone: e.target.value })} />

                {/* Correo — todos lo ven */}
                <InputField label="Correo Electrónico de Contacto" icon={Mail} type="email" value={formData.contactEmail || ''} onChange={(e: any) => setFormData({ ...formData, contactEmail: e.target.value })} />

                {/* Instagram y Web — solo nutricionista/admin */}
                {showNutriFields && (
                  <>
                    <InputField label="Usuario Instagram" icon={Instagram} value={formData.instagramHandle || ''} placeholder="blancamoorales" onChange={(e: any) => setFormData({ ...formData, instagramHandle: e.target.value })} />
                    <InputField label="Página Web" icon={Globe} value={formData.website || ''} onChange={(e: any) => setFormData({ ...formData, website: e.target.value })} />
                  </>
                )}
              </div>

              {/* Dirección — todos la ven */}
              <TextAreaField label="Dirección" icon={MapPin} value={formData.address || ''} onChange={(e: any) => setFormData({ ...formData, address: e.target.value })} placeholder="Ingresa la dirección de tu clínica..." rows={3} />
            </div>

            {/* ── SECCIÓN 2: Vinculación con Recepcionistas (nutricionista) ── */}
            {showVinculacionRecepcionistas && <VinculacionNutricionista />}

            {/* ── SECCIÓN 3: Vinculación con Nutricionistas (recepcionista) ── */}
            {showVinculacionNutricionistas && <VinculacionRecepcionista />}

            {/* ─�� SECCIÓN 4: Configuración de Sistema (solo nutricionista/admin) ── */}
            {showSistema && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">Configuración de Sistema</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">Zona Horaria (UTC)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Globe className="w-5 h-5" /></div>
                      <select
                        value={formData.timezone || 'UTC±00:00'}
                        onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                      >
                        {UTC_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                    </div>
                    <p className="text-[10px] text-slate-400 px-1">Esto asegura que la "Agenda de Hoy" muestre las citas correctas según tu hora local.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECCIÓN 5: Seguridad y Cuenta (todos) ── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Seguridad y Cuenta</h3>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico Registrado</label>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {currentUser?.email}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button type="button" className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                    <Key className="w-4 h-4" /> Cambiar contraseña
                  </button>
                  <button type="button" className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Cambiar correo de login
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isProcessingImg}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};