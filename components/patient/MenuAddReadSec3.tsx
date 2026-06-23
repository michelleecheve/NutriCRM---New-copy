import React, { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, Layout,
  X,
  Table as TableIcon, FileText, Copy, Check,
  Lock, Unlock, Bookmark, Palette, Pin,
  Eraser, Trash2, Printer, Pencil
} from 'lucide-react';
import { prefsService } from '../../services/prefsService';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, MenuTemplateDesign, MenuRecommendationData, MenuDesignConfig, DEFAULT_VISUAL_THEME } from '../../types';
import { MenuDesignPanel } from '../menus_components/MenuDesignPanel';
import { MealLabel, MealSlot, WEEKDAY_KEYS, MenuReferenceData, emptyMealPortions, calcPortionsTotal } from '../menus_components/Menu_References_Components/MenuReferencesStorage';
import { MenuPlanData, MealPortions } from '../menus_components/MenuDesignTemplates';
import { EatingOutPageData } from '../menus_components/menudesigntemplates_components/menuTemplateTypes';
import { MenuReferenceParsertoMenuData } from '../menus_components/Menu_References_Components/MenuReferenceParsertoMenuData';
import { MenuExportPDF } from '../menus_components/MenuExportPDF';
import { MenuEditorToolbar, MenuEditorToolbarHandle } from '../menus_components/MenuEditorToolbar';
import { MenuPreview } from '../menus_components/MenuPreview';
import { MenuEditSec3 } from '../menus_components/menu_edit_sec3/MenuEditSec3';
import { store } from '../../services/store';
import { supabaseService } from '../../services/supabaseService';

interface MenuAddReadSec3Props {
  patient: Patient;
  vetData: VetCalculation;
  macros: MacrosRecord;
  portions: PortionsRecord;
  evaluationId: string | null;
  selectedTemplateId: string;
  selectedReferenceIds: string[];
  selectedRecommendationIds: string[];
  menuPreviewData: MenuPlanData | null;
  setMenuPreviewData: (data: MenuPlanData | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  selectedPreviewTemplate: string;
  setSelectedPreviewTemplate: (id: string) => void;
  localDesignConfig: MenuDesignConfig;
  setLocalDesignConfig: (cfg: MenuDesignConfig) => void;
  onDirty?: () => void;
}

// ─── Helper: build a blank MenuPlanData ───────────────────────────────────────
function buildBlankMenuPlanData(patient: Patient, vetData: VetCalculation, nutritionistData: any, evaluationId: string | null = null): MenuPlanData {
  const mealOrder = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
  const mealLabels: Record<string, string> = {
    desayuno: 'Desayuno',
    refaccion1: 'Refacción 1',
    almuerzo: 'Almuerzo',
    refaccion2: 'Refacción 2',
    cena: 'Cena',
  };

  const emptyByMeal: Record<string, MealPortions> = {};
  mealOrder.forEach(id => {
    emptyByMeal[id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 };
  });

  const emptyDay = () => {
    const day: any = { mealsOrder: mealOrder };
    mealOrder.forEach(id => {
      day[id] = { title: '', label: mealLabels[id] };
    });
    return day;
  };

  let fat = 0;
  if (evaluationId) {
    const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
    if (bio) {
      fat = bio.body_fat_pct;
    } else {
      const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
      if (meas) fat = meas.bodyFat || 0;
    }
  }

  return {
    patient: {
      name: `${patient.firstName} ${patient.lastName}`,
      age: vetData.age || patient.clinical?.age || 0,
      weight: vetData.weight || 0,
      height: vetData.height || 0,
      fatPct: fat,
    },
    kcal: vetData.kcalToWork || 0,
    portions: {
      lacteos: 0,
      vegetales: 0,
      frutas: 0,
      cereales: 0,
      carnes: 0,
      grasas: 0,
      byMeal: emptyByMeal,
    },
    weeklyMenu: {
      lunes: emptyDay(),
      martes: emptyDay(),
      miercoles: emptyDay(),
      jueves: emptyDay(),
      viernes: emptyDay(),
      sabado: emptyDay(),
      domingo: { note: '', hydration: '2.5L Agua/Día' },
      domingoV2: emptyDay(), // ✅ Inicializar domingoV2
    },
    nutritionist: nutritionistData,
    recommendations: {
      preparacion: [],
      restricciones: [],
      habitos: [],
      organizacion: []
    }
  };
}

export const MenuAddReadSec3: React.FC<MenuAddReadSec3Props> = ({
  patient,
  vetData,
  macros,
  portions,
  selectedTemplateId,
  selectedReferenceIds,
  selectedRecommendationIds,
  menuPreviewData,
  setMenuPreviewData,
  zoom,
  setZoom,
  selectedPreviewTemplate,
  setSelectedPreviewTemplate,
  localDesignConfig,
  setLocalDesignConfig,
  evaluationId,
  onDirty
}) => {
  // ── Helper: merge current template sectionTitles into a MenuPlanData ──────────
  const withTemplateTitles = (plan: MenuPlanData): MenuPlanData => {
    const st = store.getMenuTemplate()?.sectionTitles;
    if (!st) return plan;
    return { ...plan, sectionTitles: plan.sectionTitles ?? st };
  };

  const [isVisible, setIsVisible] = useState(true);
  const [editMode, setEditMode] = useState<'tabla' | 'preview'>('tabla');
  const [editTablaKey, setEditTablaKey] = useState(0);
  const [isLocked, setIsLocked] = useState<boolean>(() => prefsService.get('menus.locked', false));
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // ─── Save-as-template state ────────────────────────────────────────────────
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [saveTemplateType, setSaveTemplateType] = useState<'ref' | 'rec' | 'eating_out' | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveEatingOutName, setSaveEatingOutName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState<'ref' | 'rec' | 'eating_out' | null>(null);

  const toolbarRef = useRef<MenuEditorToolbarHandle>(null);
  const deleteDropdownRef = useRef<HTMLDivElement>(null);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [isBannerPinned, setIsBannerPinned] = useState(() => prefsService.get('menus.bannerPinned', true));

  // ─── Delete dropdown click-outside ────────────────────────────────────────
  useEffect(() => {
    if (!showDeleteDropdown) return;
    const handler = (e: MouseEvent) => {
      if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(e.target as Node)) {
        setShowDeleteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDeleteDropdown]);

  // ─── Borrar páginas ────────────────────────────────────────────────────────
  const getDeleteablePageCount = () => {
    if (!menuPreviewData) return 0;
    let count = 2;
    if (menuPreviewData.eatingOutPage) count++;
    return count;
  };

  const handleDeletePage = (page: number) => {
    if (!menuPreviewData) return;
    setShowDeleteDropdown(false);
    if (page === 1) {
      const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
      handleSetMenuPreviewData({ ...menuPreviewData, weeklyMenu: blank.weeklyMenu, portions: blank.portions });
    } else if (page === 2) {
      handleSetMenuPreviewData({ ...menuPreviewData, recommendations: { preparacion: [], restricciones: [], habitos: [], organizacion: [] } });
    } else if (page === 3) {
      const { eatingOutPage: _removed, ...rest } = menuPreviewData as any;
      handleSetMenuPreviewData(rest);
    }
    setEditTablaKey(k => k + 1);
  };

  const handleDeleteAllPages = () => {
    setShowDeleteDropdown(false);
    handleSetMenuPreviewData(null);
  };

  // ─── Wrapper for setMenuPreviewData that marks dirty ─────────────────────
  const handleSetMenuPreviewData = (data: MenuPlanData | null) => {
    setMenuPreviewData(data);
    onDirty?.();
  };

  // Toolbar (preview mode) saves → also remount the tabla so its local state is fresh
  const handleSetMenuPreviewDataFromToolbar = (data: MenuPlanData | null) => {
    setMenuPreviewData(data);
    setEditTablaKey(k => k + 1);
    onDirty?.();
  };

  // ─── Template change ──────────────────────────────────────────────────────
  const handleTemplateChange = (templateId: string) => {
    setSelectedPreviewTemplate(templateId);
    setLocalDesignConfig({ ...localDesignConfig, templateDesign: templateId as MenuDesignConfig['templateDesign'] });
  };

  // ─── Design config change ─────────────────────────────────────────────────
  const handleDesignChange = (updates: Partial<MenuDesignConfig>) => {
    const next = { ...localDesignConfig, ...updates };
    setLocalDesignConfig(next);
    if (updates.templateDesign) {
      setSelectedPreviewTemplate(updates.templateDesign);
    }
  };

  // ─── Helper: Get current nutritionist data with logo ──────────────────────
  const getNutritionistData = () => {
    const profile = store.getUserProfile();
    const template = store.getMenuTemplate();
    const logoUrl = template?.headerMode === 'logo' ? template.logoUrl : undefined;

    return {
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
      logoUrl,
      footerConfig: template?.footerConfig,
    };
  };

  // ─── Copy from Reference modal state ──────────────────────────────────────
  const [showCopyRefModal, setShowCopyRefModal] = useState(false);
  const [selectedCopyRefId, setSelectedCopyRefId] = useState<string | null>(null);
  const [selectedCopyRecId, setSelectedCopyRecId] = useState<string | null>(null);
  const [selectedCopyEatingOutRecId, setSelectedCopyEatingOutRecId] = useState<string | null>(null);

  // ─── definir portion table ───────
  const hasPortionTable = !!(menuPreviewData?.portions?.byMeal &&
    Object.keys(menuPreviewData.portions.byMeal).length > 0 &&
    Object.values(menuPreviewData.portions.byMeal).some((m: any) =>
      (m.lacteos || 0) + (m.vegetales || 0) + (m.frutas || 0) + (m.cereales || 0) + (m.carnes || 0) + (m.grasas || 0) > 0
    )
);

  // ─── References available for copying ─────────────────────────────────────
  const availableRefs = store.menuReferences.filter(r =>
    selectedReferenceIds.includes(r.id)
  );

  const availableRecs = store.menuRecommendations.filter(r =>
    selectedRecommendationIds.includes(r.id)
  );
  const availableGeneralRecs   = availableRecs.filter(r => !r.type || r.type === 'general');
  const availableEatingOutRecs = availableRecs.filter(r => r.type === 'eating_out');

  // ─── Iniciar Menú en Blanco ────────────────────────────────────────────────
  const handleStartBlank = () => {
    const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
    handleSetMenuPreviewData(withTemplateTitles(blank));
    setEditTablaKey(k => k + 1);
  };

  // ─── Open Copy from Reference modal ───────────────────────────────────────
  const handleOpenCopyRef = () => {
    if (availableRefs.length === 0 && availableRecs.length === 0) return;
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
    setSelectedCopyEatingOutRecId(null);
    setShowCopyRefModal(true);
  };

  // ─── Confirm Copy from Reference ──────────────────────────────────────────
  const handleConfirmCopyRef = () => {
    if (!selectedCopyRefId && !selectedCopyRecId && !selectedCopyEatingOutRecId) return;

    let plan: MenuPlanData;

    if (selectedCopyRefId) {
      const ref = store.menuReferences.find(x => x.id === selectedCopyRefId);
      if (!ref) return;
      if ((ref.data as any)?.type === 'INTERCAMBIO') {
        const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
        const slots: MealSlot[] = (ref.data as any).portions ?? [];
        const totals = calcPortionsTotal(slots);
        const byMeal: Record<string, any> = {};
        slots.forEach(s => { byMeal[s.id] = { ...s.portions, label: s.label }; });
        plan = {
          ...blank,
          menuType: 'intercambio',
          exchangeMenu: (ref.data as any).exchangeMenu,
          kcal: (ref.data as any).kcal || 0,
          portions: { ...totals, byMeal },
        };
      } else {
        plan = MenuReferenceParsertoMenuData(ref.data);
      }
      // Preserve existing eatingOutPage when building from ref and no eating_out rec selected
      if (!selectedCopyEatingOutRecId && menuPreviewData?.eatingOutPage) {
        plan = { ...plan, eatingOutPage: menuPreviewData.eatingOutPage };
      }
    } else {
      plan = menuPreviewData ? { ...menuPreviewData } : buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
    }

    // Apply general recommendations — only affects page 2, leaves eatingOutPage untouched
    if (selectedCopyRecId) {
      const rec = store.menuRecommendations.find(x => x.id === selectedCopyRecId);
      if (rec) {
        plan = {
          ...plan,
          recommendations: {
            preparacion:   rec.data.preparacion   || [],
            restricciones: rec.data.restricciones || [],
            habitos:       rec.data.habitos       || [],
            organizacion:  rec.data.organizacion  || [],
          },
        };
      }
    }

    // Apply eating-out template — only affects page 3, activates visibility, leaves page 2 untouched
    if (selectedCopyEatingOutRecId) {
      const eoRec = store.menuRecommendations.find(x => x.id === selectedCopyEatingOutRecId);
      if (eoRec) {
        plan = {
          ...plan,
          eatingOutPage: {
            ...(eoRec.data as unknown as EatingOutPageData),
            visible: true,
          },
        };
      }
    }

    // Override patient info with the actual patient
    let fat = 0;
    if (evaluationId) {
      const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
      if (bio) {
        fat = bio.body_fat_pct;
      } else {
        const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
        if (meas) fat = meas.bodyFat || 0;
      }
    }

    const withPatient: MenuPlanData = {
      ...plan,
      patient: {
        name: `${patient.firstName} ${patient.lastName}`,
        age: vetData.age || patient.clinical?.age || 0,
        weight: vetData.weight || 0,
        height: vetData.height || 0,
        fatPct: fat,
      },
      kcal: vetData.kcalToWork || plan.kcal,
      nutritionist: getNutritionistData(),
    };

    handleSetMenuPreviewData(withTemplateTitles(withPatient));
    setShowCopyRefModal(false);
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
    setSelectedCopyEatingOutRecId(null);
    setEditTablaKey(k => k + 1);
  };


  // ─── Copy from Reference Modal ─────────────────────────────────────────────
  const CopyRefModal = () => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Copy className="w-5 h-5 text-indigo-600" />
            Copiar de Plantillas
          </h3>
          <button onClick={() => setShowCopyRefModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Plantillas de referencia (estructura del menú) */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase ml-1">
              Selecciona qué plantilla de referencia copiar
            </p>

            {availableRefs.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                No hay referencias seleccionadas en la sección anterior.
              </p>
            ) : (
              <div className="space-y-2">
                {availableRefs.map(ref => {
                  const isSelected = selectedCopyRefId === ref.id;
                  return (
                    <button
                      key={ref.id}
                      onClick={() => setSelectedCopyRefId(prev => prev === ref.id ? null : ref.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {ref.data.kcal} kcal
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {ref.data?.type === 'INTERCAMBIO'
                            ? (ref.data?.portions?.length ?? 0)
                            : (ref.data?.meals?.length ?? 0)} tiempos · {ref.data?.type}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plantillas de recomendaciones generales (hoja 2) */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase ml-1">
              Selecciona plantilla de recomendaciones generales
            </p>

            {availableGeneralRecs.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                No hay plantillas de recomendaciones generales seleccionadas.
              </p>
            ) : (
              <div className="space-y-2">
                {availableGeneralRecs.map(rec => {
                  const isSelected = selectedCopyRecId === rec.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedCopyRecId(prev => prev === rec.id ? null : rec.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {rec.name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          Recomendaciones generales · hoja 2
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plantillas de comer afuera (hoja 3) */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase ml-1">
              Selecciona plantilla de comer afuera
            </p>

            {availableEatingOutRecs.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                No hay plantillas de comer afuera seleccionadas.
              </p>
            ) : (
              <div className="space-y-2">
                {availableEatingOutRecs.map(rec => {
                  const isSelected = selectedCopyEatingOutRecId === rec.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedCopyEatingOutRecId(prev => prev === rec.id ? null : rec.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                          : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                          {rec.name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          Comer afuera · hoja 3 · se activará visible
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
          <button
            onClick={() => setShowCopyRefModal(false)}
            className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCopyRef}
            disabled={!selectedCopyRefId && !selectedCopyRecId && !selectedCopyEatingOutRecId}
            className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copiar Seleccionado
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Helper: map raw label string → MealLabel ─────────────────────────────
  const mapToMealLabel = (raw: string): MealLabel => {
    const lower = (raw || '').toLowerCase();
    if (lower.includes('desayuno')) return 'Desayuno';
    if (lower.includes('almuerzo')) return 'Almuerzo';
    if (lower.includes('cena')) return 'Cena';
    return 'Refacción';
  };

  // ─── Helper: MenuPlanData → MenuReferenceData ──────────────────────────────
  const menuPlanDataToReferenceData = (plan: MenuPlanData): MenuReferenceData => {
    const lunesData = (plan.weeklyMenu as any)?.lunes;
    const mealsOrder: string[] = lunesData?.mealsOrder || Object.keys((plan.portions as any)?.byMeal || {});

    const meals: MealSlot[] = mealsOrder.map((slotId: string) => {
      const mealInfo = lunesData?.[slotId];
      const rawLabel = mealInfo?.label || slotId;
      const portions = (plan.portions as any)?.byMeal?.[slotId] || emptyMealPortions();
      return { id: slotId, label: mapToMealLabel(rawLabel), portions };
    });

    const refWeeklyMenu: any = {};
    WEEKDAY_KEYS.forEach(day => {
      const dayData = (plan.weeklyMenu as any)?.[day];
      const dayMenu: Record<string, string> = {};
      mealsOrder.forEach((slotId: string) => {
        dayMenu[slotId] = dayData?.[slotId]?.title || '';
      });
      refWeeklyMenu[day] = dayMenu;
    });
    refWeeklyMenu.domingo = { note: (plan.weeklyMenu as any)?.domingo?.note || '' };
    const domingoV2Data = (plan.weeklyMenu as any)?.domingoV2;
    if (domingoV2Data) {
      const dayMenu: Record<string, string> = {};
      mealsOrder.forEach((slotId: string) => {
        dayMenu[slotId] = domingoV2Data?.[slotId]?.title || '';
      });
      refWeeklyMenu.domingoV2 = dayMenu;
    }

    return {
      kcal:        plan.kcal || 0,
      type:        'SEMANAL',
      meals,
      weeklyMenu:  refWeeklyMenu,
      hydration:   (plan.weeklyMenu as any)?.domingo?.hydration || '2.5L Agua/Día',
      patientName: plan.patient?.name   || undefined,
      age:         plan.patient?.age    || undefined,
      weightKg:    plan.patient?.weight || undefined,
      heightCm:    plan.patient?.height || undefined,
      fatPct:      plan.patient?.fatPct || undefined,
    };
  };

  // ─── Save as Reference ─────────────────────────────────────────────────────
  const handleSaveAsRef = async () => {
    if (!menuPreviewData) return;
    setIsSavingTemplate(true);
    try {
      const refData = menuPlanDataToReferenceData(menuPreviewData);
      await store.saveMenuReference({ data: refData });
      setSaveTemplateSuccess('ref');
      setTimeout(() => {
        setShowSaveAsTemplateModal(false);
        setSaveTemplateSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving reference:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ─── Save as Eating Out Recommendation ────────────────────────────────────
  const handleSaveAsEatingOut = async () => {
    if (!menuPreviewData?.eatingOutPage || !saveEatingOutName.trim()) return;
    setIsSavingTemplate(true);
    try {
      await store.saveMenuRecommendation({
        name: saveEatingOutName.trim(),
        data: menuPreviewData.eatingOutPage as unknown as MenuRecommendationData,
        type: 'eating_out',
      });
      setSaveTemplateSuccess('eating_out');
      setSaveEatingOutName('');
      setTimeout(() => {
        setShowSaveAsTemplateModal(false);
        setSaveTemplateSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving eating out recommendation:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ─── Save as Recommendation ────────────────────────────────────────────────
  const handleSaveAsRec = async () => {
    if (!menuPreviewData || !saveTemplateName.trim()) return;
    setIsSavingTemplate(true);
    try {
      const recData: MenuRecommendationData = {
        preparacion:   menuPreviewData.recommendations?.preparacion   || [],
        restricciones: menuPreviewData.recommendations?.restricciones || [],
        habitos:       menuPreviewData.recommendations?.habitos       || [],
        organizacion:  menuPreviewData.recommendations?.organizacion  || [],
        sectionTitles: menuPreviewData.sectionTitles || undefined,
      };
      await store.saveMenuRecommendation({ name: saveTemplateName.trim(), data: recData });
      setSaveTemplateSuccess('rec');
      setSaveTemplateName('');
      setTimeout(() => {
        setShowSaveAsTemplateModal(false);
        setSaveTemplateSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving recommendation:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ─── Save As Template Modal ────────────────────────────────────────────────
  const SaveAsTemplateModal = () => {
    const refData = menuPreviewData ? menuPlanDataToReferenceData(menuPreviewData) : null;
    const totalRecs = menuPreviewData?.recommendations
      ? (menuPreviewData.recommendations.preparacion?.length || 0)
        + (menuPreviewData.recommendations.restricciones?.length || 0)
        + (menuPreviewData.recommendations.habitos?.length || 0)
        + (menuPreviewData.recommendations.organizacion?.length || 0)
      : 0;
    const hasRecs = totalRecs > 0;
    const hasEatingOut = !!(menuPreviewData?.eatingOutPage);
    const isIntercambio = menuPreviewData?.menuType === 'intercambio';

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-600" />
              Opciones para guardar como plantilla
            </h3>
            <button onClick={() => setShowSaveAsTemplateModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {saveTemplateSuccess === 'ref' && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold text-emerald-700">Referencia guardada correctamente</span>
              </div>
            )}
            {saveTemplateSuccess === 'rec' && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold text-emerald-700">Recomendaciones generales guardadas correctamente</span>
              </div>
            )}
            {saveTemplateSuccess === 'eating_out' && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold text-emerald-700">Plantilla de comer afuera guardada correctamente</span>
              </div>
            )}

            {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'ref') && (
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl flex-shrink-0">
                    <Layout className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">
                      {isIntercambio ? 'Referencia de porciones y menú intercambio' : 'Referencia de porciones y menú semanal'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {refData
                        ? `${refData.kcal} kcal · ${refData.meals.length} tiempos de comida`
                        : 'Tabla de porciones y estructura del menú'}
                    </div>
                  </div>
                </div>
                {saveTemplateType === 'ref' ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSaveTemplateType(null)}
                      className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={handleSaveAsRef}
                      disabled={isSavingTemplate}
                      className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingTemplate ? 'Guardando...' : <><Bookmark className="w-4 h-4" />Guardar Referencia</>}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSaveTemplateType('ref')}
                    className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-200"
                  >
                    Guardar como Referencia →
                  </button>
                )}
              </div>
            )}

            {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'rec') && (
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-50 p-2 rounded-xl flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">Recomendaciones generales</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {hasRecs
                        ? `${totalRecs} elementos · preparación, restricciones y hábitos`
                        : 'Este menú no tiene recomendaciones generales'}
                    </div>
                  </div>
                </div>
                {saveTemplateType === 'rec' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre de la plantilla..."
                      value={saveTemplateName}
                      onChange={e => setSaveTemplateName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSaveTemplateType(null)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        ← Volver
                      </button>
                      <button
                        onClick={handleSaveAsRec}
                        disabled={isSavingTemplate || !saveTemplateName.trim()}
                        className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingTemplate ? 'Guardando...' : <><Bookmark className="w-4 h-4" />Guardar Recomendación</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSaveTemplateType('rec')}
                    disabled={!hasRecs}
                    className="w-full py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!hasRecs ? 'Este menú no tiene recomendaciones generales' : ''}
                  >
                    Guardar como Recomendación →
                  </button>
                )}
              </div>
            )}

            {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'eating_out') && (
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-50 p-2 rounded-xl flex-shrink-0">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">Comer afuera</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {hasEatingOut
                        ? 'Guía de opciones para comer fuera de casa'
                        : 'Este menú no tiene sección de comer afuera'}
                    </div>
                  </div>
                </div>
                {saveTemplateType === 'eating_out' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre de la plantilla..."
                      value={saveEatingOutName}
                      onChange={e => setSaveEatingOutName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSaveTemplateType(null)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        ← Volver
                      </button>
                      <button
                        onClick={handleSaveAsEatingOut}
                        disabled={isSavingTemplate || !saveEatingOutName.trim()}
                        className="bg-orange-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingTemplate ? 'Guardando...' : <><Bookmark className="w-4 h-4" />Guardar Comer Afuera</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSaveTemplateType('eating_out')}
                    disabled={!hasEatingOut}
                    className="w-full py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-orange-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!hasEatingOut ? 'Este menú no tiene sección de comer afuera' : ''}
                  >
                    Guardar como Comer Afuera →
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
            <button
              onClick={() => setShowSaveAsTemplateModal(false)}
              className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div
        onClick={() => setIsVisible(!isVisible)}
        className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors rounded-t-3xl overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <Pencil className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Edición y Preview</h2>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Lock toggle — siempre visible en el header */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const next = !isLocked;
            setIsLocked(next);
            prefsService.set('menus.locked', next);
          }}
          title={isLocked ? 'Desbloquear botones de generación' : 'Bloquear botones de generación para evitar cambios accidentales'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isLocked
              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isLocked ? 'Bloqueado' : 'Bloquear'}</span>
        </button>
      </div>

      <div className={isVisible ? 'p-8 space-y-8' : 'hidden'}>

          {/* Design Config Modal */}
          {designModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    Configurar diseño para este menú
                  </h3>
                  <button onClick={() => setDesignModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <MenuDesignPanel
                    templateDesign={localDesignConfig.templateDesign}
                    pageLayout={localDesignConfig.pageLayout}
                    visualTheme={localDesignConfig.visualTheme}
                    onChange={handleDesignChange}
                  />
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
                  <button
                    onClick={() => setDesignModalOpen(false)}
                    className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
                  >
                    Listo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">

            {/* NEW: Iniciar Menú en Blanco */}
            <button
              onClick={handleStartBlank}
              disabled={isLocked}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all border-2 ${
                isLocked
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              Iniciar Menú en Blanco
            </button>

            {/* NEW: Copiar Menú de Ref. */}
            <button
              onClick={handleOpenCopyRef}
              disabled={isLocked || (availableRefs.length === 0 && availableRecs.length === 0)}
              title={
                isLocked
                  ? 'Desbloquea para usar este botón'
                  : availableRefs.length === 0 && availableRecs.length === 0
                  ? 'Selecciona referencias o recomendaciones en la sección anterior'
                  : 'Copiar estructura y datos de una referencia o recomendaciones'
              }
              className={`shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${
                isLocked || (availableRefs.length === 0 && availableRecs.length === 0)
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <Copy className="w-4 h-4" />
              Copiar de Plantillas
            </button>

            <div className="relative flex-1 min-w-[200px] flex gap-1" ref={deleteDropdownRef}>
              <MenuExportPDF
                elementId="menu-print-area"
                filename={`Menu_${patient.firstName}_${new Date().toISOString().split('T')[0]}`}
                disabled={!menuPreviewData}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${
                  !menuPreviewData
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-4 h-4" />
                Exportar PDF
              </MenuExportPDF>
              <button
                onClick={() => setShowDeleteDropdown(prev => !prev)}
                disabled={!menuPreviewData}
                title="Borrar páginas del menú"
                className={`shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${
                  !menuPreviewData
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Eraser className="w-4 h-4" />
                Borrar página
              </button>

              {showDeleteDropdown && menuPreviewData && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 min-w-[210px]">
                  <button
                    onClick={handleDeleteAllPages}
                    className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Borrar todas las páginas
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  {Array.from({ length: getDeleteablePageCount() }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handleDeletePage(page)}
                      className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Borrar página {page}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Preview Area */}
          {menuPreviewData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ── Edit mode toggle — sticky so it stays visible when scrolling ── */}
              <div className={`${isBannerPinned ? 'sticky top-0 z-20' : ''} bg-white/95 backdrop-blur-sm -mx-8 px-8 py-2.5 border-b border-slate-100 shadow-sm flex items-center gap-2 flex-wrap`}>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-fit">
                    <button
                      onClick={() => setEditMode('tabla')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        editMode === 'tabla'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ✏️ Editar en Tabla
                    </button>
                    <button
                      onClick={() => setEditMode('preview')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        editMode === 'preview'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      👁 Vista Previa
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isBannerPinned;
                      setIsBannerPinned(next);
                      prefsService.set('menus.bannerPinned', next);
                    }}
                    title={isBannerPinned ? 'Desanclar barra (scroll normal)' : 'Anclar barra (sticky)'}
                    className={`p-1.5 rounded-lg transition-all ${
                      isBannerPinned
                        ? 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
                        : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
                {editMode === 'preview' && (
                  <button
                    onClick={() => setDesignModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 text-violet-600 hover:bg-violet-100 hover:text-violet-700"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Configurar diseño
                  </button>
                )}
              </div>

              {/* ── Tabla mode — kept in DOM to preserve unsaved edits ── */}
              <div style={{ display: editMode === 'tabla' ? '' : 'none' }}>
                <MenuEditSec3
                  key={`tabla-${editTablaKey}-${menuPreviewData.kcal}-${menuPreviewData.patient.name}`}
                  menuPreviewData={menuPreviewData}
                  setMenuPreviewData={handleSetMenuPreviewData}
                  portions={portions}
                  visible={editMode === 'tabla'}
                />
              </div>

              {/* ── Preview mode (visible) ── */}
              {editMode === 'preview' && (
                <>
                  <MenuPreview
                    data={menuPreviewData}
                    zoom={zoom}
                    setZoom={setZoom}
                    elementId="menu-print-area"
                    selectedTemplate={selectedPreviewTemplate}
                    onTemplateChange={handleTemplateChange}
visualTheme={localDesignConfig.visualTheme}
                    pageLayout={localDesignConfig.pageLayout}
                    onEditPatientInfo={() => toolbarRef.current?.openPatientInfo()}
                    onEditPortions={() => toolbarRef.current?.openPortions()}
                    onEditDay={(day) => toolbarRef.current?.openDay(day)}
                    onEditTemplateNote={() => toolbarRef.current?.openTemplateNote()}
                    onEditHydration={() => toolbarRef.current?.openHydration()}
                    onEditRecSection={(section) => toolbarRef.current?.openRecSection(section)}
                    onEditDomingoLibre={() => toolbarRef.current?.openDomingoLibre()}
                    onEditDomingoCompleto={() => toolbarRef.current?.openDomingoCompleto()}
                    onEditPlanTitle={() => toolbarRef.current?.openPlanTitle()}
                    onEditPage2Title={() => toolbarRef.current?.openPage2Title()}
                  />
                  <MenuEditorToolbar
                    ref={toolbarRef}
                    menuPreviewData={menuPreviewData}
                    setMenuPreviewData={handleSetMenuPreviewDataFromToolbar}
                    patient={patient}
                    vetData={vetData}
                    portions={portions}
                    evaluationId={evaluationId}
                  />
                </>
              )}

              {/* ── Hidden preview kept in DOM so PDF export always finds menu-print-area ── */}
              {editMode === 'tabla' && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <MenuPreview
                    data={menuPreviewData}
                    elementId="menu-print-area"
                    selectedTemplate={selectedPreviewTemplate}
                    hideTemplateSelector
                    visualTheme={localDesignConfig.visualTheme}
                    pageLayout={localDesignConfig.pageLayout}
                  />
                </div>
              )}

              {/* Save as Template */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1">Guardar menú como plantilla para futura referencia</h3>
                <button
                  onClick={() => {
                    setSaveTemplateType(null);
                    setSaveTemplateName('');
                    setSaveEatingOutName('');
                    setSaveTemplateSuccess(null);
                    setShowSaveAsTemplateModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
                >
                  <Bookmark className="w-4 h-4" />
                  Opciones para guardar como plantilla
                </button>
              </div>
            </div>
          )}

          {/* Modals */}
          {showCopyRefModal && <CopyRefModal />}
          {showSaveAsTemplateModal && <SaveAsTemplateModal />}
        </div>
    </section>
  );
};
