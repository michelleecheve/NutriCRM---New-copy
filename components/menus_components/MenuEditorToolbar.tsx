import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Eye, EyeOff, User, Table as TableIcon, Calendar, FileText,
  Droplets, Edit3, MoveUp, MoveDown, Plus, Trash2, Save, X
} from 'lucide-react';
import { Patient, VetCalculation, PortionsRecord } from '../../types';
import { MenuPlanData, MenuDay, DayMeal, MealPortions } from './MenuDesignTemplates';

type RecSection = 'preparacion' | 'restricciones' | 'habitos' | 'organizacion';

// ─── Handle expuesto vía ref ──────────────────────────────────────────────────
export interface MenuEditorToolbarHandle {
  openPatientInfo: () => void;
  openPortions: () => void;
  openDay: (day: string) => void;
  openTemplateNote: () => void;
  openHydration: () => void;
  openRecSection: (section: RecSection) => void;
  openDomingoLibre: () => void;
  openDomingoCompleto: () => void;
}

interface MenuEditorToolbarProps {
  menuPreviewData: MenuPlanData | null;
  setMenuPreviewData: (data: MenuPlanData | null) => void;
  patient: Patient;
  vetData: VetCalculation;
  portions: PortionsRecord;
  evaluationId: string | null;
}

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
const btnClass =
  'flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm';

export const MenuEditorToolbar = forwardRef<MenuEditorToolbarHandle, MenuEditorToolbarProps>(
  ({ menuPreviewData, setMenuPreviewData, patient, vetData, portions, evaluationId }, ref) => {

    // ─── Modal states ─────────────────────────────────────────────────────────
    const [isEditingPatientInfo, setIsEditingPatientInfo] = useState(false);
    const [editingPortions, setEditingPortions] = useState(false);
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editingHydration, setEditingHydration] = useState(false);
    const [editingTemplateNote, setEditingTemplateNote] = useState(false);
    const [editingRecSection, setEditingRecSection] = useState<RecSection | null>(null);
    const [editingDomingoLibre, setEditingDomingoLibre] = useState(false);
    const [editingDomingoCompleto, setEditingDomingoCompleto] = useState(false);

    // ─── Expose open methods via ref ──────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      openPatientInfo:    () => setIsEditingPatientInfo(true),
      openPortions:       () => setEditingPortions(true),
      openDay:            (day) => setEditingDay(day),
      openTemplateNote:   () => setEditingTemplateNote(true),
      openHydration:      () => setEditingHydration(true),
      openRecSection:     (section) => setEditingRecSection(section),
      openDomingoLibre:   () => setEditingDomingoLibre(true),
      openDomingoCompleto:() => setEditingDomingoCompleto(true),
    }));

    // ─── Patient Info Editor ──────────────────────────────────────────────────
    const PatientInfoEditor = () => {
      if (!menuPreviewData) return null;

      const [localInfo, setLocalInfo] = useState({
        name:   menuPreviewData.patient.name   || '',
        age:    menuPreviewData.patient.age    ?? 0,
        weight: menuPreviewData.patient.weight ?? 0,
        fatPct: menuPreviewData.patient.fatPct ?? 0,
        kcal:   menuPreviewData.kcal           ?? 0,
      });

      useEffect(() => {
        const fullName = `${patient.firstName} ${patient.lastName}`;
        let fat = 0;
        if (evaluationId) {
          const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
          if (bio) fat = bio.body_fat_pct;
          else {
            const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
            if (meas) fat = meas.bodyFat || 0;
          }
        }
        setLocalInfo({
          name:   fullName || '',
          age:    vetData.age        ?? 0,
          weight: vetData.weight     ?? 0,
          fatPct: fat                ?? 0,
          kcal:   vetData.kcalToWork ?? 0,
        });
      }, []);

      const handleSave = () => {
        setMenuPreviewData({
          ...menuPreviewData,
          patient: { ...menuPreviewData.patient, name: localInfo.name, age: localInfo.age, weight: localInfo.weight, fatPct: localInfo.fatPct },
          kcal: localInfo.kcal,
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
                <input type="text" value={localInfo.name} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Edad</label>
                  <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} value={localInfo.age}
                    onChange={e => setLocalInfo({ ...localInfo, age: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Peso (kg)</label>
                  <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} step="0.1" value={localInfo.weight}
                    onChange={e => setLocalInfo({ ...localInfo, weight: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">% Grasa</label>
                  <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} step="0.1" value={localInfo.fatPct}
                    onChange={e => setLocalInfo({ ...localInfo, fatPct: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Meta (kcal)</label>
                  <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} value={localInfo.kcal}
                    onChange={e => setLocalInfo({ ...localInfo, kcal: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsEditingPatientInfo(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Actualizar Datos</button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Portions Editor ──────────────────────────────────────────────────────
    const PortionsEditor = () => {
      if (!menuPreviewData) return null;
      const [localPortions, setLocalPortions] = useState(menuPreviewData.portions);
      const [meals, setMeals] = useState<{ id: string; label: string }[]>(() => {
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

      const calculateTotal = (key: keyof MealPortions) =>
        meals.reduce((sum, meal) => sum + Number(localPortions.byMeal[meal.id]?.[key] || 0), 0);

      const addMeal = () => {
        const id = `meal_${Date.now()}`;
        setMeals([...meals, { id, label: 'Nuevo Tiempo' }]);
        setLocalPortions({ ...localPortions, byMeal: { ...localPortions.byMeal, [id]: { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 } } });
      };
      const removeMeal = (id: string) => {
        setMeals(meals.filter(m => m.id !== id));
        const newByMeal = { ...localPortions.byMeal };
        delete newByMeal[id];
        setLocalPortions({ ...localPortions, byMeal: newByMeal });
      };
      const moveMeal = (index: number, direction: 'up' | 'down') => {
        const next = [...meals];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setMeals(next);
      };
      const updateMealPortion = (mealId: string, group: keyof MealPortions, val: number) => {
        setLocalPortions({ ...localPortions, byMeal: { ...localPortions.byMeal, [mealId]: { ...localPortions.byMeal[mealId], [group]: val } } });
      };

      const handleSave = () => {
        const byMealWithLabels = { ...localPortions.byMeal };
        meals.forEach(m => { byMealWithLabels[m.id] = { ...byMealWithLabels[m.id], label: m.label }; });
        const updatedPortions = {
          ...localPortions, byMeal: byMealWithLabels,
          lacteos: calculateTotal('lacteos'), vegetales: calculateTotal('vegetales'), frutas: calculateTotal('frutas'),
          cereales: calculateTotal('cereales'), carnes: calculateTotal('carnes'), grasas: calculateTotal('grasas'),
        };
        const newWeeklyMenu = { ...menuPreviewData.weeklyMenu };
        (['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const).forEach(dayKey => {
          const day = { ...newWeeklyMenu[dayKey] } as any;
          day.mealsOrder = meals.map(m => m.id);
          meals.forEach(m => { day[m.id] = day[m.id] ? { ...day[m.id], label: m.label } : { title: '', label: m.label }; });
          newWeeklyMenu[dayKey] = day;
        });
        setMenuPreviewData({ ...menuPreviewData, portions: updatedPortions, weeklyMenu: newWeeklyMenu });
        setEditingPortions(false);
      };

      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TableIcon className="w-5 h-5 text-indigo-600" />Editar Tabla de Porciones</h3>
                <p className="text-xs text-slate-500 font-medium">Distribución de equivalentes por tiempo de comida</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={addMeal} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-slate-50 transition-all">
                  <Plus className="w-3.5 h-3.5" />Agregar Tiempo
                </button>
                <button onClick={() => setEditingPortions(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-3 text-left font-bold text-slate-500 border-b min-w-[180px]">Tiempo</th>
                    {['🥛 Lac','🥦 Veg','🍎 Fru','🌾 Cer','🥩 Car','🫒 Gra'].map(h => (
                      <th key={h} className="p-3 text-center font-bold text-slate-500 border-b">{h}</th>
                    ))}
                    <th className="p-3 text-center font-bold text-slate-500 border-b w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {meals.map((meal, index) => (
                    <tr key={meal.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveMeal(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-white rounded text-slate-400 disabled:opacity-20"><MoveUp className="w-3 h-3" /></button>
                            <button onClick={() => moveMeal(index, 'down')} disabled={index === meals.length - 1} className="p-0.5 hover:bg-white rounded text-slate-400 disabled:opacity-20"><MoveDown className="w-3 h-3" /></button>
                          </div>
                          <input type="text" value={meal.label} onChange={e => { const n = [...meals]; n[index].label = e.target.value; setMeals(n); }}
                            className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 p-0" />
                        </div>
                      </td>
                      {(['lacteos','vegetales','frutas','cereales','carnes','grasas'] as Array<keyof MealPortions>).map(group => (
                        <td key={group} className="p-2 border-b">
                          <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} step="0.5" min="0"
                            value={localPortions.byMeal[meal.id]?.[group] || 0}
                            onChange={e => updateMealPortion(meal.id, group, parseFloat(e.target.value) || 0)}
                            className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <button onClick={() => removeMeal(meal.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50/50 font-bold">
                    <td className="p-4 text-xs text-indigo-700 uppercase tracking-wider">Totales</td>
                    {(['lacteos','vegetales','frutas','cereales','carnes','grasas'] as Array<keyof MealPortions>).map(group => (
                      <td key={group} className="p-4 text-center text-sm text-indigo-700 font-black">{calculateTotal(group)}</td>
                    ))}
                    <td></td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="p-3 text-xs text-slate-400 uppercase tracking-wider font-semibold leading-tight">Ref. Dist.<br />Nutrientes</td>
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
              <button onClick={() => setEditingPortions(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Day Editor ───────────────────────────────────────────────────────────
    const DayEditor = ({ dayKey }: { dayKey: string }) => {
      if (!menuPreviewData) return null;
      const isDomingo = dayKey === 'domingo';
      const [domingoNote, setDomingoNote] = useState(menuPreviewData.weeklyMenu.domingo.note || '');
      const [showDomingoLibre, setShowDomingoLibre] = useState(false);
      const [showDomingoCompleto, setShowDomingoCompleto] = useState(false);
      const [localDay] = useState(menuPreviewData.weeklyMenu[dayKey as keyof typeof menuPreviewData.weeklyMenu]);
      const [meals, setMeals] = useState<{ id: string; label: string; title: string }[]>(() => {
        const targetKey = isDomingo ? 'domingoV2' : dayKey;
        const day = menuPreviewData.weeklyMenu[targetKey as keyof typeof menuPreviewData.weeklyMenu] as MenuDay;
        const order = day?.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
        return order.map(id => {
          const m = (day as any)?.[id] as DayMeal;
          return { id, label: m?.label || (id.includes('ref') ? 'Refacción' : id.charAt(0).toUpperCase() + id.slice(1)), title: m?.title || '' };
        });
      });

      const addMeal = () => setMeals([...meals, { id: `meal_${Date.now()}`, label: 'Nuevo Tiempo', title: '' }]);
      const removeMeal = (id: string) => setMeals(meals.filter(m => m.id !== id));
      const moveMeal = (index: number, direction: 'up' | 'down') => {
        const next = [...meals];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setMeals(next);
      };

      const handleSave = () => {
        if (isDomingo) {
          const updatedDomingo = { ...menuPreviewData.weeklyMenu.domingo, note: domingoNote };
          const updatedDomingoV2: any = { ...menuPreviewData.weeklyMenu.domingoV2, mealsOrder: meals.map(m => m.id) };
          meals.forEach(m => { updatedDomingoV2[m.id] = { label: m.label, title: m.title }; });
          const newByMeal = { ...menuPreviewData.portions.byMeal };
          meals.forEach(m => { if (!newByMeal[m.id]) newByMeal[m.id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 }; });
          setMenuPreviewData({ ...menuPreviewData, weeklyMenu: { ...menuPreviewData.weeklyMenu, domingo: updatedDomingo, domingoV2: updatedDomingoV2 } as any, portions: { ...menuPreviewData.portions, byMeal: newByMeal } });
        } else {
          const newDay: any = { ...localDay, mealsOrder: meals.map(m => m.id) };
          meals.forEach(m => { newDay[m.id] = { label: m.label, title: m.title }; });
          const newByMeal = { ...menuPreviewData.portions.byMeal };
          meals.forEach(m => { if (!newByMeal[m.id]) newByMeal[m.id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 }; });
          setMenuPreviewData({ ...menuPreviewData, weeklyMenu: { ...menuPreviewData.weeklyMenu, [dayKey]: newDay } as any, portions: { ...menuPreviewData.portions, byMeal: newByMeal } });
        }
        setEditingDay(null);
      };

      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Editar {isDomingo ? 'Domingo' : dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}
              </h3>
              <button onClick={() => setEditingDay(null)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-8">
              {isDomingo ? (
                <>
                  <div className="space-y-4 border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-700">Domingo - Día Libre</h4>
                      <button onClick={() => setShowDomingoLibre(!showDomingoLibre)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                        {showDomingoLibre ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {showDomingoLibre && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nota del Día Libre</label>
                        <textarea value={domingoNote} onChange={e => setDomingoNote(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[100px]"
                          placeholder="Ej: Domingo de descanso, disfruta con moderación..." />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-700">Domingo - Menú completo</h4>
                      <button onClick={() => setShowDomingoCompleto(!showDomingoCompleto)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                        {showDomingoCompleto ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {showDomingoCompleto && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 font-medium italic">Configura los tiempos de comida para el domingo completo.</p>
                          <button onClick={addMeal} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                            <Plus className="w-3.5 h-3.5" />Agregar Tiempo
                          </button>
                        </div>
                        <div className="space-y-4">
                          {meals.map((meal, idx) => (
                            <div key={meal.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => moveMeal(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white rounded-md disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveMeal(idx, 'down')} disabled={idx === meals.length - 1} className="p-1 hover:bg-white rounded-md disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 space-y-3">
                                  <input value={meal.label} onChange={e => { const n = [...meals]; n[idx] = { ...meals[idx], label: e.target.value }; setMeals(n); }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Etiqueta (Ej: Desayuno)" />
                                  <textarea value={meal.title} onChange={e => { const n = [...meals]; n[idx] = { ...meals[idx], title: e.target.value }; setMeals(n); }}
                                    rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Contenido del menú..." />
                                </div>
                                <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
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
                      <Plus className="w-3.5 h-3.5" />Agregar Tiempo
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {meals.map((meal, idx) => (
                      <div key={meal.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveMeal(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white rounded-md disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
                            <button onClick={() => moveMeal(idx, 'down')} disabled={idx === meals.length - 1} className="p-1 hover:bg-white rounded-md disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
                          </div>
                          <div className="flex-1 space-y-3">
                            <input value={meal.label} onChange={e => { const n = [...meals]; n[idx] = { ...meals[idx], label: e.target.value }; setMeals(n); }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Etiqueta (Ej: Desayuno)" />
                            <textarea value={meal.title} onChange={e => { const n = [...meals]; n[idx] = { ...meals[idx], title: e.target.value }; setMeals(n); }}
                              rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Contenido del menú..." />
                          </div>
                          <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setEditingDay(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Hydration Editor ─────────────────────────────────────────────────────
    const HydrationEditor = () => {
      if (!menuPreviewData) return null;
      const [localHydration, setLocalHydration] = useState(menuPreviewData.weeklyMenu.domingo.hydration);
      const handleSave = () => {
        setMenuPreviewData({
          ...menuPreviewData,
          weeklyMenu: {
            ...menuPreviewData.weeklyMenu,
            domingo: { ...menuPreviewData.weeklyMenu.domingo, hydration: localHydration },
            domingoV2: menuPreviewData.weeklyMenu.domingoV2 ? { ...menuPreviewData.weeklyMenu.domingoV2, hydration: localHydration } : undefined,
          } as any,
        });
        setEditingHydration(false);
      };
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Droplets className="w-5 h-5 text-indigo-600" />Editar Hidratación</h3>
              <button onClick={() => setEditingHydration(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Meta de Hidratación</label>
                <input type="text" value={localHydration} onChange={e => setLocalHydration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="Ej: 2.5 Litros de agua al día" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setEditingHydration(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Template Note Editor ─────────────────────────────────────────────────
    const TemplateNoteEditor = () => {
      if (!menuPreviewData) return null;
      const [localNote, setLocalNote] = useState(menuPreviewData.weeklyMenu.domingoV2?.note || menuPreviewData.weeklyMenu.domingo.note || '');
      const handleSave = () => {
        setMenuPreviewData({
          ...menuPreviewData,
          weeklyMenu: {
            ...menuPreviewData.weeklyMenu,
            domingoV2: menuPreviewData.weeklyMenu.domingoV2 ? { ...menuPreviewData.weeklyMenu.domingoV2, note: localNote } : undefined,
            domingo: { ...menuPreviewData.weeklyMenu.domingo, note: localNote },
          } as any,
        });
        setEditingTemplateNote(false);
      };
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" />Notas</h3>
                <span className="text-xs font-medium text-slate-500 ml-7">Editar Nota de Plantilla V2</span>
              </div>
              <button onClick={() => setEditingTemplateNote(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contenido de la Nota</label>
                <textarea value={localNote} onChange={e => setLocalNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[150px]"
                  placeholder="Escribe aquí las notas para la plantilla..." />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setEditingTemplateNote(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Domingo Día Libre Editor ─────────────────────────────────────────────
    const DomingoLibreEditor = () => {
      if (!menuPreviewData) return null;
      const [localNote, setLocalNote] = useState(menuPreviewData.weeklyMenu.domingo.note || '');
      const handleSave = () => {
        setMenuPreviewData({ ...menuPreviewData, weeklyMenu: { ...menuPreviewData.weeklyMenu, domingo: { ...menuPreviewData.weeklyMenu.domingo, note: localNote } } });
        setEditingDomingoLibre(false);
      };
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" />Domingo — Día Libre</h3>
              <button onClick={() => setEditingDomingoLibre(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nota del Día Libre</label>
              <textarea value={localNote} onChange={e => setLocalNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[120px]"
                placeholder="Ej: Domingo de descanso, disfruta con moderación..." />
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setEditingDomingoLibre(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Domingo Completo Editor ──────────────────────────────────────────────
    const DomingoCompletoEditor = () => {
      if (!menuPreviewData) return null;
      const domingoV2 = menuPreviewData.weeklyMenu.domingoV2;
      const order = domingoV2?.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
      const [meals, setMeals] = useState<{ id: string; label: string; title: string }[]>(() =>
        order.map(id => {
          const m = (domingoV2 as any)?.[id];
          return { id, label: m?.label || (id.includes('ref') ? 'Refacción' : id.charAt(0).toUpperCase() + id.slice(1)), title: m?.title || '' };
        })
      );
      const addMeal = () => setMeals([...meals, { id: `meal_${Date.now()}`, label: 'Nuevo Tiempo', title: '' }]);
      const removeMeal = (id: string) => setMeals(meals.filter(m => m.id !== id));
      const moveMeal = (index: number, dir: 'up' | 'down') => {
        const next = [...meals];
        const target = dir === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setMeals(next);
      };
      const handleSave = () => {
        const updatedV2: any = { ...domingoV2, mealsOrder: meals.map(m => m.id) };
        meals.forEach(m => { updatedV2[m.id] = { label: m.label, title: m.title }; });
        const newByMeal = { ...menuPreviewData.portions.byMeal };
        meals.forEach(m => { if (!newByMeal[m.id]) newByMeal[m.id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 }; });
        setMenuPreviewData({ ...menuPreviewData, weeklyMenu: { ...menuPreviewData.weeklyMenu, domingoV2: updatedV2 } as any, portions: { ...menuPreviewData.portions, byMeal: newByMeal } });
        setEditingDomingoCompleto(false);
      };
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" />Domingo — Menú Completo</h3>
              <button onClick={() => setEditingDomingoCompleto(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium italic">Configura los tiempos de comida para el domingo completo.</p>
                <button onClick={addMeal} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                  <Plus className="w-3.5 h-3.5" />Agregar Tiempo
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {meals.map((meal, idx) => (
                  <div key={meal.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveMeal(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white rounded-md disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
                        <button onClick={() => moveMeal(idx, 'down')} disabled={idx === meals.length - 1} className="p-1 hover:bg-white rounded-md disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
                      </div>
                      <div className="flex-1 space-y-3">
                        <input value={meal.label} onChange={e => { const n = [...meals]; n[idx] = { ...meals[idx], label: e.target.value }; setMeals(n); }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Etiqueta (Ej: Desayuno)" />
                        <textarea value={meal.title} onChange={e => { const n = [...meals]; n[idx] = { ...meals[idx], title: e.target.value }; setMeals(n); }}
                          rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Contenido del menú..." />
                      </div>
                      <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setEditingDomingoCompleto(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Recommendations Editor ───────────────────────────────────────────────
    const RecommendationsEditor = ({ section }: { section: RecSection }) => {
      if (!menuPreviewData) return null;
      const titles: Record<RecSection, string> = { preparacion: 'Preparación de Alimentos', restricciones: 'Restricciones Específicas', habitos: 'Hábitos Saludables', organizacion: 'Organización y Horarios' };
      const currentRecs = menuPreviewData.recommendations || { preparacion: [], restricciones: [], habitos: [], organizacion: [] };
      const [localItems, setLocalItems] = useState<string[]>(currentRecs[section] || []);
      const handleSave = () => {
        setMenuPreviewData({ ...menuPreviewData, recommendations: { ...currentRecs, [section]: localItems.filter(i => i.trim() !== '') } });
        setEditingRecSection(null);
      };
      return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Edit3 className="w-5 h-5 text-indigo-600" />{titles[section]}</h3>
              <button onClick={() => setEditingRecSection(null)} className="p-2 hover:bg-white rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium italic">Agrega o edita las notas para esta sección.</p>
                <button onClick={() => setLocalItems([...localItems, ''])} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                  <Plus className="w-3.5 h-3.5" />Agregar Nota
                </button>
              </div>
              <div className="space-y-3">
                {localItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <textarea value={item} onChange={e => { const n = [...localItems]; n[idx] = e.target.value; setLocalItems(n); }} rows={2}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                      placeholder="Escribe una recomendación..." />
                    <button onClick={() => setLocalItems(localItems.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-start mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button onClick={() => setEditingRecSection(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />Guardar
              </button>
            </div>
          </div>
        </div>
      );
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
      <>
        {/* Toolbar buttons */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1">Editar Página 1 de Menú</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setIsEditingPatientInfo(true)} className={btnClass}>
                <User className="w-3.5 h-3.5" />Info. Paciente
              </button>
              <button onClick={() => setEditingPortions(true)} className={btnClass}>
                <TableIcon className="w-3.5 h-3.5" />Tabla porciones
              </button>
              {DAYS.map(day => (
                <button key={day} onClick={() => setEditingDay(day)} className={`${btnClass} capitalize`}>
                  <Calendar className="w-3.5 h-3.5" />{day.slice(0, 3)}
                </button>
              ))}
              <button onClick={() => setEditingTemplateNote(true)} className={btnClass}>
                <FileText className="w-3.5 h-3.5" />Notas
              </button>
              <button onClick={() => setEditingHydration(true)} className={btnClass}>
                <Droplets className="w-3.5 h-3.5" />Hidratación
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1">Editar Página 2 de Menú</h3>
            <div className="flex flex-wrap gap-2">
              {(['preparacion', 'restricciones', 'habitos', 'organizacion'] as RecSection[]).map(section => (
                <button key={section} onClick={() => setEditingRecSection(section)} className={btnClass}>
                  <Edit3 className="w-3.5 h-3.5" />
                  {{ preparacion: 'Preparación de Alimentos', restricciones: 'Restricciones Específicas', habitos: 'Hábitos Saludables', organizacion: 'Organización y Horarios' }[section]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modals */}
        {isEditingPatientInfo && <PatientInfoEditor />}
        {editingPortions && <PortionsEditor />}
        {editingDay && <DayEditor dayKey={editingDay} />}
        {editingHydration && <HydrationEditor />}
        {editingTemplateNote && <TemplateNoteEditor />}
        {editingDomingoLibre && <DomingoLibreEditor />}
        {editingDomingoCompleto && <DomingoCompletoEditor />}
        {editingRecSection && <RecommendationsEditor section={editingRecSection} />}
      </>
    );
  }
);

MenuEditorToolbar.displayName = 'MenuEditorToolbar';
