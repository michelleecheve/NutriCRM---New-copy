import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Eye, EyeOff, Layout,
  X,
  Table as TableIcon, FileText, Copy, Check,
  Lock, Unlock, Bookmark, Shuffle, Sliders, Palette
} from 'lucide-react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, MenuTemplateDesign, MenuRecommendationData, MenuDesignConfig, DEFAULT_VISUAL_THEME } from '../../types';
import { MenuDesignPanel } from '../menus_components/MenuDesignPanel';
import { MealLabel, MealSlot, WEEKDAY_KEYS, MenuReferenceData, emptyMealPortions } from '../menus_components/Menu_References_Components/MenuReferencesStorage';
import { MenuPlanData, MealPortions } from '../menus_components/MenuDesignTemplates';
import { MenuReferenceParsertoMenuData } from '../menus_components/Menu_References_Components/MenuReferenceParsertoMenuData';
import { MenuExportPDF } from '../menus_components/MenuExportPDF';
import { MenuEditorToolbar, MenuEditorToolbarHandle } from '../menus_components/MenuEditorToolbar';
import { MenuPreview } from '../menus_components/MenuPreview';
import { MenuEditSec3 } from '../menus_components/menu_edit_sec3/MenuEditSec3';
import { generateStructuredMenu, generateMixFromReferences, adaptPortionsFromMenu, regenerateSingleDay, regenerateMealSlot } from '../../services/geminiService';
import { MenuAIActionsPanel } from '../menus_components/MenuAIActionsPanel';
import { store } from '../../services/store';
import { authStore } from '../../services/authStore';
import { showPlanLimitModal } from '../PlanLimitModal';
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
  aiDraftText: string;
  setAiDraftText: (text: string) => void;
  aiRationale: string;
  setAiRationale: (text: string) => void;
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
  aiDraftText,
  setAiDraftText,
  aiRationale,
  setAiRationale,
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
  const [isLocked, setIsLocked] = useState<boolean>(() => {
  try { return localStorage.getItem('nutriflow_menu_locked') === 'true'; }
  catch { return false; }
  });
  const [showAiOptionsModal, setShowAiOptionsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMixing, setIsMixing] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // ─── Save-as-template state ────────────────────────────────────────────────
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [saveTemplateType, setSaveTemplateType] = useState<'ref' | 'rec' | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState<'ref' | 'rec' | null>(null);

  const toolbarRef = useRef<MenuEditorToolbarHandle>(null);
  const [designModalOpen, setDesignModalOpen] = useState(false);

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

  // ─── Iniciar Menú en Blanco ────────────────────────────────────────────────
  const handleStartBlank = () => {
    const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
    handleSetMenuPreviewData(withTemplateTitles(blank));
    setAiRationale('');
    setAiDraftText('');
    setEditTablaKey(k => k + 1);
  };

  // ─── Open Copy from Reference modal ───────────────────────────────────────
  const handleOpenCopyRef = () => {
    if (availableRefs.length === 0 && availableRecs.length === 0) return;
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
    setShowCopyRefModal(true);
  };

  // ─── Confirm Copy from Reference ──────────────────────────────────────────
  const handleConfirmCopyRef = () => {
    if (!selectedCopyRefId && !selectedCopyRecId) return;

    let plan: MenuPlanData;

    if (selectedCopyRefId) {
      const ref = store.menuReferences.find(x => x.id === selectedCopyRefId);
      if (!ref) return;
      plan = MenuReferenceParsertoMenuData(ref.data);
    } else {
      // If no reference selected, use current preview as base or blank if null
      plan = menuPreviewData ? { ...menuPreviewData } : buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
    }

    // Get recommendations if selected
    let recommendations = plan.recommendations || {
      preparacion: [],
      restricciones: [],
      habitos: [],
      organizacion: []
    };

    if (selectedCopyRecId) {
      const rec = store.menuRecommendations.find(x => x.id === selectedCopyRecId);
      if (rec) {
        recommendations = {
          preparacion: rec.data.preparacion || [],
          restricciones: rec.data.restricciones || [],
          habitos: rec.data.habitos || [],
          organizacion: rec.data.organizacion || []
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
      recommendations: recommendations
    };

    handleSetMenuPreviewData(withTemplateTitles(withPatient));
    setAiRationale('');
    setAiDraftText('');
    setShowCopyRefModal(false);
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
    setEditTablaKey(k => k + 1);
  };

  // ─── AI Generation ─────────────────────────────────────────────────────────
  const handleGenerateAi = async (scope: 'page1' | 'page2' | 'both' = 'both') => {
    setShowAiOptionsModal(false);
    if (!authStore.canUseAI()) {
      showPlanLimitModal();
      return;
    }
    setIsGenerating(true);
    try {
      const refs = store.menuReferences
        .filter(r => selectedReferenceIds.includes(r.id))
        .map(r => ({ title: `${r.data.kcal} kcal`, data: r.data }));

      const nutritionistData = getNutritionistData();

      // ✅ Cargar bioimpedancia si existe vinculación
      let bioData = null;
      if (evaluationId) {
        const ev = store.getEvaluationById(evaluationId);
        if (ev) {
          // Buscar en bioimpedancias del paciente
          bioData = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId) || null;
          // Si no hay, buscar en antropometría (como fallback de datos básicos)
          if (!bioData) {
            const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
            if (meas) {
              bioData = {
                weight: meas.weight,
                fat_pct: meas.bodyFat,
                muscle_pct: meas.muscleKg ? ((meas.muscleKg / (meas.weight || 1)) * 100).toFixed(1) : undefined,
                visceral_fat: meas.visceralFat,
                basal_metabolism: meas.basalMetabolism,
                metabolic_age: meas.metabolicAge,
                body_water: meas.bodyWater,
                bone_mass: meas.boneMass
              };
            }
          }
        }
      }

      // ✅ Cargar plantilla guardada (diseño)
      let templateDesign: MenuTemplateDesign = 'plantilla_v1';
      const template = store.getMenuTemplate();
      if (template) {
        templateDesign = template.templateDesign as MenuTemplateDesign;
      }

      const result = await generateStructuredMenu(
        patient,
        vetData,
        menuPreviewData?.portions || portions,
        refs,
        nutritionistData,
        evaluationId || undefined,
        templateDesign,
        scope,
        bioData
      );

      // ✅ Override patient info with vetData to ensure consistency
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

      const finalPlan: MenuPlanData = {
        ...result.plan,
        patient: {
          name: `${patient.firstName} ${patient.lastName}`,
          age: vetData.age || patient.clinical?.age || 0,
          weight: vetData.weight || 0,
          height: vetData.height || 0,
          fatPct: fat,
        },
        kcal: vetData.kcalToWork || result.plan.kcal
      };

      if (scope === 'page1') {
        // Keep existing recommendations if any
        const currentRecs = menuPreviewData?.recommendations;
        handleSetMenuPreviewData(withTemplateTitles({
          ...finalPlan,
          recommendations: currentRecs || finalPlan.recommendations
        }));
      } else if (scope === 'page2') {
        // Keep existing menu if any, but update patient info and recommendations
        if (menuPreviewData) {
          handleSetMenuPreviewData(withTemplateTitles({
            ...menuPreviewData,
            patient: finalPlan.patient,
            kcal: finalPlan.kcal,
            recommendations: finalPlan.recommendations
          }));
        } else {
          handleSetMenuPreviewData(withTemplateTitles(finalPlan));
        }
      } else {
        handleSetMenuPreviewData(withTemplateTitles(finalPlan));
      }

      setAiRationale(result.rationale);
      setAiDraftText(`Menú generado por IA (${scope === 'both' ? 'Completo' : scope === 'page1' ? 'Página 1' : 'Página 2'})`);
      setEditTablaKey(k => k + 1);

    } catch (error: any) {
      console.error("Error generating menu:", error);
      setInfoModal({
        title: "Error de generación",
        message: error.message || "Hubo un error al generar el menú con IA. Por favor intenta de nuevo."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Mix de plantillas de referencia ──────────────────────────────────────
  const handleMixReferences = async () => {
    if (!authStore.canUseAI()) { showPlanLimitModal(); return; }
    if (selectedReferenceIds.length < 2) return;
    setIsMixing(true);
    try {
      const refs = store.menuReferences
        .filter(r => selectedReferenceIds.includes(r.id))
        .map(r => ({ title: `${r.data.kcal} kcal`, data: r.data }));

      let bioData = null;
      if (evaluationId) {
        bioData = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId) || null;
        if (!bioData) {
          const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
          if (meas) bioData = { weight: meas.weight, fat_pct: meas.bodyFat, muscle_pct: meas.muscleKg ? ((meas.muscleKg / (meas.weight || 1)) * 100).toFixed(1) : undefined, visceral_fat: meas.visceralFat, basal_metabolism: meas.basalMetabolism, metabolic_age: meas.metabolicAge };
        }
      }

      const result = await generateMixFromReferences(
        patient, vetData,
        menuPreviewData?.portions || portions,
        refs, getNutritionistData(),
        evaluationId, bioData
      );

      let fat = 0;
      if (evaluationId) {
        const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
        if (bio) fat = bio.body_fat_pct;
        else { const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId); if (meas) fat = meas.bodyFat || 0; }
      }

      const finalPlan: MenuPlanData = {
        ...result.plan,
        patient: { name: `${patient.firstName} ${patient.lastName}`, age: vetData.age || patient.clinical?.age || 0, weight: vetData.weight || 0, height: vetData.height || 0, fatPct: fat },
        kcal: vetData.kcalToWork || result.plan.kcal,
      };

      handleSetMenuPreviewData(withTemplateTitles(finalPlan));
      setAiRationale(result.rationale);
      setAiDraftText('Menú generado — Mix de referencias');
      setEditTablaKey(k => k + 1);
    } catch (error: any) {
      setInfoModal({ title: 'Error en Mix de referencias', message: error.message || 'Hubo un error al generar el mix. Intenta de nuevo.' });
    } finally {
      setIsMixing(false);
    }
  };

  // ─── Adaptar porciones de referencia copiada ──────────────────────────────
  const handleAdaptPortions = async () => {
    if (!authStore.canUseAI()) { showPlanLimitModal(); return; }
    if (!menuPreviewData) return;
    setIsAdapting(true);
    try {
      const result = await adaptPortionsFromMenu(
        menuPreviewData,
        menuPreviewData?.portions || portions,
        patient, vetData, getNutritionistData()
      );

      let fat = 0;
      if (evaluationId) {
        const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
        if (bio) fat = bio.body_fat_pct;
        else { const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId); if (meas) fat = meas.bodyFat || 0; }
      }

      const finalPlan: MenuPlanData = {
        ...result.plan,
        patient: { name: `${patient.firstName} ${patient.lastName}`, age: vetData.age || patient.clinical?.age || 0, weight: vetData.weight || 0, height: vetData.height || 0, fatPct: fat },
        kcal: vetData.kcalToWork || result.plan.kcal,
      };

      handleSetMenuPreviewData(withTemplateTitles(finalPlan));
      setAiRationale(result.rationale);
      setAiDraftText('Porciones adaptadas por IA');
      setEditTablaKey(k => k + 1);
    } catch (error: any) {
      setInfoModal({ title: 'Error al adaptar porciones', message: error.message || 'Hubo un error al adaptar las porciones. Intenta de nuevo.' });
    } finally {
      setIsAdapting(false);
    }
  };

  // ─── Regenerar un día ─────────────────────────────────────────────────────
  const handleRegenerateDay = async (dayKey: string) => {
    if (!authStore.canUseAI()) { showPlanLimitModal(); throw new Error('Límite de tokens alcanzado.'); }
    if (!menuPreviewData) throw new Error('No hay menú cargado.');
    const updated = await regenerateSingleDay(menuPreviewData, dayKey, patient, vetData);
    handleSetMenuPreviewData(withTemplateTitles(updated));
    setAiDraftText(`Día ${dayKey} regenerado por IA`);
  };

  // ─── Cambiar un tiempo de comida ───────────────────────────────────────────
  const handleRegenerateMealSlot = async (slotId: string, label: string) => {
    if (!authStore.canUseAI()) { showPlanLimitModal(); throw new Error('Límite de tokens alcanzado.'); }
    if (!menuPreviewData) throw new Error('No hay menú cargado.');
    const updated = await regenerateMealSlot(menuPreviewData, slotId, label, patient, vetData);
    handleSetMenuPreviewData(withTemplateTitles(updated));
    setAiDraftText(`${label} actualizado por IA (toda la semana)`);
  };

  // ─── AI Options Modal ──────────────────────────────────────────────────────
  const AiOptionsModal = () => {
    // If no portion table, show inline editor first
    if (!hasPortionTable) {
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Antes de generar
              </h3>
              <button onClick={() => setShowAiOptionsModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <TableIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-800">Tabla de porciones requerida</p>
                  <p className="text-xs text-amber-600 font-medium leading-relaxed">
                    Para generar el menú con IA, primero necesitás definir la distribución de porciones por tiempo de comida.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiOptionsModal(false);
                  if (!menuPreviewData) handleStartBlank();
                  setTimeout(() => toolbarRef.current?.openPortions(), 200);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <TableIcon className="w-5 h-5" />
                Editar Tabla de Porciones
              </button>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
              <button onClick={() => setShowAiOptionsModal(false)} className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Normal options when portion table exists
    const canMix = selectedReferenceIds.length >= 2;
    const canAdapt = !!menuPreviewData;

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl flex-shrink-0">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Opciones de Generación
            </h3>
            <button onClick={() => setShowAiOptionsModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-3 overflow-y-auto flex-1">
            <button onClick={() => handleGenerateAi('page1')} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group">
              <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-white transition-colors">
                <Layout className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">Generar página 1</div>
                <div className="text-xs text-slate-400 font-medium">Menú semanal y tiempos de comida</div>
              </div>
            </button>
            <button onClick={() => handleGenerateAi('page2')} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group">
              <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-white transition-colors">
                <FileText className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">Generar Pagina 2</div>
                <div className="text-xs text-slate-400 font-medium">Recomendaciones personalizadas</div>
              </div>
            </button>
            <button onClick={() => handleGenerateAi('both')} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group">
              <div className="bg-indigo-100 p-2 rounded-xl group-hover:bg-white transition-colors">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-700">Generar ambas paginas</div>
                <div className="text-xs text-indigo-500/70 font-medium">Plan completo (Menú + Recs)</div>
              </div>
            </button>

            <div className="pt-1 border-t border-slate-100" />

            <button
              onClick={() => { setShowAiOptionsModal(false); handleMixReferences(); }}
              disabled={!canMix}
              title={!canMix ? 'Selecciona 2 o 3 referencias en la sección anterior para activar' : `Genera un mix fiel de ${selectedReferenceIds.length} referencias seleccionadas`}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${
                canMix
                  ? 'border-slate-200 hover:border-violet-500 hover:bg-violet-50'
                  : 'border-slate-100 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${canMix ? 'bg-slate-100 group-hover:bg-white' : 'bg-slate-50'}`}>
                <Shuffle className="w-5 h-5 text-slate-500 group-hover:text-violet-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 group-hover:text-violet-700">Mix de referencias</div>
                <div className="text-xs text-slate-400 font-medium">
                  {canMix ? `Combina ${selectedReferenceIds.length} referencias seleccionadas` : 'Requiere 2+ referencias seleccionadas'}
                </div>
              </div>
            </button>

            <button
              onClick={() => { setShowAiOptionsModal(false); handleAdaptPortions(); }}
              disabled={!canAdapt}
              title={!canAdapt ? 'Copia o genera un menú primero' : 'Adapta las cantidades del menú actual a la tabla de porciones'}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${
                canAdapt
                  ? 'border-slate-200 hover:border-teal-500 hover:bg-teal-50'
                  : 'border-slate-100 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${canAdapt ? 'bg-slate-100 group-hover:bg-white' : 'bg-slate-50'}`}>
                <Sliders className="w-5 h-5 text-slate-500 group-hover:text-teal-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-700 group-hover:text-teal-700">Adaptar porciones</div>
                <div className="text-xs text-slate-400 font-medium">
                  {canAdapt ? 'Ajusta el menú actual a la tabla de porciones' : 'Requiere un menú cargado primero'}
                </div>
              </div>
            </button>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
            <button onClick={() => setShowAiOptionsModal(false)} className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Copy from Reference Modal ─────────────────────────────────────────────
  const CopyRefModal = () => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Copy className="w-5 h-5 text-indigo-600" />
            Copiar desde Referencia
          </h3>
          <button onClick={() => setShowCopyRefModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                          {ref.data.meals.length} tiempos · {ref.data.type}
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

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase ml-1">
              Selecciona qué plantilla de recomendaciones copiar
            </p>

            {availableRecs.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                No hay recomendaciones seleccionadas en la sección anterior.
              </p>
            ) : (
              <div className="space-y-2">
                {availableRecs.map(rec => {
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
                          Plantilla de recomendaciones
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
            disabled={!selectedCopyRefId && !selectedCopyRecId}
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

          <div className="p-6 space-y-4">
            {saveTemplateSuccess === 'ref' && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold text-emerald-700">Referencia guardada correctamente</span>
              </div>
            )}
            {saveTemplateSuccess === 'rec' && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold text-emerald-700">Recomendación guardada correctamente</span>
              </div>
            )}

            {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'ref') && (
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl flex-shrink-0">
                    <Layout className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">Hoja 1 · Referencia de Porciones</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {refData
                        ? `${refData.kcal} kcal · ${refData.meals.length} tiempos de comida · Menú semanal`
                        : 'Tabla de porciones y menú semanal'}
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
                    <div className="text-sm font-bold text-slate-800">Hoja 2 · Recomendaciones</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {hasRecs
                        ? `${totalRecs} elementos · preparación, restricciones y hábitos`
                        : 'Este menú no tiene recomendaciones en la Hoja 2'}
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
                    title={!hasRecs ? 'Este menú no tiene recomendaciones en la Hoja 2' : ''}
                  >
                    Guardar como Recomendación →
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
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        onClick={() => setIsVisible(!isVisible)}
        className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Generación y Preview</h2>
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
            try { localStorage.setItem('nutriflow_menu_locked', String(next)); } catch {}
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
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all border-2 ${
                isLocked || (availableRefs.length === 0 && availableRecs.length === 0)
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <Copy className="w-5 h-5" />
              {availableRefs.length > 0 && availableRecs.length > 0
                ? 'Copiar Ambas Plantillas'
                : availableRefs.length > 0
                ? 'Copiar Referencia'
                : availableRecs.length > 0
                ? 'Copiar Recomendación'
                : 'Copiar desde Plantilla'}
            </button>

            {/* EXISTING: Generar menú con AI — modified to open options modal */}
            <button
              onClick={() => setShowAiOptionsModal(true)}
              disabled={isGenerating || isMixing || isAdapting || isLocked}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                isGenerating || isMixing || isAdapting || isLocked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGenerating ? 'Generando...' : 'Generar menú con AI'}
            </button>

            <MenuExportPDF
              elementId="menu-print-area"
              filename={`Menu_${patient.firstName}_${new Date().toISOString().split('T')[0]}`}
              disabled={!menuPreviewData}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all border-2 ${
                !menuPreviewData
                ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                : 'border-slate-800 text-slate-800 hover:bg-slate-50'
              }`}
            />

          </div>

          {/* AI Actions Panel — visible cuando hay menú generado */}
          {menuPreviewData && (
            <MenuAIActionsPanel
              patient={patient}
              menuPreviewData={menuPreviewData}
              aiRationale={aiRationale}
              isLocked={isLocked}
              evaluationId={evaluationId}
              onRegenerateDay={handleRegenerateDay}
              onRegenerateMealSlot={handleRegenerateMealSlot}
            />
          )}

          {/* Preview Area */}
          {menuPreviewData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ── Edit mode toggle ── */}
              <div className="flex items-center gap-2 flex-wrap">
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
                    defaultEditMode={true}
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
          {showAiOptionsModal && <AiOptionsModal />}
          {showSaveAsTemplateModal && <SaveAsTemplateModal />}
        </div>
    </section>
  );
};
