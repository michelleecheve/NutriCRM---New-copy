import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Eye, EyeOff, Layout, Download, Printer,
  ChevronDown, ChevronUp, Edit3, Save, X, 
  Plus, Trash2, MoveUp, MoveDown, Droplets,
  Table as TableIcon, Calendar, FileText, Copy, Check,
  Lock, Unlock
} from 'lucide-react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord } from '../../types';
import { MenuPlanData, MenuDay, DayMeal, DomingoData, MealPortions } from '../menus_components/MenuDesignTemplates';
import { MenuReferenceParsertoMenuData } from '../menus_components/Menu_References_Components/MenuReferenceParsertoMenuData';
import { MenuReferencesStorage } from '../menus_components/Menu_References_Components/MenuReferencesStorage';
import { MenuExportPDF } from '../menus_components/MenuExportPDF';
import { MenuPreview } from '../menus_components/MenuPreview';
import { generateStructuredMenu } from '../../services/geminiService';
import { store } from '../../services/store';

interface MenuAddReadSec3Props {
  patient: Patient;
  vetData: VetCalculation;
  macros: MacrosRecord;
  portions: PortionsRecord;
  selectedTemplateId: string;
  selectedReferenceIds: string[];
  aiDraftText: string;
  setAiDraftText: (text: string) => void;
  aiRationale: string;
  setAiRationale: (text: string) => void;
  menuPreviewData: MenuPlanData | null;
  setMenuPreviewData: (data: MenuPlanData | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
}

// ─── Helper: build a blank MenuPlanData ───────────────────────────────────────
function buildBlankMenuPlanData(patient: Patient, vetData: VetCalculation): MenuPlanData {
  const profile = store.getUserProfile();
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

  const lastMeas = patient.measurements && patient.measurements.length > 0 
    ? [...patient.measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  return {
    patient: {
      name: `${patient.firstName} ${patient.lastName}`,
      age: patient.clinical?.age || 0,
      weight: lastMeas?.weight || 0,
      height: lastMeas?.height || 0,
      fatPct: lastMeas?.bodyFat || 0,
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
    },
    nutritionist: {
      name: profile.name,
      title: profile.specialty,
      licenseNumber: profile.licenseNumber || '',
      whatsapp: profile.phone,
      email: profile.contactEmail || profile.email,
      instagram: profile.instagramHandle ? `@${profile.instagramHandle}` : '',
      website: profile.website || '',
      avatar: profile.avatar,
    },
  };
}

export const MenuAddReadSec3: React.FC<MenuAddReadSec3Props> = ({
  patient,
  vetData,
  macros,
  portions,
  selectedTemplateId,
  selectedReferenceIds,
  aiDraftText,
  setAiDraftText,
  aiRationale,
  setAiRationale,
  menuPreviewData,
  setMenuPreviewData,
  zoom,
  setZoom
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
  try { return localStorage.getItem('nutriflow_menu_locked') === 'true'; }
  catch { return false; }
  });
  const [showRationale, setShowRationale] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // ─── Copy from Reference modal state ──────────────────────────────────────
  const [showCopyRefModal, setShowCopyRefModal] = useState(false);
  const [selectedCopyRefId, setSelectedCopyRefId] = useState<string | null>(null);

  // Editor States
  const [editingPortions, setEditingPortions] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingHydration, setEditingHydration] = useState(false);

  // ─── References available for copying ─────────────────────────────────────
  const availableRefs = MenuReferencesStorage.list().filter(r =>
    selectedReferenceIds.includes(r.id)
  );

  // ─── Iniciar Menú en Blanco ────────────────────────────────────────────────
  const handleStartBlank = () => {
    const blank = buildBlankMenuPlanData(patient, vetData);
    setMenuPreviewData(blank);
    setAiRationale('');
    setAiDraftText('');
  };

  // ─── Open Copy from Reference modal ───────────────────────────────────────
  const handleOpenCopyRef = () => {
    if (availableRefs.length === 0) return;
    // Pre-select the first available ref
    setSelectedCopyRefId(availableRefs[0].id);
    setShowCopyRefModal(true);
  };

  // ─── Confirm Copy from Reference ──────────────────────────────────────────
  const handleConfirmCopyRef = () => {
    if (!selectedCopyRefId) return;
    const ref = MenuReferencesStorage.getById(selectedCopyRefId);
    if (!ref) return;

    // Parse reference into MenuPlanData
    const plan = MenuReferenceParsertoMenuData(ref.data);

    // Override patient info with the actual patient
    const lastMeas = patient.measurements && patient.measurements.length > 0 
      ? [...patient.measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    const withPatient: MenuPlanData = {
      ...plan,
      patient: {
        name: `${patient.firstName} ${patient.lastName}`,
        age: patient.clinical?.age || 0,
        weight: lastMeas?.weight || 0,
        height: lastMeas?.height || 0,
        fatPct: lastMeas?.bodyFat || 0,
      },
      kcal: vetData.kcalToWork || plan.kcal,
    };

    setMenuPreviewData(withPatient);
    setAiRationale('');
    setAiDraftText('');
    setShowCopyRefModal(false);
    setSelectedCopyRefId(null);
  };

  // ─── AI Generation (untouched) ─────────────────────────────────────────────
  const handleGenerateAi = async () => {
    setIsGenerating(true);
    try {
      const refs = MenuReferencesStorage.list()
        .filter(r => selectedReferenceIds.includes(r.id))
        .map(r => ({ title: `${r.data.kcal} kcal`, data: r.data }));
      const nutritionistProfile = store.getUserProfile();
      
      const nutritionistData = {
        name: nutritionistProfile.name,
        title: nutritionistProfile.specialty,
        licenseNumber: nutritionistProfile.licenseNumber || '',
        whatsapp: nutritionistProfile.phone,
        email: nutritionistProfile.contactEmail || nutritionistProfile.email,
        instagram: nutritionistProfile.instagramHandle ? `@${nutritionistProfile.instagramHandle}` : '',
        website: nutritionistProfile.website || '',
        avatar: nutritionistProfile.avatar,
      };

      const result = await generateStructuredMenu(
        patient,
        vetData,
        portions,
        refs,
        nutritionistData
      );

      setMenuPreviewData(result.plan);
      setAiRationale(result.rationale);
      setAiDraftText("Menú generado por IA (Estructura JSON)");
      
    } catch (error) {
      console.error("Error generating menu:", error);
      alert("Hubo un error al generar el menú con IA. Por favor intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
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
      const updatedPortions = {
        ...localPortions,
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
                          type="number" 
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
    const [localDay, setLocalDay] = useState(menuPreviewData.weeklyMenu[dayKey as keyof typeof menuPreviewData.weeklyMenu]);
    
    const [meals, setMeals] = useState<{id: string, label: string, title: string}[]>(() => {
      if (isDomingo) return [];
      const day = localDay as MenuDay;
      const order = day.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
      return order.map(id => {
        const m = (day as any)[id] as DayMeal;
        return {
          id,
          label: m?.label || (id.includes('ref') ? 'Refacción' : id.charAt(0).toUpperCase() + id.slice(1)),
          title: m?.title || ""
        };
      });
    });

    const handleSave = () => {
      if (isDomingo) {
        const newWeekly = { ...menuPreviewData.weeklyMenu, [dayKey]: localDay };
        setMenuPreviewData({ ...menuPreviewData, weeklyMenu: newWeekly as any });
      } else {
        const newDay: any = { mealsOrder: meals.map(m => m.id) };
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
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 capitalize">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Editar {dayKey}
            </h3>
            <button onClick={() => setEditingDay(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {isDomingo ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nota / Día Libre</label>
                  <textarea 
                    value={(localDay as DomingoData).note}
                    onChange={(e) => setLocalDay({ ...localDay, note: e.target.value } as any)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tiempos de Comida</label>
                  <button 
                    onClick={addMeal}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Tiempo
                  </button>
                </div>
                
                <div className="space-y-4">
                  {meals.map((meal, index) => (
                    <div key={meal.id} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center justify-between gap-3">
                        <input 
                          type="text"
                          value={meal.label}
                          onChange={(e) => {
                            const newMeals = [...meals];
                            newMeals[index].label = e.target.value;
                            setMeals(newMeals);
                          }}
                          className="bg-transparent border-none text-xs font-bold text-indigo-600 uppercase focus:ring-0 p-0 w-full"
                          placeholder="Título del tiempo..."
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveMeal(index, 'up')} disabled={index === 0} className="p-1 hover:bg-white rounded-lg text-slate-400 disabled:opacity-30">
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveMeal(index, 'down')} disabled={index === meals.length - 1} className="p-1 hover:bg-white rounded-lg text-slate-400 disabled:opacity-30">
                            <MoveDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeMeal(meal.id)} className="p-1 hover:bg-white rounded-lg text-red-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea 
                        value={meal.title}
                        onChange={(e) => {
                          const newMeals = [...meals];
                          newMeals[index].title = e.target.value;
                          setMeals(newMeals);
                        }}
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                        placeholder={`Contenido para ${meal.label}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button onClick={() => setEditingDay(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Día
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Hydration Editor ──────────────────────────────────────────────────────
  const HydrationEditor = () => {
    if (!menuPreviewData) return null;
    const [localHydration, setLocalHydration] = useState(menuPreviewData.weeklyMenu.domingo.hydration);

    const handleSave = () => {
      const newWeekly = { 
        ...menuPreviewData.weeklyMenu, 
        domingo: { ...menuPreviewData.weeklyMenu.domingo, hydration: localHydration } 
      };
      setMenuPreviewData({ ...menuPreviewData, weeklyMenu: newWeekly });
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

        <div className="p-6 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase ml-1">
            Selecciona qué referencia copiar
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
                    onClick={() => setSelectedCopyRefId(ref.id)}
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

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
          <button
            onClick={() => setShowCopyRefModal(false)}
            className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCopyRef}
            disabled={!selectedCopyRefId || availableRefs.length === 0}
            className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copiar Referencia
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Generación y Preview</h2>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
          >
            {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {/* Lock toggle — siempre visible en el header */}
        <button
          onClick={() => {
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
              Copiar Menú de Ref.
            </button>

            {/* EXISTING: Generar menú con AI — untouched logic */}
            <button 
              onClick={handleGenerateAi}
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
              <div className="flex flex-wrap gap-2">
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
                  onClick={() => setEditingHydration(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Hidratación
                </button>
              </div>
            </div>
          )}

          {/* Modals */}
          {editingPortions && <PortionsEditor />}
          {editingDay && <DayEditor dayKey={editingDay} />}
          {editingHydration && <HydrationEditor />}
          {showCopyRefModal && <CopyRefModal />}
        </div>
      )}
    </section>
  );
};