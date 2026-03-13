import React, { useEffect, useState } from 'react';
import { Layout, Eye, Trash2 } from 'lucide-react';
import { MenuTemplateV1, MenuTemplateV2, MenuPlanData } from '../components/menus_components/MenuDesignTemplates';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { supabaseService } from '../services/supabaseService';
import { MenuReferences } from '../components/menus_components/MenuReferences';
import { MenuHistory } from '../components/menus_components/MenuHistory';
import { MenuExportPDF } from '../components/menus_components/MenuExportPDF';
import { MenuPreview } from '../components/menus_components/MenuPreview';
import { MenuAIConfigurator } from '../components/menus_components/MenuAIConfigurator';

const MOCK_MEAL_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];

const buildMockData = (
  profile: ReturnType<typeof store.getUserProfile>,
  templateDesign: string = 'plantilla_v1'
): MenuPlanData => {
  const domingoV1 = {
    note: 'Día de descanso. Mantén las porciones controladas y prioriza opciones saludables si sales a comer.',
    hydration: '2L Agua/Día',
  };

  const domingoV2 = {
    mealsOrder: MOCK_MEAL_ORDER,
    desayuno:   { title: 'Avena con leche descremada\n1 fruta picada + canela\n1 huevo estrellado', label: 'Desayuno' },
    refaccion1: { title: '1 yogur griego natural\n6 almendras', label: 'Refacción' },
    almuerzo:   { title: 'Pollo asado a las hierbas 5oz\nArroz integral ½ tz\nEnsalada verde con limón\n¼ aguacate', label: 'Almuerzo' },
    refaccion2: { title: '1 fruta entera\n1 onz queso cottage', label: 'Refacción' },
    cena:       { title: 'Sopa de verduras con pollo\n1 tortilla de maíz\nAgua pura', label: 'Cena' },
    note: 'Día de descanso. Mantén las porciones controladas y prioriza opciones saludables si sales a comer.',
    hydration: '2L Agua/Día',
  };

  const day = (d: string, r1: string, a: string, r2: string, c: string) => ({
    mealsOrder: MOCK_MEAL_ORDER,
    desayuno:   { title: d,  label: 'Desayuno'  },
    refaccion1: { title: r1, label: 'Refacción' },
    almuerzo:   { title: a,  label: 'Almuerzo'  },
    refaccion2: { title: r2, label: 'Refacción' },
    cena:       { title: c,  label: 'Cena'      },
  });

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
      lunes: day(
        'Omelette de 2 huevos + espinaca\n1 rodaja pan integral tostado\n½ tz fresas\nCafé con leche descremada',
        '1 yogur griego natural\n6-8 almendras tostadas',
        'Pechuga de pollo a la plancha 5oz\n½ tz arroz integral\n1 tz ensalada mixta con vinagreta\n¼ aguacate',
        'Licuado: ½ tz leche descremada + 1 fruta\n1 rodaja pan integral con queso ricotta',
        '3 huevos revueltos con tomate y cebolla\n2 tortillas de maíz\n1 onz queso panela'
      ),
      martes: day(
        '½ tz avena cocida con leche descremada\n1 plátano pequeño en rodajas\n2 claras de huevo revueltas',
        '1 manzana con 1 cda mantequilla de maní natural',
        'Lomito de res asado 5oz\n½ tz quinoa con cilantro\n1 tz brócoli al vapor con limón\n¼ aguacate',
        '1 tz leche descremada\n4 galletas integrales con queso cottage',
        'Bowl: lechuga + pepino + tomate cherry\n4oz pollo desmenuzado con limón\n½ tz quinoa cocida'
      ),
      miercoles: day(
        '2 huevos duros + 2 claras\nTomate cherry asado\n1 rodaja pan integral\n1 onz queso panela',
        '1 tz café con ½ tz leche descremada\n1 naranja entera',
        'Filete de pescado horneado 5oz\n½ tz pasta integral salteada con ajo\n1 tz brócoli con limón\n¼ aguacate',
        'Licuado: papaya + leche descremada\n1 rodaja pan integral',
        '1 tz caldo de pollo con verduras\n4oz carne asada con chimichurri\n½ tz camote cocido'
      ),
      jueves: day(
        'Toast: pan integral tostado\n2 huevos estrellados\n1 onz queso cottage\n1 rodaja jamón de pavo\nTomate en rodajas',
        '1 tz leche descremada\n6 nueces + 1 durazno',
        'Salmón a la plancha 5oz\n½ tz arroz a la jardinera\n1 tz espinaca salteada con ajo\n¼ aguacate',
        'Licuado: fruta + leche descremada\n1 rodaja pan integral con ricotta',
        'Bowl ensalada: lechuga + zanahoria\n½ tz arroz integral\n1 onz queso panela\n3oz pollo al limón'
      ),
      viernes: day(
        'Chilaquiles: 1 tz nachos horneados\nSalsa de miltomate natural\n1 huevo estrellado + 2oz pollo\n½ onz mozzarella',
        '1 tz café con leche\n1 pera + 6 almendras',
        'Pollo a la plancha 5oz\n½ tz quinoa con garbanzos\n1 tz tomate + espinaca con limón\n¼ aguacate',
        'Licuado: mango + leche descremada\n1 rodaja pan integral',
        '2 tz ensalada con 4oz atún al natural\nElotitos + palmito\n1 rodaja pan integral tostado'
      ),
      sabado: day(
        '2 panqueques de avena\n(¼ tz avena + 1 huevo + ¼ tz leche)\n2 cdas miel maple sin azúcar\n2oz queso cottage',
        '1 tz yogur griego + granola sin azúcar\n½ tz fresas',
        'Pollo BBQ horneado 5oz\n½ tz coditos integrales salteados\n1 tz ensalada mixta\n¼ aguacate',
        'Licuado verde: espinaca + piña + leche',
        'Ceviche: 4oz camarón\n¼ aguacate\nTomate + pepino + limón\n1 paquete galleta soda integral'
      ),
      domingo: templateDesign === 'plantilla_v2' ? domingoV2 : domingoV1,
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
  const [selectedTemplate, setSelectedTemplate] = useState('plantilla_v1');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    const loadTemplate = async () => {
      const userId = authStore.getCurrentUser()?.id;
      if (!userId) return;
      try {
        const template = await supabaseService.getDefaultMenuTemplate(userId);
        if (template) {
          setTemplateId(template.id);
          setHeaderMode(template.headerMode);
          setLogoUrl(template.logoUrl || undefined);
          setSelectedTemplate(template.templateDesign);
        }
      } catch (err) {
        console.error('Error cargando plantilla:', err);
      }
    };
    loadTemplate();
  }, []);

  const saveTemplate = async (updates: {
    headerMode?: 'default' | 'logo';
    logoUrl?: string | undefined;
    templateDesign?: string;
  }) => {
    const userId = authStore.getCurrentUser()?.id;
    if (!userId) return;
    setIsSaving(true);
    try {
      const saved = await supabaseService.saveMenuTemplate({
        id:             templateId,
        ownerId:        userId,
        headerMode:     updates.headerMode ?? headerMode,
        logoUrl:        updates.logoUrl !== undefined ? updates.logoUrl : logoUrl,
        templateDesign: updates.templateDesign ?? selectedTemplate,
        isDefault:      true,
      });
      setTemplateId(saved.id);
    } catch (err) {
      console.error('Error guardando plantilla:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError('');
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setLogoError('El archivo supera 1 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLogoError('Solo se permiten imágenes (PNG, JPG, SVG).');
      return;
    }

    const MAX_W = 620;
    const MAX_H = 100;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = async () => {
        const scaleW = img.width  > MAX_W ? MAX_W / img.width  : 1;
        const scaleH = img.height > MAX_H ? MAX_H / img.height : 1;
        const scale  = Math.min(scaleW, scaleH);
        const outW   = Math.round(img.width  * scale);
        const outH   = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width  = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, outW, outH);

        let quality = 0.9;
        let blob: Blob | null = null;
        await new Promise<void>(resolve => {
          const tryCompress = () => {
            canvas.toBlob(b => {
              if (!b) { resolve(); return; }
              if (b.size <= 500 * 1024 || quality <= 0.1) {
                blob = b;
                resolve();
              } else {
                quality -= 0.1;
                tryCompress();
              }
            }, 'image/jpeg', quality);
          };
          tryCompress();
        });

        if (!blob) return;

        const userId = authStore.getCurrentUser()?.id;
        if (!userId) return;
        try {
          const compressedFile = new globalThis.File([blob!], file.name, { type: 'image/jpeg' });
          const publicUrl = await supabaseService.uploadMenuLogo(userId, compressedFile);
          setLogoUrl(publicUrl);
          setHeaderMode('logo');
          await saveTemplate({ headerMode: 'logo', logoUrl: publicUrl });
        } catch (err) {
          setLogoError('Error subiendo el logo. Intenta de nuevo.');
          console.error(err);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoUrl(undefined);
    setHeaderMode('default');
    setLogoError('');
    await saveTemplate({ headerMode: 'default', logoUrl: undefined });
  };

  const handleTemplateChange = async (template: string) => {
    setSelectedTemplate(template);
    await saveTemplate({ templateDesign: template });
  };

  const handleHeaderModeChange = async (mode: 'default' | 'logo') => {
    setHeaderMode(mode);
    await saveTemplate({ headerMode: mode });
  };

  const mockData = buildMockData(userProfile, selectedTemplate);
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
          {isSaving && <span className="text-xs text-slate-400 font-medium">Guardando...</span>}
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

      {/* Info cards — dinámicas según plantilla */}
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
            <div className="text-slate-500 text-xs mt-0.5">
              {selectedTemplate === 'plantilla_v2' ? 'Domingo con tiempos de comida' : 'Domingo día libre'}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-emerald-600 font-bold text-xs uppercase tracking-wide mb-1">Versión</div>
            <div className="text-slate-800 font-semibold">
              {selectedTemplate === 'plantilla_v2' ? 'Plantilla V2' : 'Plantilla V1'}
            </div>
            <div className="text-slate-500 text-xs mt-0.5">
              {selectedTemplate === 'plantilla_v2' ? 'Domingo como día normal' : 'Domingo día libre'}
            </div>
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
            onClick={() => handleHeaderModeChange('default')}
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
            onClick={() => handleHeaderModeChange('logo')}
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
            💡 Tamaño máximo: <strong>620 × 100 px</strong> · Imágenes más grandes se reducirán automáticamente · Máx. archivo: <strong>1 MB</strong> · Imágenes comprimidas a 500 KB · Formatos: PNG, JPG, SVG
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
            onTemplateChange={handleTemplateChange}
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