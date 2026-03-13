import React, { useEffect, useState } from 'react';
import { Layout, Printer, Eye, Trash2 } from 'lucide-react';
import { MenuBaseTemplate, MenuPlanData } from '../components/menus_components/MenuDesignTemplates';
import { store } from '../services/store';
import { MenuReferences } from '../components/menus_components/MenuReferences';
import { MenuHistory } from '../components/menus_components/MenuHistory';
import { MenuExportPDF } from '../components/menus_components/MenuExportPDF';
import { MenuPreview } from '../components/menus_components/MenuPreview';
import { MenuAIConfigurator } from '../components/menus_components/MenuAIConfigurator';

const MENU_TEMPLATE_HEADER_MODE_KEY = 'nutricrm_menu_template_header_mode_v1';
const MENU_TEMPLATE_LOGO_URL_KEY = 'nutricrm_menu_template_logo_url_v1';
const MENU_TEMPLATE_DESIGN_KEY = 'nutricrm_menu_template_design_v1';

const MOCK_MEAL_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];

// ✅ Ahora es una función pura que recibe el perfil como argumento
const buildMockData = (profile: ReturnType<typeof store.getUserProfile>): MenuPlanData => {
  return {
    patient: { name: 'Alejandra Montenegro', age: 26, weight: 64.5, height: 163, fatPct: 14.2 },
    kcal: 2800,
    portions: {
      lacteos: 2, vegetales: 2, frutas: 2, cereales: 4, carnes: 4, grasas: 3,
      byMeal: {
        desayuno:   { lacteos: 1, vegetales: 0, frutas: 1, cereales: 2, carnes: 0, grasas: 1 },
        refaccion1: { lacteos: 1, vegetales: 1, frutas: 1, cereales: 0, carnes: 0, grasas: 0 },
        almuerzo:   { lacteos: 0, vegetales: 1, frutas: 0, cereales: 1, carnes: 2, grasas: 1 },
        refaccion2: { lacteos: 1, vegetales: 1, frutas: 0, cereales: 0, carnes: 0, grasas: 0 },
        cena:       { lacteos: 1, vegetales: 0, frutas: 0, cereales: 1, carnes: 2, grasas: 1 },
      },
    },
    weeklyMenu: {
      lunes: {
        mealsOrder: MOCK_MEAL_ORDER,
        desayuno:   { title: 'Omelette de 2 huevos, 1 rodaja de jamón de pavo, 1 onz de queso panela y vegetales al gusto\n½ tz de plátano cocido\nAgua pura', label: 'Desayuno' },
        refaccion1: { title: '6-8 manías o almendras\n1 tz de café con ½ tz de leche descremada\n1 fruta entera', label: 'Refacción' },
        almuerzo:   { title: '1 tz de ensalada mixta\n1 pechuga de pollo asado (5 onzas)\n1 tz de papas pequeñas asadas\n¼ aguacate\nAgua pura', label: 'Almuerzo' },
        refaccion2: { title: 'Licuado de fruta (1 fruta + ½ tz de leche descremada)\n1 rodaja de pan integral con queso ricotta\nAgua pura', label: 'Refacción' },
        cena:       { title: '3 huevos duros con salsa de tomate natural\n1 onz de queso cottage\n2 tortillas de maíz\nAgua pura', label: 'Cena' },
      },
      martes: {
        mealsOrder: MOCK_MEAL_ORDER,
        desayuno:   { title: '2 huevos + 2 claras revueltos con tomate y cebolla\n1 rodaja de queso panela\n1 rodaja de pan integral\nAgua pura', label: 'Desayuno' },
        refaccion1: { title: '6-8 manías o almendras\n1 tz de café con ½ tz de leche descremada\n1 fruta entera', label: 'Refacción' },
        almuerzo:   { title: '1 tz de ensalada de lechuga, tomate y pepino\n5 onz de lomito asado\n¼ aguacate\n1 tz de quinoa con garbanzos\nAgua pura', label: 'Almuerzo' },
        refaccion2: { title: 'Licuado de fruta (1 fruta + ½ tz de leche descremada)\n1 rodaja de pan integral con queso ricotta\nAgua pura', label: 'Refacción' },
        cena:       { title: 'Bowl:\n1 tz de lechuga + pepino con limón\n4 onz de pollo desmenuzado\n½ tz de quinoa\nAgua pura', label: 'Cena' },
      },
      miercoles: {
        mealsOrder: MOCK_MEAL_ORDER,
        desayuno:   { title: '3 huevos duros + 2 claras con tomate Cherry asado\n1 rodaja de pan integral tostado\nAgua pura', label: 'Desayuno' },
        refaccion1: { title: '6-8 manías o almendras\n1 tz de café con ½ tz de leche descremada\n1 fruta entera', label: 'Refacción' },
        almuerzo:   { title: '1 tz de brócoli con limón\n1 filete de pescado horneado (5 onzas)\n¼ aguacate\n1 tz de pasta salteada con especias\nAgua pura', label: 'Almuerzo' },
        refaccion2: { title: 'Licuado de fruta (1 fruta + ½ tz de leche descremada)\n1 rodaja de pan integral con queso ricotta\nAgua pura', label: 'Refacción' },
        cena:       { title: '1 tz de brócoli\n4 onz de carne asada con vinagreta\n½ tz de camote cocido\nAgua pura', label: 'Cena' },
      },
      jueves: {
        mealsOrder: MOCK_MEAL_ORDER,
        desayuno:   { title: 'Toast:\n1 rodaja de pan integral tostado\n2 huevos estrellados con 1 onz de queso cottage\n1 rodaja de jamón de pavo\nAgua pura', label: 'Desayuno' },
        refaccion1: { title: '6-8 manías o almendras\n1 tz de café con ½ tz de leche descremada\n1 fruta entera', label: 'Refacción' },
        almuerzo:   { title: '1 tz de verduras salteadas\n5 onz de salmón\n1 tz de arroz a la jardinera\n¼ aguacate\nAgua pura', label: 'Almuerzo' },
        refaccion2: { title: 'Licuado de fruta (1 fruta + ½ tz de leche descremada)\n1 rodaja de pan integral con queso ricotta\nAgua pura', label: 'Refacción' },
        cena:       { title: 'Bowl:\n1 tz de ensalada mixta\n½ tz arroz\n1 onz de queso panela\n3 onz de pollo con limón\nAgua pura', label: 'Cena' },
      },
      viernes: {
        mealsOrder: MOCK_MEAL_ORDER,
        desayuno:   { title: 'Chilaquiles:\n1 tz de nachos + salsa miltomate natural\n1 huevo estrellado + 2 oz de pollo desmenuzado\n½ oz queso mozzarella derretido\nAgua pura', label: 'Desayuno' },
        refaccion1: { title: '6-8 manías o almendras\n1 tz de café con ½ tz de leche descremada\n1 fruta entera', label: 'Refacción' },
        almuerzo:   { title: '5 onz de pollo a la plancha\n1 tz de quinoa con garbanzos\n1 tz de tomate y espinaca con sal y limón\n¼ aguacate\nAgua pura', label: 'Almuerzo' },
        refaccion2: { title: 'Licuado de fruta (1 fruta + ½ tz de leche descremada)\n1 rodaja de pan integral con queso ricotta\nAgua pura', label: 'Refacción' },
        cena:       { title: '2 tz de ensalada con 4 onz atún, elotitos, palmito\n1 rodaja de pan integral tostado\nAgua pura', label: 'Cena' },
      },
      sabado: {
        mealsOrder: MOCK_MEAL_ORDER,
        desayuno:   { title: '2 panqueques (¼ tz mezcla Nutripankes + ¼ tz avena + 1 huevo + ¼ tz leche descremada)\n+ 2 cdas de miel maple sin azúcar SAVORÉ\n2 onz de queso cottage\nAgua pura', label: 'Desayuno' },
        refaccion1: { title: '6-8 manías o almendras\n1 tz de café con ½ tz de leche descremada\n1 fruta entera', label: 'Refacción' },
        almuerzo:   { title: '1 tz de ensalada mixta\n5 onz de pollo en barbacoa horneado\n1 tz de coditos salteados\n¼ aguacate\nAgua pura', label: 'Almuerzo' },
        refaccion2: { title: 'Licuado de fruta (1 fruta + ½ tz de leche descremada)\n1 rodaja de pan integral con queso ricotta\nAgua pura', label: 'Refacción' },
        cena:       { title: 'Ceviche:\n4 onzas de camarón en ceviche\n¼ de aguacate\n1 paquete de galleta soda\nAgua pura', label: 'Cena' },
      },
      domingo: {
        note: 'TOMAR EN CUENTA LAS PORCIONES DE CADA UNO DE LOS TIEMPOS DE COMIDA.',
        hydration: '2L Agua/Día',
      },
    },
    nutritionist: {
      name: profile.name,
      title: profile.specialty,
      licenseNumber: profile.licenseNumber || '',
      whatsapp: profile.phone,
      personalPhone: profile.personalPhone || '',
      email: profile.contactEmail || profile.email,
      instagram: profile.instagramHandle ? `@${profile.instagramHandle}` : '',
      website: profile.website || '',
      avatar: profile.avatar,
    },
  };
};

// ─── Sección 1: Gestión de Plantilla Base ─────────────────────────────────────
const PlantillaBaseSection: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoError, setLogoError] = useState('');
  const [headerMode, setHeaderMode] = useState<'default' | 'logo'>('default');
  const [selectedTemplate, setSelectedTemplate] = useState('base_v1');

  // ✅ Estado para el perfil, con el mismo patrón de setInterval
  const [userProfile, setUserProfile] = useState(() => store.getUserProfile());

  useEffect(() => {
    const checkInit = setInterval(() => {
      if (store.isInitialized) {
        setUserProfile(store.getUserProfile());
        clearInterval(checkInit);
      }
    }, 100);
    return () => clearInterval(checkInit);
  }, []);

  // Cargar configuración guardada
  useEffect(() => {
    const savedMode = localStorage.getItem(MENU_TEMPLATE_HEADER_MODE_KEY) as 'default' | 'logo' | null;
    const savedLogo = localStorage.getItem(MENU_TEMPLATE_LOGO_URL_KEY);
    const savedTemplate = localStorage.getItem(MENU_TEMPLATE_DESIGN_KEY);

    if (savedMode === 'default' || savedMode === 'logo') setHeaderMode(savedMode);
    if (savedLogo) setLogoUrl(savedLogo);
    if (savedTemplate) setSelectedTemplate(savedTemplate);
    if (savedLogo && !savedMode) setHeaderMode('logo');
  }, []);

  useEffect(() => {
    localStorage.setItem(MENU_TEMPLATE_HEADER_MODE_KEY, headerMode);
  }, [headerMode]);

  useEffect(() => {
    if (logoUrl) {
      localStorage.setItem(MENU_TEMPLATE_LOGO_URL_KEY, logoUrl);
    } else {
      localStorage.removeItem(MENU_TEMPLATE_LOGO_URL_KEY);
    }
  }, [logoUrl]);

  useEffect(() => {
    localStorage.setItem(MENU_TEMPLATE_DESIGN_KEY, selectedTemplate);
  }, [selectedTemplate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError('');
    if (!file) return;

    if (file.size > 500 * 1024) {
      setLogoError('El archivo supera los 500KB. Por favor elige una imagen más liviana.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLogoError('Solo se permiten imágenes (PNG, JPG, SVG).');
      return;
    }

    const MAX_W = 620;
    const MAX_H = 100;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const scaleW = img.width  > MAX_W ? MAX_W / img.width  : 1;
        const scaleH = img.height > MAX_H ? MAX_H / img.height : 1;
        const scale  = Math.min(scaleW, scaleH);
        const outW   = Math.round(img.width  * scale);
        const outH   = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width  = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, outW, outH);

        const dataUrl = canvas.toDataURL('image/png');
        setLogoUrl(dataUrl);
        setHeaderMode('logo');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
    setHeaderMode('default');
    setLogoError('');
    localStorage.removeItem(MENU_TEMPLATE_LOGO_URL_KEY);
    localStorage.setItem(MENU_TEMPLATE_HEADER_MODE_KEY, 'default');
  };

  // ✅ mockData ahora usa userProfile del estado, no directo del store
  const mockData = buildMockData(userProfile);
  const dataWithLogo = {
    ...mockData,
    nutritionist: {
      ...mockData.nutritionist,
      logoUrl: headerMode === 'logo' ? logoUrl : undefined,
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-xl">
            <Layout className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Plantilla Base del Menú</h3>
            <p className="text-sm text-slate-500 mt-0.5">Diseño A4 que se usa al generar e imprimir cualquier menú</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ocultar preview' : 'Ver preview'}
          </button>
          <MenuExportPDF
            elementId="menu-print-area"
            filename={`Menu_${mockData.patient.name.replace(/\s+/g, '_')}`}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-emerald-600 font-bold text-xs uppercase tracking-wide mb-1">Formato</div>
            <div className="text-slate-800 font-semibold">A4 Portrait</div>
            <div className="text-slate-500 text-xs mt-0.5">Listo para imprimir o PDF</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-emerald-600 font-bold text-xs uppercase tracking-wide mb-1">Estructura</div>
            <div className="text-slate-800 font-semibold">Header + Porciones + Menú</div>
            <div className="text-slate-500 text-xs mt-0.5">Cards por día + domingo aparte</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-emerald-600 font-bold text-xs uppercase tracking-wide mb-1">Versión</div>
            <div className="text-slate-800 font-semibold">Plantilla Base V1</div>
            <div className="text-slate-500 text-xs mt-0.5">Datos desde perfil de la nutricionista</div>
          </div>
        </div>
      </div>

      {/* Personalizar Membrete */}
      <div className="p-6 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-600 p-1 rounded">🖼️</span>
          Personalizar Membrete
        </h4>

        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => setHeaderMode('default')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              headerMode === 'default'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-base">👤</span>
            Ícono + Nombre y Especialidad
          </button>

          <button
            onClick={() => setHeaderMode('logo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              headerMode === 'logo'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-base">🖼️</span>
            Logo Personalizado
          </button>

          {headerMode === 'logo' && (
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors">
                📁 {logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </span>
            </label>
          )}

          {logoUrl && (
            <>
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-10 max-w-[180px] object-contain rounded border border-slate-200 bg-white px-2"
              />
              <button
                onClick={handleRemoveLogo}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Quitar logo
              </button>
            </>
          )}
        </div>

        {headerMode === 'logo' && (
          <p className="mt-3 text-xs text-slate-400">
            💡 Tamaño máximo: <strong>620 × 100 px</strong> · Imágenes más grandes se reducirán automáticamente · Máx. archivo: <strong>500 KB</strong> · Formatos: PNG, JPG, SVG
          </p>
        )}
        {logoError && <p className="mt-2 text-xs text-red-500 font-medium">⚠️ {logoError}</p>}
      </div>

      {/* Preview A4 */}
      {showPreview && (
        <div className="p-6 bg-slate-100">
          <MenuPreview
            data={dataWithLogo}
            elementId="menu-print-area"
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />
        </div>
      )}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export const Menus: React.FC<{ onSelectPatient?: (id: string, tab?: string) => void }> = ({ onSelectPatient }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Menús</h2>
        <p className="text-slate-500 mt-1">Administra la plantilla base y las referencias que usa la IA para generar menús.</p>
      </div>

      <PlantillaBaseSection />

      <MenuAIConfigurator />

      <MenuReferences />

      <MenuHistory onSelectPatient={onSelectPatient} />
    </div>
  );
};