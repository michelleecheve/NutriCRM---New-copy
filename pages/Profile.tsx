import React, { useState, useRef, useEffect } from 'react';
import { authStore } from '../services/authStore';
import { supabaseService } from '../services/supabaseService';
import { compressImage } from '../services/imageUtils';
import { UserProfile, AppUser } from '../types';
import {
  Save, User, Mail, Phone, Award, Camera, Check, Loader2,
  MapPin, Globe, ChevronDown, Clock, Link2, UserPlus, Trash2, Copy, Users, AlertTriangle, LogOut, Calendar,
  PanelLeft, LayoutTemplate
} from 'lucide-react';

import { ProfileAIConfig } from '../components/profile_config/ProfileAIConfig';
import { ProfileSubscription } from '../components/profile_config/ProfileSubscription';

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

const CURRENCIES: { symbol: string; label: string }[] = [
  { symbol: '$',    label: '$ — Dólar (USD)'             },
  { symbol: 'Q',    label: 'Q — Quetzal (GTQ)'           },
  { symbol: 'MX$',  label: 'MX$ — Peso Mexicano (MXN)'  },
  { symbol: 'COP$', label: 'COP$ — Peso Colombiano'      },
  { symbol: 'S/',   label: 'S/ — Sol Peruano (PEN)'      },
  { symbol: 'CLP$', label: 'CLP$ — Peso Chileno'         },
  { symbol: 'ARS$', label: 'ARS$ — Peso Argentino'       },
  { symbol: 'R$',   label: 'R$ — Real Brasileño (BRL)'   },
  { symbol: 'L',    label: 'L — Lempira (HNL)'           },
  { symbol: 'C$',   label: 'C$ — Córdoba (NIO)'          },
  { symbol: '₡',    label: '₡ — Colón (CRC)'             },
  { symbol: 'B/.',  label: 'B/. — Balboa (PAB)'          },
  { symbol: 'RD$',  label: 'RD$ — Peso Dominicano'       },
  { symbol: 'Bs.',  label: 'Bs. — Boliviano (BOB)'       },
  { symbol: 'Gs.',  label: 'Gs. — Guaraní (PYG)'         },
  { symbol: '$U',   label: '$U — Peso Uruguayo (UYU)'    },
  { symbol: 'Bs.F', label: 'Bs.F — Bolívar (VES)'        },
  { symbol: '€',    label: '€ — Euro (EUR)'              },
  { symbol: '£',    label: '£ — Libra Esterlina (GBP)'   },
  { symbol: 'CA$',  label: 'CA$ — Dólar Canadiense'      },
  { symbol: 'A$',   label: 'A$ — Dólar Australiano'      },
  { symbol: '¥',    label: '¥ — Yen (JPY)'               },
  { symbol: 'CHF',  label: 'CHF — Franco Suizo'          },
];

const COUNTRY_CURRENCY: Record<string, string> = {
  'Guatemala': 'Q', 'México': 'MX$', 'Colombia': 'COP$', 'Perú': 'S/',
  'Chile': 'CLP$', 'Argentina': 'ARS$', 'Brasil': 'R$', 'Honduras': 'L',
  'Nicaragua': 'C$', 'Costa Rica': '₡', 'Panamá': 'B/.', 'República Dominicana': 'RD$',
  'Bolivia': 'Bs.', 'Paraguay': 'Gs.', 'Uruguay': '$U', 'Venezuela': 'Bs.F',
  'España': '€', 'Estados Unidos': '$', 'Canadá': 'CA$', 'Australia': 'A$',
  'Reino Unido': '£', 'Japón': '¥', 'Suiza': 'CHF', 'Ecuador': '$',
  'El Salvador': '$', 'Cuba': '$', 'Puerto Rico': '$',
};

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


// VINCULACION

const VinculacionNutricionista: React.FC<{
  onUnlinkRequest: (id: string, name: string, type: 'receptionist') => void;
  }> = ({ onUnlinkRequest }) => {
  const currentUser: any = authStore.getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [linkedReceptionists, setLinkedReceptionists] = useState<AppUser[]>([]);

  const myLinkCode = currentUser?.linkCode || '';

  useEffect(() => {
    authStore.getLinkedReceptionists().then(setLinkedReceptionists);
  }, [refreshKey]);

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myLinkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkReceptionist = async () => {
    if (!linkCode.trim()) {
      setMsg({ type: 'err', text: 'Ingresa un código de vinculación.' });
      return;
    }
    const res = await authStore.linkReceptionistToNutritionistByCode(linkCode.trim());
    setMsg({ type: res.ok ? 'ok' : 'err', text: res.message });
    if (res.ok) {
      setLinkCode('');
      setRefreshKey(x => x + 1);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between pb-2 border-b border-slate-100 group"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Vinculación con Recepcionistas</h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-sm font-bold text-emerald-800">Tu código de vinculación</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Comparte este código con tu recepcionista para que pueda vincularse a tu cuenta.
              </p>
            </div>
            <div className="flex gap-3">
              {myLinkCode ? (
                <>
                  <div className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-3 font-mono text-base font-bold tracking-wide text-emerald-700 select-all">
                    {myLinkCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMyCode}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      copied ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setMsg({ type: 'ok', text: 'Generando código...' });
                    const code = await authStore.generateAndSaveLinkCode();
                    setMsg({ type: 'ok', text: `Código generado: ${code}` });
                    setTimeout(() => setMsg(null), 2000);
                    window.location.reload();
                  }}
                  className="px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm"
                >
                  Generar código de vinculación
                </button>
              )}
            </div>
            {msg && (
              <p className={`text-sm font-medium px-1 ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                {msg.text}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">Vincular recepcionista por código</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                  <Copy className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={linkCode}
                  onChange={e => setLinkCode(e.target.value)}
                  placeholder="RECEP-9Z1P0A"
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

          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-700">
              Recepcionistas vinculadas ({linkedReceptionists.length})
            </p>
            {linkedReceptionists.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-5 text-center text-sm text-slate-400">
                No tienes recepcionistas vinculadas aún.
              </div>
            ) : (
              linkedReceptionists.map(recep => {
                const recepName = recep.profile?.name ?? recep.name ?? "Sin nombre";
                return (
                  <div key={recep.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {recepName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{recepName}</p>
                      <p className="text-xs text-slate-400 truncate">{recep.email}</p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Activa</span>
                    <button
                      type="button"
                      onClick={() => onUnlinkRequest(recep.id, recepName, 'receptionist')}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-red-100 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VinculacionRecepcionista: React.FC<{
  onUnlinkRequest: (id: string, name: string, type: 'nutritionist') => void;
}> = ({ onUnlinkRequest }) => {
  const currentUser: any = authStore.getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [linkedNutritionists, setLinkedNutritionists] = useState<AppUser[]>([]);

  const myLinkCode = currentUser?.linkCode || '';

  useEffect(() => {
    authStore.getLinkedNutritionists().then(setLinkedNutritionists);
  }, [refreshKey]);

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myLinkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkNutritionist = async () => {
    if (!linkCode.trim()) {
      setMsg({ type: 'err', text: 'Ingresa un código de vinculación.' });
      return;
    }
    const res = await authStore.linkNutritionistToReceptionistByCode(linkCode.trim());
    setMsg({ type: res.ok ? 'ok' : 'err', text: res.message });
    if (res.ok) {
      setLinkCode('');
      setRefreshKey(x => x + 1);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between pb-2 border-b border-slate-100 group"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800">Vinculación con Nutricionistas</h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-6">
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
                  copied ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">Vincular nutricionista por código</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                  <Copy className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={linkCode}
                  onChange={e => setLinkCode(e.target.value)}
                  placeholder="NUTRI-4K8D2Q"
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
                <div key={nutri.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {nutri.profile.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{nutri.profile.name}</p>
                    <p className="text-xs text-slate-400 truncate">{nutri.email}</p>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">Activa</span>
                  <button
                    type="button"
                    onClick={() => onUnlinkRequest(nutri.id, nutri.profile.name, 'nutritionist')}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-red-100 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};



export const Profile: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const currentUser = authStore.getCurrentUser();
  const role = currentUser?.role ?? 'nutricionista';

  const showNutriFields = authStore.canAccessModule('profile', 'profile-nutri-fields');
  const showSistema = authStore.canAccessModule('profile', 'profile-sistema');
  const showVinculacionRecepcionistas = authStore.canAccessModule('profile', 'profile-vinculacion-recepcionistas');
  const showVinculacionNutricionistas = authStore.canAccessModule('profile', 'profile-vinculacion-nutricionistas');
  const showAIConfig = authStore.canAccessModule('profile', 'profile-ai-config');
  const showSubscription = authStore.getCurrentUser()?.role === 'nutricionista';

  const [formData, setFormData] = useState<UserProfile>(authStore.getUserProfile());
  const [isSaved, setIsSaved] = useState(false);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [isSistemaOpen, setIsSistemaOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para modal de desvinculación
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string; type: 'receptionist' | 'nutritionist' } | null>(null);

  useEffect(() => {
    if (!formData.timezone || formData.timezone.includes('/') || !UTC_TIMEZONES.includes(formData.timezone)) {
      const localTz = getLocalTimezone();
      setFormData(prev => ({
        ...prev,
        timezone: UTC_TIMEZONES.includes(localTz) ? localTz : 'UTC±00:00'
      }));
    }
  }, []);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authStore.updateCurrentUserProfile(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleUnlinkRequest = (id: string, name: string, type: 'receptionist' | 'nutritionist') => {
    setUnlinkTarget({ id, name, type });
    setIsUnlinkModalOpen(true);
  };

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;

    if (unlinkTarget.type === 'receptionist') {
      const result = await authStore.unlinkReceptionistFromNutritionist(unlinkTarget.id);
      alert(result.message);
    } else {
      const result = await authStore.unlinkNutritionistFromReceptionist(unlinkTarget.id);
      alert(result.message);
    }

    setIsUnlinkModalOpen(false);
    setUnlinkTarget(null);
  };

  const processImage = async (file: File) => {
    setIsProcessingImg(true);
    try {
      const compressedFile = await compressImage(file, 500);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
        setIsProcessingImg(false);
      };
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessingImg(false);
    }
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
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
          <div className="absolute inset-0 bg-white/10"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col items-center -mt-12 mb-8 gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg relative overflow-hidden">
                {isProcessingImg ? (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : formData.avatar ? (
                  <img src={formData.avatar} alt="Logo del consultorio" className="w-full h-full rounded-xl object-contain bg-slate-100 p-1" />
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
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">Logo del consultorio</p>
              <p className="text-xs text-slate-400">Se muestra en los menús PDF</p>
            </div>
            {isSaved && (
              <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4" /> Cambios Guardados
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">
                  {role === 'recepcionista' ? 'Mis Datos' : 'Datos de Nutricionista'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <InputField label="Nombre Completo" icon={User} value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} />

                {showNutriFields && (
                  <>
                    <InputField label="Especialidad / Título" icon={Award} value={formData.specialty} onChange={(e: any) => setFormData({ ...formData, specialty: e.target.value })} />
                    <InputField label="Núm. Colegiado" icon={Award} value={formData.licenseNumber || ''} placeholder="123456" onChange={(e: any) => setFormData({ ...formData, licenseNumber: e.target.value })} />
                  </>
                )}

                <InputField label="Teléfono de Clínica" icon={Phone} value={formData.phone} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} />
                <InputField label="Teléfono Personal" icon={Phone} value={formData.personalPhone || ''} onChange={(e: any) => setFormData({ ...formData, personalPhone: e.target.value })} />

                <InputField label="Correo Electrónico de Contacto" icon={Mail} type="email" value={formData.contactEmail || ''} onChange={(e: any) => setFormData({ ...formData, contactEmail: e.target.value })} />

                {showNutriFields && (
                  <>
                    <InputField label="Usuario Instagram" icon={User} value={formData.instagramHandle || ''} placeholder="blancamoorales" onChange={(e: any) => setFormData({ ...formData, instagramHandle: e.target.value })} />
                    <InputField label="Página Web" icon={Globe} value={formData.website || ''} onChange={(e: any) => setFormData({ ...formData, website: e.target.value })} />
                  </>
                )}
                <InputField label="Dirección" icon={MapPin} value={formData.address || ''} onChange={(e: any) => setFormData({ ...formData, address: e.target.value })} placeholder="Ingresa la dirección de tu clínica..." />
              </div>
            </div>

            {showAIConfig && <ProfileAIConfig />}

            {showSubscription && <ProfileSubscription />}

            {showVinculacionRecepcionistas && <VinculacionNutricionista onUnlinkRequest={handleUnlinkRequest} />}
            {showVinculacionNutricionistas && <VinculacionRecepcionista onUnlinkRequest={handleUnlinkRequest} />}

            {showSistema && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setIsSistemaOpen(o => !o)}
                  className="w-full flex items-center justify-between pb-2 border-b border-slate-100 group"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-800">Configuración de Sistema</h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSistemaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSistemaOpen && (
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

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">País</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"><MapPin className="w-5 h-5" /></div>
                        <select
                          value={formData.country || ''}
                          onChange={e => {
                            const newCountry = e.target.value;
                            const suggested = COUNTRY_CURRENCY[newCountry];
                            setFormData(prev => ({
                              ...prev,
                              country: newCountry,
                              ...(suggested ? { currency: suggested } : {}),
                            }));
                          }}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                        >
                          <option value="">Selecciona tu país</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">Moneda</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 text-sm font-bold select-none">
                          {formData.currency || '$'}
                        </div>
                        <select
                          value={formData.currency || '$'}
                          onChange={e => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                        >
                          {CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                      </div>
                      <p className="text-[10px] text-slate-400 px-1">Se muestra en Pagos e Ingresos. Se sugiere automáticamente al elegir el país.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 block">Fecha de Nacimiento</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar className="w-5 h-5" /></div>
                        <input
                          type="date"
                          value={formData.dateOfBirth || ''}
                          onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="text-sm font-bold text-slate-700 block">Estilo de navegación</label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Sidebar option */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, navbarConfig: 'sidebar' })}
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            (formData.navbarConfig ?? 'sidebar') === 'sidebar'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {/* Mini sidebar preview */}
                          <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex">
                            <div className={`w-8 h-full flex flex-col gap-1 p-1 ${(formData.navbarConfig ?? 'sidebar') === 'sidebar' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                              <div className={`w-full h-1.5 rounded-sm ${(formData.navbarConfig ?? 'sidebar') === 'sidebar' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                              <div className="w-full h-1 rounded-sm bg-slate-200" />
                              <div className="w-full h-1 rounded-sm bg-slate-200" />
                              <div className="w-full h-1 rounded-sm bg-slate-200" />
                            </div>
                            <div className="flex-1 bg-slate-50" />
                          </div>
                          <div className="flex items-center gap-2">
                            <PanelLeft className={`w-4 h-4 ${(formData.navbarConfig ?? 'sidebar') === 'sidebar' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-bold ${(formData.navbarConfig ?? 'sidebar') === 'sidebar' ? 'text-emerald-700' : 'text-slate-500'}`}>
                              Menú lateral
                            </span>
                          </div>
                        </button>

                        {/* Topnav option */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, navbarConfig: 'topnav' })}
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            formData.navbarConfig === 'topnav'
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {/* Mini topnav preview */}
                          <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex flex-col">
                            <div className={`w-full h-5 flex items-center gap-1 px-1.5 ${formData.navbarConfig === 'topnav' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                              <div className={`h-1.5 w-4 rounded-sm ${formData.navbarConfig === 'topnav' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                              <div className="h-1 w-3 rounded-sm bg-slate-200" />
                              <div className="h-1 w-3 rounded-sm bg-slate-200" />
                              <div className="h-1 w-3 rounded-sm bg-slate-200" />
                            </div>
                            <div className="flex-1 bg-slate-50" />
                          </div>
                          <div className="flex items-center gap-2">
                            <LayoutTemplate className={`w-4 h-4 ${formData.navbarConfig === 'topnav' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-bold ${formData.navbarConfig === 'topnav' ? 'text-emerald-700' : 'text-slate-500'}`}>
                              Barra superior
                            </span>
                          </div>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 px-1">El cambio aplica inmediatamente al guardar.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="fixed bottom-6 right-8 z-50">
              <button
                type="submit"
                disabled={isProcessingImg || isSaved}
                className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
                  isSaved
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                }`}
              >
                {isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {isSaved ? '¡Guardado con éxito!' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="font-bold text-slate-900">Sesión</h3>
          <p className="text-sm text-slate-500">¿Deseas salir de tu cuenta?</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-8 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all shadow-sm border border-red-100"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
        <p className="text-xs text-slate-400 pt-1">
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Política de Privacidad</a>
          {' · '}
          <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Términos de Servicio</a>
        </p>
      </div>

      {/* Unlink Confirmation Modal */}
      {isUnlinkModalOpen && unlinkTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Confirmar desvinculación?</h3>
              <p className="text-slate-500 mb-6">
                ¿Estás segura que quieres desvincular a <strong>{unlinkTarget.name}</strong>? Esta acción no es reversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsUnlinkModalOpen(false);
                    setUnlinkTarget(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmUnlink}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Desvincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};