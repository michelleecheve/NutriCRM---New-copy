import React, { useState, useCallback } from 'react';
import { Table as TableIcon, Plus, Trash2, MoveUp, MoveDown, Save, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { MenuPlanData, MealPortions } from '../MenuDesignTemplates';
import { PortionsRecord } from '../../../types';

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
  portions: PortionsRecord;
}

export const MenuTablePortionsSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData, portions }) => {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState(false);

  const initMeals = (): { id: string; label: string }[] => {
    const order = menuPreviewData.weeklyMenu.lunes.mealsOrder ||
      ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
    const defaults: Record<string, string> = {
      desayuno: 'Desayuno', refaccion1: 'Refacción 1',
      almuerzo: 'Almuerzo', refaccion2: 'Refacción 2', cena: 'Cena',
    };
    return order.map(id => {
      const m = (menuPreviewData.weeklyMenu.lunes as any)[id];
      return { id, label: m?.label || defaults[id] || id };
    });
  };

  const [meals, setMeals] = useState<{ id: string; label: string }[]>(initMeals);
  const [localPortions, setLocalPortions] = useState(menuPreviewData.portions);
  // Tracks raw string values while editing to allow empty/intermediate states
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const groups: (keyof MealPortions)[] = ['lacteos', 'vegetales', 'frutas', 'cereales', 'carnes', 'grasas'];
  const groupLabels = ['🥛 Lác', '🥦 Veg', '🍎 Fru', '🌾 Cer', '🥩 Car', '🫒 Gra'];

  const calcTotal = (g: keyof MealPortions) =>
    meals.reduce((s, m) => s + Number((localPortions.byMeal[m.id] as any)?.[g] || 0), 0);

  const addMeal = () => {
    const id = `meal_${Date.now()}`;
    setMeals(prev => [...prev, { id, label: 'Nuevo Tiempo' }]);
    setLocalPortions(prev => ({
      ...prev,
      byMeal: { ...prev.byMeal, [id]: { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 } },
    }));
  };

  const removeMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
    setLocalPortions(prev => {
      const b = { ...prev.byMeal };
      delete b[id];
      return { ...prev, byMeal: b };
    });
  };

  const moveMeal = (idx: number, dir: 'up' | 'down') => {
    setMeals(prev => {
      const n = [...prev];
      const t = dir === 'up' ? idx - 1 : idx + 1;
      if (t < 0 || t >= n.length) return n;
      [n[idx], n[t]] = [n[t], n[idx]];
      return n;
    });
  };

  const updatePortion = (mealId: string, g: keyof MealPortions, val: number) =>
    setLocalPortions(prev => ({
      ...prev,
      byMeal: { ...prev.byMeal, [mealId]: { ...prev.byMeal[mealId], [g]: val } },
    }));

  const editKey = (mealId: string, g: keyof MealPortions) => `${mealId}_${g}`;

  const handlePortionChange = useCallback((mealId: string, g: keyof MealPortions, raw: string) => {
    const key = editKey(mealId, g);
    setEditingValues(prev => ({ ...prev, [key]: raw }));
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) updatePortion(mealId, g, parsed);
  }, []);

  const handlePortionBlur = useCallback((mealId: string, g: keyof MealPortions) => {
    const key = editKey(mealId, g);
    setEditingValues(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    // Commit 0 if left empty
    setLocalPortions(prev => {
      const current = (prev.byMeal[mealId] as any)?.[g];
      if (current === undefined || isNaN(current)) {
        return { ...prev, byMeal: { ...prev.byMeal, [mealId]: { ...prev.byMeal[mealId], [g]: 0 } } };
      }
      return prev;
    });
  }, []);

  const handleSave = () => {
    const byMeal = { ...localPortions.byMeal };
    meals.forEach(m => { byMeal[m.id] = { ...byMeal[m.id], label: m.label }; });
    const updated = {
      ...localPortions, byMeal,
      lacteos:   calcTotal('lacteos'),   vegetales: calcTotal('vegetales'),
      frutas:    calcTotal('frutas'),    cereales:  calcTotal('cereales'),
      carnes:    calcTotal('carnes'),    grasas:    calcTotal('grasas'),
    };
    const newWeekly = { ...menuPreviewData.weeklyMenu };
    (['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const).forEach(dayKey => {
      const day = { ...(newWeekly[dayKey] as any) };
      day.mealsOrder = meals.map(m => m.id);
      meals.forEach(m => {
        day[m.id] = day[m.id] ? { ...day[m.id], label: m.label } : { title: '', label: m.label };
      });
      newWeekly[dayKey] = day;
    });
    setMenuPreviewData({ ...menuPreviewData, portions: updated, weeklyMenu: newWeekly });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <TableIcon className="w-4 h-4 text-indigo-600" />
          Tabla de Porciones
          {open ? <ChevronUp className="w-4 h-4 text-slate-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />}
        </button>
        {open && (
          <button
            onClick={addMeal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
          >
            <Plus className="w-3.5 h-3.5" />Agregar Tiempo
          </button>
        )}
      </div>

      {open && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse table-fixed">
              <colgroup>
                <col style={{ width: '22%' }} />
                {groupLabels.map((_, i) => <col key={i} style={{ width: '12%' }} />)}
                <col style={{ width: '6%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-bold text-slate-500 text-xs">Tiempo</th>
                  {groupLabels.map(h => (
                    <th key={h} className="px-2 py-2 text-center font-bold text-slate-500 text-xs">{h}</th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {meals.map((meal, idx) => (
                  <tr key={meal.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveMeal(idx, 'up')} disabled={idx === 0}
                            className="p-0.5 hover:bg-white rounded disabled:opacity-20 text-slate-400">
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveMeal(idx, 'down')} disabled={idx === meals.length - 1}
                            className="p-0.5 hover:bg-white rounded disabled:opacity-20 text-slate-400">
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          value={meal.label}
                          onChange={e => { const n = [...meals]; n[idx].label = e.target.value; setMeals(n); }}
                          className="w-full bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0 outline-none"
                        />
                      </div>
                    </td>
                    {groups.map(g => {
                      const key = editKey(meal.id, g);
                      const isEditing = key in editingValues;
                      const storedVal = (localPortions.byMeal[meal.id] as any)?.[g] ?? 0;
                      const displayVal = isEditing ? editingValues[key] : String(storedVal);
                      return (
                        <td key={g} className="px-1 py-2">
                          <input
                            type="number" step="0.5" min="0"
                            value={displayVal}
                            onChange={e => handlePortionChange(meal.id, g, e.target.value)}
                            onFocus={e => e.target.select()}
                            onBlur={() => handlePortionBlur(meal.id, g)}
                            onWheel={e => (e.target as HTMLInputElement).blur()}
                            className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeMeal(meal.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Totals row */}
                <tr className="bg-indigo-50/60 border-t border-indigo-100">
                  <td className="px-3 py-2 text-xs font-black text-indigo-700 uppercase tracking-wider">Totales</td>
                  {groups.map(g => (
                    <td key={g} className="px-1 py-2 text-center text-xs font-black text-indigo-700">{calcTotal(g)}</td>
                  ))}
                  <td />
                </tr>

                {/* Reference row */}
                <tr className="bg-slate-50/60">
                  <td className="px-3 py-2 text-[10px] text-slate-400 font-semibold uppercase leading-tight">Ref. Sec. 2</td>
                  <td className="px-1 py-2 text-center text-xs text-slate-400 font-bold">{(portions.lec || 0) + (portions.lecDesc || 0)}</td>
                  <td className="px-1 py-2 text-center text-xs text-slate-400 font-bold">{portions.veg || 0}</td>
                  <td className="px-1 py-2 text-center text-xs text-slate-400 font-bold">{portions.fru || 0}</td>
                  <td className="px-1 py-2 text-center text-xs text-slate-400 font-bold">{portions.cer || 0}</td>
                  <td className="px-1 py-2 text-center text-xs text-slate-400 font-bold">
                    {(portions.carMagra || 0) + (portions.carSemi || 0) + (portions.carAlta || 0)}
                  </td>
                  <td className="px-1 py-2 text-center text-xs text-slate-400 font-bold">{portions.gra || 0}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-lg transition-all ${
                saved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {saved
                ? <><Check className="w-3.5 h-3.5" />Guardado exitoso</>
                : <><Save className="w-3.5 h-3.5" />Guardar Porciones</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
};
