import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Eye, EyeOff, Layout,
  ChevronDown, ChevronUp, Save, X,
  Table as TableIcon, FileText, Copy, Check,
  Lock, Unlock
} from 'lucide-react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, MenuTemplateDesign } from '../../types';
import { MenuPlanData, MealPortions } from '../menus_components/MenuDesignTemplates';
import { MenuReferenceParsertoMenuData } from '../menus_components/Menu_References_Components/MenuReferenceParsertoMenuData';
import { MenuExportPDF } from '../menus_components/MenuExportPDF';
import { MenuEditorToolbar, MenuEditorToolbarHandle } from '../menus_components/MenuEditorToolbar';
import { MenuPreview } from '../menus_components/MenuPreview';
import { generateStructuredMenu } from '../../services/geminiService';
import { store } from '../../services/store';
import { authStore } from '../../services/authStore';
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
  onSave?: () => Promise<boolean>;
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
  evaluationId,
  onSave
}) => {
  // ── Helper: merge current template sectionTitles into a MenuPlanData ──────────
  const withTemplateTitles = (plan: MenuPlanData): MenuPlanData => {
    const st = store.getMenuTemplate()?.sectionTitles;
    if (!st) return plan;
    return { ...plan, sectionTitles: plan.sectionTitles ?? st };
  };

  const [isVisible, setIsVisible] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
  try { return localStorage.getItem('nutriflow_menu_locked') === 'true'; }
  catch { return false; }
  });
  const [showRationale, setShowRationale] = useState(true);
  const [showAiOptionsModal, setShowAiOptionsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  const toolbarRef = useRef<MenuEditorToolbarHandle>(null);

  // ─── Template change ──────────────────────────────────────────────────────
  const handleTemplateChange = (templateId: string) => {
    setSelectedPreviewTemplate(templateId);
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
    setMenuPreviewData(withTemplateTitles(blank));
    setAiRationale('');
    setAiDraftText('');
  };

  // ─── Open Copy from Reference modal ───────────────────────────────────────
  const handleOpenCopyRef = () => {
    if (availableRefs.length === 0 && availableRecs.length === 0) return;

    // Pre-select the first available ref if exists
    if (availableRefs.length > 0) {
      setSelectedCopyRefId(availableRefs[0].id);
    } else {
      setSelectedCopyRefId(null);
    }

    // Pre-select the first available rec if exists
    if (availableRecs.length > 0) {
      setSelectedCopyRecId(availableRecs[0].id);
    } else {
      setSelectedCopyRecId(null);
    }
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

    setMenuPreviewData(withTemplateTitles(withPatient));
    setAiRationale('');
    setAiDraftText('');
    setShowCopyRefModal(false);
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
  };

  // ─── AI Generation ─────────────────────────────────────────────────────────
  const handleGenerateAi = async (scope: 'page1' | 'page2' | 'both' = 'both') => {
    setShowAiOptionsModal(false);
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
        nutritionistData, // ✅ logo aplicado vía helper
        undefined,
        templateDesign,    // ✅ plantilla aplicada vía store
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
        setMenuPreviewData(withTemplateTitles({
          ...finalPlan,
          recommendations: currentRecs || finalPlan.recommendations
        }));
      } else if (scope === 'page2') {
        // Keep existing menu if any, but update patient info and recommendations
        if (menuPreviewData) {
          setMenuPreviewData(withTemplateTitles({
            ...menuPreviewData,
            patient: finalPlan.patient,
            kcal: finalPlan.kcal,
            recommendations: finalPlan.recommendations
          }));
        } else {
          setMenuPreviewData(withTemplateTitles(finalPlan));
        }
      } else {
        setMenuPreviewData(withTemplateTitles(finalPlan));
      }

      setAiRationale(result.rationale);
      setAiDraftText(`Menú generado por IA (${scope === 'both' ? 'Completo' : scope === 'page1' ? 'Página 1' : 'Página 2'})`);

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

  // ─── AI Options Modal ──────────────────────────────────────────────────────
  const AiOptionsModal = () => {
    // If no portion table, show inline editor first
    if (!hasPortionTable) {
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Antes de generar
              </h3>
              <button onClick={() => setShowAiOptionsModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
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
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setShowAiOptionsModal(false)} className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Normal options when portion table exists
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Opciones de Generación
            </h3>
            <button onClick={() => setShowAiOptionsModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-3">
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
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
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
            {onSave && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await onSave();
                  if (ok) {
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                  }
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Guardar cambios"
              >
                {showSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">Guardado con éxito</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="text-xs font-bold">Guardar</span>
                  </>
                )}
              </button>
            )}
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
          {isLocked ? 'Bloqueado' : 'Bloquear'}
        </button>
      </div>

      {isVisible && (
        <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">

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
              disabled={isLocked || availableRefs.length === 0}
              title={isLocked ? 'Desbloquea para usar este botón' : availableRefs.length === 0 ? 'Selecciona referencias en la sección anterior' : 'Copiar estructura y datos de una referencia'}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all border-2 ${
                isLocked || availableRefs.length === 0
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <Copy className="w-5 h-5" />
              Copiar desde Plantilla
            </button>

            {/* EXISTING: Generar menú con AI — modified to open options modal */}
            <button
              onClick={() => setShowAiOptionsModal(true)}
              disabled={isGenerating || isLocked}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                isGenerating || isLocked
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

          {/* Rationale Box */}
          {aiRationale && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden transition-all">
              <button
                onClick={() => setShowRationale(!showRationale)}
                className="w-full p-4 flex items-center justify-between text-indigo-700 font-bold text-sm"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  ¿Qué hizo la IA y por qué?
                </div>
                {showRationale ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRationale && (
                <div className="p-6 pt-0 text-sm text-indigo-600/80 font-medium leading-relaxed whitespace-pre-line animate-in fade-in duration-300">
                  {aiRationale}
                </div>
              )}
            </div>
          )}

          {/* Preview Area */}
          {menuPreviewData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MenuPreview
                data={menuPreviewData}
                zoom={zoom}
                setZoom={setZoom}
                elementId="menu-print-area"
                selectedTemplate={selectedPreviewTemplate}
                onTemplateChange={handleTemplateChange}
                defaultEditMode={true}
                onEditPatientInfo={() => toolbarRef.current?.openPatientInfo()}
                onEditPortions={() => toolbarRef.current?.openPortions()}
                onEditDay={(day) => toolbarRef.current?.openDay(day)}
                onEditTemplateNote={() => toolbarRef.current?.openTemplateNote()}
                onEditHydration={() => toolbarRef.current?.openHydration()}
                onEditRecSection={(section) => toolbarRef.current?.openRecSection(section)}
                onEditDomingoLibre={() => toolbarRef.current?.openDomingoLibre()}
                onEditDomingoCompleto={() => toolbarRef.current?.openDomingoCompleto()}
              />

              {/* Editor Toolbar */}
              <MenuEditorToolbar
                ref={toolbarRef}
                menuPreviewData={menuPreviewData}
                setMenuPreviewData={setMenuPreviewData}
                patient={patient}
                vetData={vetData}
                portions={portions}
                evaluationId={evaluationId}
              />
            </div>
          )}

          {/* Modals */}
          {showCopyRefModal && <CopyRefModal />}
          {showAiOptionsModal && <AiOptionsModal />}
        </div>
      )}
    </section>
  );
};
