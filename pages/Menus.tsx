import React, { useEffect, useState, useRef } from 'react';
import { Layout, Eye, EyeOff, Trash2, Save, CheckCircle, ChevronDown } from 'lucide-react';
import type { MenuFooterConfig, MenuSectionTitles, VisualThemeConfig } from '../types';
import { DEFAULT_SECTION_TITLES, DEFAULT_VISUAL_THEME } from '../types';
import { PALETTES } from '../components/menus_components/menu_css_templates/menuThemes';
import type { Palette } from '../components/menus_components/menu_css_templates/menuThemes';
import { MenuTemplateV1, MenuTemplateV2, MenuPlanData } from '../components/menus_components/MenuDesignTemplates';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { supabaseService } from '../services/supabaseService';
import { MenuReferences } from '../components/menus_components/MenuReferences';
import { MenuHistory } from '../components/menus_components/MenuHistory';
import { MenuExportPDF } from '../components/menus_components/MenuExportPDF';
import { MenuPreview } from '../components/menus_components/MenuPreview';
import { MenuAIConfigurator } from '../components/menus_components/MenuAIConfigurator';
import { MenuRecommendations } from '../components/menus_components/MenuRecommendations';
import { MenuWrapper } from '../components/menus_components/MenuWrapper';
import { Sparkles, FileText, ClipboardList, History } from 'lucide-react';

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
      domingo: domingoV1,
      domingoV2: domingoV2,
    },
    nutritionist: {
      name: profile.name,
      professionalTitle: profile.professionalTitle || '',
      title: profile.specialty,
      licenseNumber: profile.licenseNumber || '',
      whatsapp: profile.phone,
      personalPhone: profile.personalPhone || '',
      email: profile.contactEmail || profile.email,
      instagram: profile.instagramHandle ? `@${profile.instagramHandle}` : '',
      website: profile.website || '',
      address: profile.address || '',
      avatar: profile.avatar,
    },
  };
};

// ─── Sección 1: Gestión de Plantilla Base ─────────────────────────────────────
const DEFAULT_FOOTER_CONFIG: MenuFooterConfig = {
  showName: true,
  showSpecialty: true,
  showLicense: true,
  showClinicPhone: true,
  showPersonalPhone: true,
  showEmail: true,
  showInstagram: true,
  showWebsite: true,
  showAddress: true,
};

const FOOTER_FIELDS: { key: keyof MenuFooterConfig; label: string }[] = [
  { key: 'showName',          label: 'Nombre Completo' },
  { key: 'showSpecialty',     label: 'Especialidad' },
  { key: 'showLicense',       label: 'No. Colegiado' },
  { key: 'showClinicPhone',   label: 'Tel. Clínica' },
  { key: 'showPersonalPhone', label: 'Tel. Personal' },
  { key: 'showEmail',         label: 'Correo Electrónico' },
  { key: 'showInstagram',     label: 'Usuario Instagram' },
  { key: 'showWebsite',       label: 'Página Web' },
  { key: 'showAddress',       label: 'Dirección' },
];

const PlantillaBaseSection: React.FC<{ hideHeader?: boolean; hideContainer?: boolean }> = ({ hideHeader, hideContainer }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoError, setLogoError] = useState('');
  const [headerMode, setHeaderMode] = useState<'default' | 'logo'>('default');
  const [selectedTemplate, setSelectedTemplate] = useState('plantilla_v1');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [footerConfig, setFooterConfig] = useState<MenuFooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [membreteOpen, setMembreteOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [titlesOpen, setTitlesOpen] = useState(false);
  const [sectionTitles, setSectionTitles] = useState<MenuSectionTitles>(DEFAULT_SECTION_TITLES);
  const [visualTheme, setVisualTheme] = useState<VisualThemeConfig>(DEFAULT_VISUAL_THEME);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Intentar cargar desde el store primero (cache en memoria)
      const cached = store.getMenuTemplate();
      if (cached) {
        setTemplateId(cached.id);
        setHeaderMode(cached.headerMode);
        setLogoUrl(cached.logoUrl || undefined);
        setSelectedTemplate(cached.templateDesign);
        if (cached.footerConfig) setFooterConfig(cached.footerConfig);
        if (cached.sectionTitles) setSectionTitles(cached.sectionTitles);
        if (cached.visualTheme) setVisualTheme(cached.visualTheme);
        return;
      }

      const userId = authStore.getCurrentUser()?.id;
      if (!userId) return;
      try {
        const template = await supabaseService.getDefaultMenuTemplate(userId);
        if (template) {
          setTemplateId(template.id);
          setHeaderMode(template.headerMode);
          setLogoUrl(template.logoUrl || undefined);
          setSelectedTemplate(template.templateDesign);
          if (template.footerConfig) setFooterConfig(template.footerConfig);
          if (template.sectionTitles) setSectionTitles(template.sectionTitles);
          if (template.visualTheme) setVisualTheme(template.visualTheme);
          // Actualizar store para futuras navegaciones
          (store as any).menuTemplate = template;
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
    footerConfig?: MenuFooterConfig;
    sectionTitles?: MenuSectionTitles;
    visualTheme?: VisualThemeConfig;
  }) => {
    const userId = authStore.getCurrentUser()?.id;
    if (!userId) return;
    setIsSaving(true);
    try {
      const saved = await store.saveMenuTemplate({
        id:             templateId,
        ownerId:        userId,
        headerMode:     updates.headerMode ?? headerMode,
        logoUrl:        updates.logoUrl !== undefined ? updates.logoUrl : logoUrl,
        templateDesign: updates.templateDesign ?? selectedTemplate,
        isDefault:      true,
        footerConfig:   updates.footerConfig ?? footerConfig,
        sectionTitles:  updates.sectionTitles ?? sectionTitles,
        visualTheme:    updates.visualTheme ?? visualTheme,
      });
      setTemplateId(saved.id);
    } catch (err) {
      console.error('Error guardando plantilla:', err);
    } finally {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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
    if (mode === 'logo') {
      // Pequeño delay para asegurar que el input esté en el DOM si no lo estaba
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 50);
    }
  };

  const mockData = buildMockData(userProfile, selectedTemplate);
  const dataWithLogo = {
    ...mockData,
    sectionTitles,
    nutritionist: {
      ...mockData.nutritionist,
      logoUrl: headerMode === 'logo' ? logoUrl : undefined,
      footerConfig,
    },
  };

  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>
      {!hideHeader ? (
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
            {isSaving && <span className="text-xs text-slate-400 font-medium animate-pulse">Guardando...</span>}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-3 h-3" />
                ¡Guardado!
              </span>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <Eye className="w-4 h-4 hidden md:inline" />
              {showPreview ? 'Ocultar preview' : 'Ver preview'}
            </button>

            <button
              onClick={() => saveTemplate({})}
              disabled={isSaving}
              className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-sm transition-all ${
                saveSuccess
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600'
              }`}
            >
              <Save className={`hidden md:inline w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>

            <MenuExportPDF
              elementId="menu-print-area"
              filename={`Menu_${mockData.patient.name.replace(/\s+/g, '_')}`}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
              hideIconOnMobile
            />
          </div>
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 flex justify-end items-center gap-2 bg-slate-50/30">
          {isSaving && <span className="text-xs text-slate-400 font-medium animate-pulse">Guardando...</span>}
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold animate-in fade-in zoom-in duration-300">
              <CheckCircle className="w-3 h-3" />
              ¡Guardado!
            </span>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
          >
            <Eye className="w-4 h-4 hidden md:inline" />
            {showPreview ? 'Ocultar preview' : 'Ver preview'}
          </button>

          <button
            onClick={() => saveTemplate({})}
            disabled={isSaving}
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-sm transition-all ${
              saveSuccess
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            <Save className={`hidden md:inline w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>

          <MenuExportPDF
            elementId="menu-print-area"
            filename={`Menu_${mockData.patient.name.replace(/\s+/g, '_')}`}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
            hideIconOnMobile
          />
        </div>
      )}

      {/* Info cards — dinámicas según plantilla */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <span className="text-emerald-600 font-bold text-xs uppercase tracking-wide">Estructura: </span>
            <span className="text-slate-800 font-semibold text-sm">Hoja 1: Menú + Hoja 2: Recomendaciones</span>
            <div className="text-slate-500 text-xs mt-0.5">
              {selectedTemplate.startsWith('plantilla_v2') ? 'Tabla Porciones + Menú 7 días' : 'Tabla Porciones + Menú 6 días'}
              {selectedTemplate.endsWith('_4col') ? ' · Grid 4 columnas' : ' · Grid 3 columnas'}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <span className="text-emerald-600 font-bold text-xs uppercase tracking-wide">Versión: </span>
            <span className="text-slate-800 font-semibold text-sm">
              {selectedTemplate.startsWith('plantilla_v2') ? 'Plantilla V2' : 'Plantilla V1'}
            </span>
            <div className="text-slate-500 text-xs mt-0.5">
              {selectedTemplate.startsWith('plantilla_v2') ? 'Domingo con tiempos de comida' : 'Domingo día libre'}
            </div>
          </div>
        </div>
      </div>

      {/* Personalizar Membrete */}
      <div className="border-b border-slate-100">
        <button
          onClick={() => setMembreteOpen(o => !o)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-1 rounded">🖼️</span>
            Personalizar Membrete
          </h4>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${membreteOpen ? 'rotate-180' : ''}`} />
        </button>

        {membreteOpen && (
        <div className="px-6 pb-6">
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
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                className="hidden" 
                onChange={handleLogoUpload} 
              />
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
        )}
      </div>

      {/* Personalizar Pie de Página */}
      <div className="border-b border-slate-100">
        <button
          onClick={() => setFooterOpen(o => !o)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-1 rounded">📋</span>
            Personalizar Pie de Página
          </h4>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${footerOpen ? 'rotate-180' : ''}`} />
        </button>

        {footerOpen && (
        <div className="px-6 pb-6">
        <p className="text-xs text-slate-500 mb-3">Selecciona qué información aparece en el pie de página del menú.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FOOTER_FIELDS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <input
                type="checkbox"
                checked={footerConfig[key]}
                onChange={async (e) => {
                  const updated = { ...footerConfig, [key]: e.target.checked };
                  setFooterConfig(updated);
                  await saveTemplate({ footerConfig: updated });
                }}
                className="w-3.5 h-3.5 accent-emerald-600"
              />
              <span className="text-xs text-slate-700 font-medium">{label}</span>
            </label>
          ))}
        </div>
        </div>
        )}
      </div>

      {/* Personalizar Títulos de Página 2 */}
      <div className="border-b border-slate-100">
        <button
          onClick={() => setTitlesOpen(o => !o)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-1 rounded">✏️</span>
            Personalizar Títulos del Menú
          </h4>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${titlesOpen ? 'rotate-180' : ''}`} />
        </button>

        {titlesOpen && (
          <div className="px-6 pb-6 space-y-5">
            <p className="text-xs text-slate-500">Personaliza los textos que aparecen en el menú. Los cambios se aplican al preview y al PDF exportado.</p>

            {/* Plan title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Título principal (esquina superior derecha)</label>
              <p className="text-[11px] text-slate-400">Usa Enter para separar en dos líneas (ej: "Plan de Alimentación" + "Personalizado")</p>
              <textarea
                rows={2}
                value={sectionTitles.planTitle}
                onChange={e => setSectionTitles(t => ({ ...t, planTitle: e.target.value }))}
                onBlur={e => saveTemplate({ sectionTitles: { ...sectionTitles, planTitle: e.target.value } })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Page 2 title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Título Página 2 (encabezado de recomendaciones)</label>
              <input
                type="text"
                value={sectionTitles.page2Title}
                onChange={e => setSectionTitles(t => ({ ...t, page2Title: e.target.value }))}
                onBlur={e => saveTemplate({ sectionTitles: { ...sectionTitles, page2Title: e.target.value } })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Section titles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Títulos de las 4 secciones</label>
              {([
                { emojiKey: 'preparacionEmoji', titleKey: 'preparacionTitle' },
                { emojiKey: 'restriccionesEmoji', titleKey: 'restriccionesTitle' },
                { emojiKey: 'habitosEmoji', titleKey: 'habitosTitle' },
                { emojiKey: 'organizacionEmoji', titleKey: 'organizacionTitle' },
              ] as { emojiKey: keyof MenuSectionTitles; titleKey: keyof MenuSectionTitles }[]).map(({ emojiKey, titleKey }) => (
                <div key={titleKey} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={sectionTitles[emojiKey] as string}
                    onChange={e => setSectionTitles(t => ({ ...t, [emojiKey]: e.target.value }))}
                    onBlur={e => saveTemplate({ sectionTitles: { ...sectionTitles, [emojiKey]: e.target.value } })}
                    className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-center focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    maxLength={4}
                  />
                  <input
                    type="text"
                    value={sectionTitles[titleKey] as string}
                    onChange={e => setSectionTitles(t => ({ ...t, [titleKey]: e.target.value }))}
                    onBlur={e => saveTemplate({ sectionTitles: { ...sectionTitles, [titleKey]: e.target.value } })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Reset button */}
            <button
              onClick={() => {
                setSectionTitles(DEFAULT_SECTION_TITLES);
                saveTemplate({ sectionTitles: DEFAULT_SECTION_TITLES });
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
            >
              Restaurar valores por defecto
            </button>
          </div>
        )}
      </div>

      {/* Personalizar Diseño de Página */}
      <div className="border-b border-slate-100">
        <button
          onClick={() => setDesignOpen(o => !o)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-1 rounded">🎨</span>
            Diseño Visual del PDF
          </h4>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${designOpen ? 'rotate-180' : ''}`} />
        </button>

        {designOpen && (
          <div className="px-6 pb-6 space-y-5">
            <p className="text-xs text-slate-500">Personaliza la apariencia del PDF exportado. Elige un tema, paleta de colores, fuente y escala de texto.</p>

            {/* Selector de tema */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tema</label>
              <div className="flex gap-3">
                {(['original', 'minimalista'] as const).map(themeId => {
                  const isActive = visualTheme.theme === themeId;
                  const firstPalette = PALETTES[themeId][0];
                  return (
                    <button
                      key={themeId}
                      onClick={() => {
                        const defaultPalette = PALETTES[themeId][0];
                        const next: VisualThemeConfig = {
                          ...visualTheme,
                          theme: themeId,
                          colors: { primary: defaultPalette.primary, secondary: defaultPalette.secondary, tertiary: defaultPalette.tertiary },
                          paletteId: defaultPalette.id,
                        };
                        setVisualTheme(next);
                        saveTemplate({ visualTheme: next });
                      }}
                      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow-sm"
                        style={{ backgroundColor: firstPalette.primary }}
                      />
                      <span className="capitalize">{themeId === 'original' ? 'Original' : 'Minimalista'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paletas predefinidas */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Paleta de Color</label>
              <div className="flex gap-3 flex-wrap">
                {PALETTES[visualTheme.theme].map((palette: Palette) => {
                  const isActive = visualTheme.paletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      title={palette.name}
                      onClick={() => {
                        const next: VisualThemeConfig = {
                          ...visualTheme,
                          colors: { primary: palette.primary, secondary: palette.secondary, tertiary: palette.tertiary },
                          paletteId: palette.id,
                        };
                        setVisualTheme(next);
                        saveTemplate({ visualTheme: next });
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        isActive ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex gap-1">
                        <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: palette.primary }} />
                        <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: palette.secondary }} />
                        <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: palette.tertiary }} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium leading-none">{palette.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Acordeón colores avanzados */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setColorPickerOpen(o => !o)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-600 uppercase tracking-wide"
              >
                <span>▸ Personalizar colores</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${colorPickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {colorPickerOpen && (
                <div className="p-4 space-y-3 bg-white">
                  {(
                    [
                      { key: 'primary',   label: 'Color primario'   },
                      { key: 'secondary', label: 'Color secundario' },
                      { key: 'tertiary',  label: 'Color terciario'  },
                    ] as { key: keyof VisualThemeConfig['colors']; label: string }[]
                  ).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={visualTheme.colors[key]}
                        onChange={e => {
                          const next: VisualThemeConfig = {
                            ...visualTheme,
                            colors: { ...visualTheme.colors, [key]: e.target.value },
                            paletteId: 'custom',
                          };
                          setVisualTheme(next);
                        }}
                        onBlur={() => saveTemplate({ visualTheme })}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <label className="text-xs text-slate-600 font-medium w-32 flex-shrink-0">{label}</label>
                      <input
                        type="text"
                        value={visualTheme.colors[key]}
                        onChange={e => {
                          const val = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                            setVisualTheme(prev => ({
                              ...prev,
                              colors: { ...prev.colors, [key]: val },
                              paletteId: 'custom',
                            }));
                          }
                        }}
                        onBlur={e => {
                          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                            saveTemplate({ visualTheme });
                          }
                        }}
                        maxLength={7}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de fuente */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Fuente</label>
              <div className="flex gap-2">
                {(
                  [
                    { value: 'sans',     label: 'Sans',      hint: 'Arial / Helvetica' },
                    { value: 'serif',    label: 'Serif',     hint: 'Georgia' },
                    { value: 'humanist', label: 'Humanista', hint: 'Trebuchet MS' },
                  ] as { value: VisualThemeConfig['font']; label: string; hint: string }[]
                ).map(opt => (
                  <button
                    key={opt.value}
                    title={opt.hint}
                    onClick={() => {
                      const next: VisualThemeConfig = { ...visualTheme, font: opt.value };
                      setVisualTheme(next);
                      saveTemplate({ visualTheme: next });
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      visualTheme.font === opt.value
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de escala */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Escala de Texto</label>
              <div className="flex gap-2">
                {(
                  [
                    { value: 'compact',  label: 'Compacto'  },
                    { value: 'normal',   label: 'Normal'    },
                    { value: 'spacious', label: 'Espacioso' },
                  ] as { value: VisualThemeConfig['sizeScale']; label: string }[]
                ).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const next: VisualThemeConfig = { ...visualTheme, sizeScale: opt.value };
                      setVisualTheme(next);
                      saveTemplate({ visualTheme: next });
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      visualTheme.sizeScale === opt.value
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Layout del Grid Semanal</label>
              <p className="text-[11px] text-slate-400">Define cómo se distribuyen los días de la semana en el PDF.</p>
              <div className="flex gap-2">
                {([
                  { value: '3col', label: '3 columnas', desc: 'Lun-Mar-Mié / Jue-Vie-Sáb' },
                  { value: '4col', label: '4 columnas', desc: 'Lun-Mar-Mié-Jue / Vie-Sáb + split' },
                ] as { value: string; label: string; desc: string }[]).map(opt => {
                  const isActive = opt.value === '4col' ? selectedTemplate.endsWith('_4col') : !selectedTemplate.endsWith('_4col');
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const base = selectedTemplate.replace('_4col', '');
                        const next = opt.value === '4col' ? `${base}_4col` : base;
                        handleTemplateChange(next);
                      }}
                      className={`flex-1 flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setVisualTheme(DEFAULT_VISUAL_THEME);
                saveTemplate({ visualTheme: DEFAULT_VISUAL_THEME });
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
            >
              Restaurar diseño por defecto
            </button>
          </div>
        )}
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

      <MenuWrapper 
        title="Plantilla Base del Menú" 
        icon={<Layout className="w-5 h-5 text-emerald-600" />}
        description="Diseño A4 que se usa al generar e imprimir cualquier menú"
      >
        <PlantillaBaseSection hideHeader hideContainer />
      </MenuWrapper>

      <MenuWrapper 
        title="Configuración de AI para Menús" 
        icon={<Sparkles className="w-5 h-5 text-indigo-600" />}
        description="Personaliza cómo Gemini genera los menús de tus pacientes"
      >
        <MenuAIConfigurator hideHeader hideContainer />
      </MenuWrapper>

      <MenuWrapper 
        title="Plantillas de Referencias" 
        icon={<FileText className="w-5 h-5 text-blue-600" />}
        description="Ingresa un menú de referencia por kcal para que la IA lo use como base"
      >
        <MenuReferences hideHeader hideContainer />
      </MenuWrapper>

      <MenuWrapper 
        title="Plantillas de Recomendaciones" 
        icon={<ClipboardList className="w-5 h-5 text-emerald-600" />}
        description="Gestiona tus notas predefinidas para la página 2 del menú"
      >
        <MenuRecommendations hideHeader hideContainer />
      </MenuWrapper>

      <MenuWrapper 
        title="Historial de Menús" 
        icon={<History className="w-5 h-5 text-blue-600" />}
        description="Visualiza y exporta menús creados anteriormente para tus pacientes"
        defaultOpen={true}
      >
        <MenuHistory onSelectPatient={onSelectPatient} hideHeader hideContainer />
      </MenuWrapper>
    </div>
  );
};