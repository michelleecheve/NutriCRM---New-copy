import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Eye, EyeOff, Layout, Download, Printer,
  ChevronDown, ChevronUp, Edit3, Save, X, 
  Plus, Trash2, MoveUp, MoveDown, Droplets, User,
  Table as TableIcon, Calendar, FileText, Copy, Check,
  Lock, Unlock
} from 'lucide-react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, MenuTemplateDesign } from '../../types';
import { MenuPlanData, MenuDay, DayMeal, DomingoData, MealPortions } from '../menus_components/MenuDesignTemplates';
import { MenuReferenceParsertoMenuData } from '../menus_components/Menu_References_Components/MenuReferenceParsertoMenuData';
import { MenuExportPDF } from '../menus_components/MenuExportPDF';
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
  evaluationId,
  onSave
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
  try { return localStorage.getItem('nutriflow_menu_locked') === 'true'; }
  catch { return false; }
  });
  const [showRationale, setShowRationale] = useState(true);
  const [showAiOptionsModal, setShowAiOptionsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingPatientInfo, setIsEditingPatientInfo] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // ─── Helper: Get current nutritionist data with logo ──────────────────────
  const getNutritionistData = () => {
    const profile = store.getUserProfile();
    const template = store.getMenuTemplate();
    const logoUrl = template?.headerMode === 'logo' ? template.logoUrl : undefined;

    return {
      name: profile.name,
      title: profile.specialty,
      licenseNumber: profile.licenseNumber || '',
      whatsapp: profile.phone,
      personalPhone: profile.personalPhone || '',
      email: profile.contactEmail || profile.email,
      instagram: profile.instagramHandle ? `@${profile.instagramHandle}` : '',
      website: profile.website || '',
      avatar: profile.avatar,
      logoUrl,
    };
  };

  // ─── Copy from Reference modal state ──────────────────────────────────────
  const [showCopyRefModal, setShowCopyRefModal] = useState(false);
  const [selectedCopyRefId, setSelectedCopyRefId] = useState<string | null>(null);
  const [selectedCopyRecId, setSelectedCopyRecId] = useState<string | null>(null);

  // Editor States
  const [editingPortions, setEditingPortions] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingHydration, setEditingHydration] = useState(false);
  const [editingTemplateNote, setEditingTemplateNote] = useState(false);
  const [editingRecSection, setEditingRecSection] = useState<'preparacion' | 'restricciones' | 'habitos' | 'organizacion' | null>(null);
  
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
    setMenuPreviewData(blank);
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

    setMenuPreviewData(withPatient);
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
        setMenuPreviewData({
          ...finalPlan,
          recommendations: currentRecs || finalPlan.recommendations
        });
      } else if (scope === 'page2') {
        // Keep existing menu if any, but update patient info and recommendations
        if (menuPreviewData) {
          setMenuPreviewData({
            ...menuPreviewData,
            patient: finalPlan.patient,
            kcal: finalPlan.kcal,
            recommendations: finalPlan.recommendations
          });
        } else {
          setMenuPreviewData(finalPlan);
        }
      } else {
        setMenuPreviewData(finalPlan);
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

  // ─── Patient Info Editor ────────────────────────────────────────────────────
  const PatientInfoEditor = () => {
    if (!menuPreviewData) return null;

    const [localInfo, setLocalInfo] = useState({
      name: menuPreviewData.patient.name || '',
      age: menuPreviewData.patient.age ?? 0,
      weight: menuPreviewData.patient.weight ?? 0,
      fatPct: menuPreviewData.patient.fatPct ?? 0,
      kcal: menuPreviewData.kcal ?? 0
    });

    // Auto-fill logic
    useEffect(() => {
      const fullName = `${patient.firstName} ${patient.lastName}`;
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

      setLocalInfo({
        name: fullName || '',
        age: vetData.age ?? 0,
        weight: vetData.weight ?? 0,
        fatPct: fat ?? 0,
        kcal: vetData.kcalToWork ?? 0
      });
    }, []);

    const handleSave = () => {
      setMenuPreviewData({
        ...menuPreviewData,
        patient: {
          ...menuPreviewData.patient,
          name: localInfo.name,
          age: localInfo.age,
          weight: localInfo.weight,
          fatPct: localInfo.fatPct
        },
        kcal: localInfo.kcal
      });
      setIsEditingPatientInfo(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Información del Paciente
              </h3>
              <p className="text-xs text-slate-500 font-medium">Datos que aparecerán en el menú impreso</p>
            </div>
            <button onClick={() => setIsEditingPatientInfo(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
              <input 
                type="text"
                value={localInfo.name}
                onChange={e => setLocalInfo({...localInfo, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Edad</label>
                <input 
                  type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={localInfo.age}
                  onChange={e => setLocalInfo({...localInfo, age: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Peso (kg)</label>
                <input 
                  type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  step="0.1"
                  value={localInfo.weight}
                  onChange={e => setLocalInfo({...localInfo, weight: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">% Grasa</label>
                <input 
                  type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  step="0.1"
                  value={localInfo.fatPct}
                  onChange={e => setLocalInfo({...localInfo, fatPct: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Meta (kcal)</label>
                <input 
                  type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={localInfo.kcal}
                  onChange={e => setLocalInfo({...localInfo, kcal: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
              onClick={() => setIsEditingPatientInfo(false)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Actualizar Datos
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Portions Editor ────────────────────────────────────────────────────────
  const PortionsEditor = () => {
    if (!menuPreviewData) return null;
    
    const [localPortions, setLocalPortions] = useState(menuPreviewData.portions);
    const [meals, setMeals] = useState<{id: string, label: string}[]>(() => {
      const order = menuPreviewData.weeklyMenu.lunes.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
      return order.map(id => {
        const m = (menuPreviewData.weeklyMenu.lunes as any)[id] as DayMeal;
        let label = m?.label;
        if (!label) {
          if (id === 'desayuno') label = 'Desayuno';
          else if (id === 'refaccion1') label = 'Refacción 1';
          else if (id === 'almuerzo') label = 'Almuerzo';
          else if (id === 'refaccion2') label = 'Refacción 2';
          else if (id === 'cena') label = 'Cena';
          else label = id;
        }
        return { id, label };
      });
    });

    const calculateTotal = (key: keyof MealPortions) => {
      return meals.reduce((sum, meal) => {
        const val = localPortions.byMeal[meal.id]?.[key] || 0;
        return sum + Number(val);
      }, 0);
    };

    const handleSave = () => {
      // Persist label into byMeal so it survives AI regeneration
      const byMealWithLabels = { ...localPortions.byMeal };
      meals.forEach(m => {
        byMealWithLabels[m.id] = { ...byMealWithLabels[m.id], label: m.label };
      });

      const updatedPortions = {
        ...localPortions,
        byMeal: byMealWithLabels,
        lacteos: calculateTotal('lacteos'),
        vegetales: calculateTotal('vegetales'),
        frutas: calculateTotal('frutas'),
        cereales: calculateTotal('cereales'),
        carnes: calculateTotal('carnes'),
        grasas: calculateTotal('grasas'),
      };

      const newWeeklyMenu = { ...menuPreviewData.weeklyMenu };
      const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
      
      days.forEach(dayKey => {
        const day = { ...newWeeklyMenu[dayKey] } as any;
        day.mealsOrder = meals.map(m => m.id);
        meals.forEach(m => {
          if (!day[m.id]) {
            day[m.id] = { title: "", label: m.label };
          } else {
            day[m.id] = { ...day[m.id], label: m.label };
          }
        });
        newWeeklyMenu[dayKey] = day;
      });

      setMenuPreviewData({ 
        ...menuPreviewData, 
        portions: updatedPortions,
        weeklyMenu: newWeeklyMenu
      });
      setEditingPortions(false);
    };

    const addMeal = () => {
      const id = `meal_${Date.now()}`;
      setMeals([...meals, { id, label: "Nuevo Tiempo" }]);
      setLocalPortions({
        ...localPortions,
        byMeal: {
          ...localPortions.byMeal,
          [id]: { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 }
        }
      });
    };

    const removeMeal = (id: string) => {
      setMeals(meals.filter(m => m.id !== id));
      const newByMeal = { ...localPortions.byMeal };
      delete newByMeal[id];
      setLocalPortions({ ...localPortions, byMeal: newByMeal });
    };

    const moveMeal = (index: number, direction: 'up' | 'down') => {
      const newMeals = [...meals];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newMeals.length) return;
      [newMeals[index], newMeals[targetIndex]] = [newMeals[targetIndex], newMeals[index]];
      setMeals(newMeals);
    };

    const updateMealPortion = (mealId: string, group: keyof MealPortions, val: number) => {
      setLocalPortions({
        ...localPortions,
        byMeal: {
          ...localPortions.byMeal,
          [mealId]: {
            ...localPortions.byMeal[mealId],
            [group]: val
          }
        }
      });
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-indigo-600" />
                Editar Tabla de Porciones
              </h3>
              <p className="text-xs text-slate-500 font-medium">Distribución de equivalentes por tiempo de comida</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={addMeal}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-slate-50 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Tiempo
              </button>
              <button onClick={() => setEditingPortions(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 text-left font-bold text-slate-500 border-b min-w-[180px]">Tiempo</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b">🥛 Lac</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b">🥦 Veg</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b">🍎 Fru</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b">🌾 Cer</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b">🥩 Car</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b">🫒 Gra</th>
                  <th className="p-3 text-center font-bold text-slate-500 border-b w-20">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {meals.map((meal, index) => (
                  <tr key={meal.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveMeal(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-white rounded text-slate-400 disabled:opacity-20">
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveMeal(index, 'down')} disabled={index === meals.length - 1} className="p-0.5 hover:bg-white rounded text-slate-400 disabled:opacity-20">
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>
                        <input 
                          type="text"
                          value={meal.label}
                          onChange={(e) => {
                            const newMeals = [...meals];
                            newMeals[index].label = e.target.value;
                            setMeals(newMeals);
                          }}
                          className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 p-0"
                        />
                      </div>
                    </td>
                    {(['lacteos', 'vegetales', 'frutas', 'cereales', 'carnes', 'grasas'] as Array<keyof MealPortions>).map(group => (
                      <td key={group} className="p-2 border-b">
                        <input 
                          type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                          step="0.5"
                          min="0"
                          value={localPortions.byMeal[meal.id]?.[group] || 0}
                          onChange={(e) => updateMealPortion(meal.id, group, parseFloat(e.target.value) || 0)}
                          className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => removeMeal(meal.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-indigo-50/50 font-bold">
                  <td className="p-4 text-xs text-indigo-700 uppercase tracking-wider">Totales</td>
                  {(['lacteos', 'vegetales', 'frutas', 'cereales', 'carnes', 'grasas'] as Array<keyof MealPortions>).map(group => (
                    <td key={group} className="p-4 text-center text-sm text-indigo-700 font-black">
                      {calculateTotal(group)}
                    </td>
                  ))}
                  <td></td>
                </tr>
                <tr className="bg-slate-50/60">
                  <td className="p-3 text-xs text-slate-400 uppercase tracking-wider font-semibold leading-tight">
                    Ref. Dist.<br/>Nutrientes
                  </td>
                  <td className="p-3 text-center text-sm text-slate-400 font-bold">{(portions.lec || 0) + (portions.lecDesc || 0)}</td>
                  <td className="p-3 text-center text-sm text-slate-400 font-bold">{portions.veg || 0}</td>
                  <td className="p-3 text-center text-sm text-slate-400 font-bold">{portions.fru || 0}</td>
                  <td className="p-3 text-center text-sm text-slate-400 font-bold">{portions.cer || 0}</td>
                  <td className="p-3 text-center text-sm text-slate-400 font-bold">{(portions.carMagra || 0) + (portions.carSemi || 0) + (portions.carAlta || 0)}</td>
                  <td className="p-3 text-center text-sm text-slate-400 font-bold">{portions.gra || 0}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button onClick={() => setEditingPortions(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Day Editor ────────────────────────────────────────────────────────────
  const DayEditor = ({ dayKey }: { dayKey: string }) => {
    if (!menuPreviewData) return null;
    
    const isDomingo = dayKey === 'domingo';
    
    // States for Domingo
    const [domingoNote, setDomingoNote] = useState(menuPreviewData.weeklyMenu.domingo.note || '');
    const [showDomingoLibre, setShowDomingoLibre] = useState(false);
    const [showDomingoCompleto, setShowDomingoCompleto] = useState(false);

    // Common states
    const [localDay, setLocalDay] = useState(menuPreviewData.weeklyMenu[dayKey as keyof typeof menuPreviewData.weeklyMenu]);
    
    const [meals, setMeals] = useState<{id: string, label: string, title: string}[]>(() => {
      // If it's domingo, we load meals from domingoV2
      const targetDayKey = isDomingo ? 'domingoV2' : dayKey;
      const day = menuPreviewData.weeklyMenu[targetDayKey as keyof typeof menuPreviewData.weeklyMenu] as MenuDay;
      
      const order = day?.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
      return order.map(id => {
        const m = (day as any)?.[id] as DayMeal;
        return {
          id,
          label: m?.label || (id.includes('ref') ? 'Refacción' : id.charAt(0).toUpperCase() + id.slice(1)),
          title: m?.title || ""
        };
      });
    });

    const handleSave = () => {
      if (isDomingo) {
        // Save both domingo (note) and domingoV2 (meals)
        const updatedDomingo = { ...menuPreviewData.weeklyMenu.domingo, note: domingoNote };
        
        const updatedDomingoV2: any = { 
          ...menuPreviewData.weeklyMenu.domingoV2,
          mealsOrder: meals.map(m => m.id) 
        };
        meals.forEach(m => {
          updatedDomingoV2[m.id] = { label: m.label, title: m.title };
        });

        const newWeekly = { 
          ...menuPreviewData.weeklyMenu, 
          domingo: updatedDomingo,
          domingoV2: updatedDomingoV2
        };

        // Ensure portions are updated for new meals if any
        const newByMeal = { ...menuPreviewData.portions.byMeal };
        meals.forEach(m => {
          if (!newByMeal[m.id]) {
            newByMeal[m.id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 };
          }
        });

        setMenuPreviewData({ 
          ...menuPreviewData, 
          weeklyMenu: newWeekly as any,
          portions: { ...menuPreviewData.portions, byMeal: newByMeal }
        });
      } else {
        const newDay: any = { 
          ...localDay,
          mealsOrder: meals.map(m => m.id) 
        };
        meals.forEach(m => {
          newDay[m.id] = { label: m.label, title: m.title };
        });
        
        const newByMeal = { ...menuPreviewData.portions.byMeal };
        meals.forEach(m => {
          if (!newByMeal[m.id]) {
            newByMeal[m.id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 };
          }
        });

        const newWeekly = { ...menuPreviewData.weeklyMenu, [dayKey]: newDay };
        setMenuPreviewData({ 
          ...menuPreviewData, 
          weeklyMenu: newWeekly as any,
          portions: { ...menuPreviewData.portions, byMeal: newByMeal }
        });
      }
      setEditingDay(null);
    };

    const addMeal = () => {
      const id = `meal_${Date.now()}`;
      setMeals([...meals, { id, label: "Nuevo Tiempo", title: "" }]);
    };

    const removeMeal = (id: string) => {
      setMeals(meals.filter(m => m.id !== id));
    };

    const moveMeal = (index: number, direction: 'up' | 'down') => {
      const newMeals = [...meals];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newMeals.length) return;
      [newMeals[index], newMeals[targetIndex]] = [newMeals[targetIndex], newMeals[index]];
      setMeals(newMeals);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 my-8">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Editar {isDomingo ? 'Domingo' : dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}
            </h3>
            <button onClick={() => setEditingDay(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {isDomingo ? (
              <>
                {/* Domingo - Día Libre */}
                <div className="space-y-4 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">Domingo - Día Libre</h4>
                    <button 
                      onClick={() => setShowDomingoLibre(!showDomingoLibre)}
                      className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                    >
                      {showDomingoLibre ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {showDomingoLibre && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nota del Día Libre</label>
                      <textarea 
                        value={domingoNote}
                        onChange={(e) => setDomingoNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[100px]"
                        placeholder="Ej: Domingo de descanso, disfruta con moderación..."
                      />
                    </div>
                  )}
                </div>

                {/* Domingo - Menú completo */}
                <div className="space-y-4 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">Domingo - Menú completo</h4>
                    <button 
                      onClick={() => setShowDomingoCompleto(!showDomingoCompleto)}
                      className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                    >
                      {showDomingoCompleto ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {showDomingoCompleto && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium italic">Configura los tiempos de comida para el domingo completo.</p>
                        <button onClick={addMeal} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                          <Plus className="w-3.5 h-3.5" />
                          Agregar Tiempo
                        </button>
                      </div>
                      <div className="space-y-4">
                        {meals.map((meal, idx) => (
                          <div key={meal.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <button onClick={() => moveMeal(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white rounded-md disabled:opacity-30">
                                  <MoveUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => moveMeal(idx, 'down')} disabled={idx === meals.length - 1} className="p-1 hover:bg-white rounded-md disabled:opacity-30">
                                  <MoveDown className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex-1 space-y-3">
                                <input 
                                  value={meal.label}
                                  onChange={(e) => {
                                    const newMeals = [...meals];
                                    newMeals[idx].label = e.target.value;
                                    setMeals(newMeals);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  placeholder="Etiqueta (Ej: Desayuno)"
                                />
                                <textarea 
                                  value={meal.title}
                                  onChange={(e) => {
                                    const newMeals = [...meals];
                                    newMeals[idx].title = e.target.value;
                                    setMeals(newMeals);
                                  }}
                                  rows={3}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                  placeholder="Contenido del menú..."
                                />
                              </div>
                              <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium italic">Personaliza los tiempos de comida y sus títulos.</p>
                  <button onClick={addMeal} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Tiempo
                  </button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {meals.map((meal, idx) => (
                    <div key={meal.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveMeal(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white rounded-md disabled:opacity-30">
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveMeal(idx, 'down')} disabled={idx === meals.length - 1} className="p-1 hover:bg-white rounded-md disabled:opacity-30">
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-3">
                          <input 
                            value={meal.label}
                            onChange={(e) => {
                              const newMeals = [...meals];
                              newMeals[idx].label = e.target.value;
                              setMeals(newMeals);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Etiqueta (Ej: Desayuno)"
                          />
                          <textarea 
                            value={meal.title}
                            onChange={(e) => {
                              const newMeals = [...meals];
                              newMeals[idx].title = e.target.value;
                              setMeals(newMeals);
                            }}
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                            placeholder="Contenido del menú..."
                          />
                        </div>
                        <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
            <button onClick={() => setEditingDay(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── References available for copying ─────────────────────────────────────

  // ─── Hydration Editor ──────────────────────────────────────────────────────
  const HydrationEditor = () => {
    if (!menuPreviewData) return null;
    const [localHydration, setLocalHydration] = useState(menuPreviewData.weeklyMenu.domingo.hydration);

    const handleSave = () => {
      const newWeekly = { 
        ...menuPreviewData.weeklyMenu, 
        domingo: { ...menuPreviewData.weeklyMenu.domingo, hydration: localHydration },
        domingoV2: menuPreviewData.weeklyMenu.domingoV2 
          ? { ...menuPreviewData.weeklyMenu.domingoV2, hydration: localHydration }
          : undefined
      };
      setMenuPreviewData({ ...menuPreviewData, weeklyMenu: newWeekly as any });
      setEditingHydration(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-indigo-600" />
              Editar Hidratación
            </h3>
            <button onClick={() => setEditingHydration(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Meta de Hidratación</label>
              <input 
                type="text"
                value={localHydration}
                onChange={(e) => setLocalHydration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="Ej: 2.5 Litros de agua al día"
              />
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
            <button onClick={() => setEditingHydration(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Template Note Editor ──────────────────────────────────────────────────
  const TemplateNoteEditor = () => {
    if (!menuPreviewData) return null;
    
    // We target the note in domingoV2 if it exists, otherwise domingo
    const [localNote, setLocalNote] = useState(
      menuPreviewData.weeklyMenu.domingoV2?.note || 
      menuPreviewData.weeklyMenu.domingo.note || 
      ''
    );

    const handleSave = () => {
      const newWeekly = { 
        ...menuPreviewData.weeklyMenu, 
        domingoV2: menuPreviewData.weeklyMenu.domingoV2 
          ? { ...menuPreviewData.weeklyMenu.domingoV2, note: localNote }
          : undefined,
        domingo: { ...menuPreviewData.weeklyMenu.domingo, note: localNote }
      };
      setMenuPreviewData({ ...menuPreviewData, weeklyMenu: newWeekly as any });
      setEditingTemplateNote(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Notas
              </h3>
              <span className="text-xs font-medium text-slate-500 ml-7">Editar Nota de Plantilla V2</span>
            </div>
            <button onClick={() => setEditingTemplateNote(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contenido de la Nota</label>
              <textarea 
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[150px]"
                placeholder="Escribe aquí las notas para la plantilla..."
              />
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
            <button onClick={() => setEditingTemplateNote(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Recommendations Editor ────────────────────────────────────────────────
  const RecommendationsEditor = ({ section }: { section: 'preparacion' | 'restricciones' | 'habitos' | 'organizacion' }) => {
    if (!menuPreviewData) return null;

    const titles = {
      preparacion: 'Preparación de Alimentos',
      restricciones: 'Restricciones Específicas',
      habitos: 'Hábitos Saludables',
      organizacion: 'Organización y Horarios'
    };

    const defaultRecs = {
      preparacion: [],
      restricciones: [],
      habitos: [],
      organizacion: []
    };

    const currentRecs = menuPreviewData.recommendations || defaultRecs;
    const [localItems, setLocalItems] = useState<string[]>(currentRecs[section] || []);

    const handleSave = () => {
      const updatedRecs = {
        ...currentRecs,
        [section]: localItems.filter(item => item.trim() !== '')
      };
      setMenuPreviewData({
        ...menuPreviewData,
        recommendations: updatedRecs
      });
      setEditingRecSection(null);
    };

    const addItem = () => setLocalItems([...localItems, '']);
    const removeItem = (index: number) => setLocalItems(localItems.filter((_, i) => i !== index));
    const updateItem = (index: number, value: string) => {
      const newItems = [...localItems];
      newItems[index] = value;
      setLocalItems(newItems);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              {titles[section]}
            </h3>
            <button onClick={() => setEditingRecSection(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium italic">Agrega o edita las notas para esta sección.</p>
              <button onClick={addItem} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                <Plus className="w-3.5 h-3.5" />
                Agregar Nota
              </button>
            </div>
            <div className="space-y-3">
              {localItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateItem(idx, e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[60px] resize-none"
                    placeholder="Escribe la nota aquí..."
                  />
                  <button 
                    onClick={() => removeItem(idx)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {localItems.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  No hay notas en esta sección.
                </div>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
            <button onClick={() => setEditingRecSection(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
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
                  setTimeout(() => setEditingPortions(true), 200);
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
              />

              {/* Editor Toolbar */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1">Editar Página 1 de Menú</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setIsEditingPatientInfo(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <User className="w-3.5 h-3.5" />
                      Info. Paciente
                    </button>
                    <button 
                      onClick={() => setEditingPortions(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      Tabla porciones
                    </button>
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(day => (
                      <button 
                        key={day}
                        onClick={() => setEditingDay(day)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm capitalize"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {day.slice(0, 3)}
                      </button>
                    ))}
                    <button 
                      onClick={() => setEditingTemplateNote(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Notas
                    </button>
                    <button 
                      onClick={() => setEditingHydration(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      Hidratación
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1">Editar Página 2 de Menú</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setEditingRecSection('preparacion')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Preparación de Alimentos
                    </button>
                    <button 
                      onClick={() => setEditingRecSection('restricciones')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Restricciones Específicas
                    </button>
                    <button 
                      onClick={() => setEditingRecSection('habitos')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Hábitos Saludables
                    </button>
                    <button 
                      onClick={() => setEditingRecSection('organizacion')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Organización y Horarios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          {editingPortions && <PortionsEditor />}
          {editingDay && <DayEditor dayKey={editingDay} />}
          {editingHydration && <HydrationEditor />}
          {isEditingPatientInfo && <PatientInfoEditor />}
          {editingTemplateNote && <TemplateNoteEditor />}
          {editingRecSection && <RecommendationsEditor section={editingRecSection} />}
          {showCopyRefModal && <CopyRefModal />}
          {showAiOptionsModal && <AiOptionsModal />}
        </div>
      )}
    </section>
  );
};