import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { MenuPlanData, ExchangeMeal } from '../MenuDesignTemplates';

const DEFAULT_MEAL_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
const DEFAULT_MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno', refaccion1: 'Refacción 1',
  almuerzo: 'Almuerzo', refaccion2: 'Refacción 2', cena: 'Cena',
};

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
}

function buildInitialMeals(data: MenuPlanData): ExchangeMeal[] {
  if (data.exchangeMenu?.meals?.length) return data.exchangeMenu.meals;
  // Bootstrap from weekly menu meal order
  const order = data.weeklyMenu?.lunes?.mealsOrder || DEFAULT_MEAL_ORDER;
  return order.map(id => ({
    id,
    label: (data.weeklyMenu?.lunes as any)?.[id]?.label || DEFAULT_MEAL_LABELS[id] || id,
    examples: ['', ''],
  }));
}

function buildInitialExamples(meals: ExchangeMeal[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  meals.forEach(m => { result[m.id] = [...m.examples]; });
  return result;
}

function buildInitialColumnLabels(data: MenuPlanData, numCols: number): string[] {
  const saved = data.exchangeMenu?.columnLabels;
  if (saved?.length) return [...saved];
  return Array.from({ length: numCols }, (_, i) => `Opción ${i + 1}`);
}

export const MenuExchangeEditorSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData }) => {
  const [open, setOpen] = useState(true);

  const initialMeals = buildInitialMeals(menuPreviewData);
  const [meals, setMeals] = useState<ExchangeMeal[]>(initialMeals);
  const [examples, setExamples] = useState<Record<string, string[]>>(buildInitialExamples(initialMeals));
  const [note, setNote] = useState(menuPreviewData.exchangeMenu?.note || '');
  const [hydration, setHydration] = useState(menuPreviewData.exchangeMenu?.hydration || '');
  const initialNumCols = Math.max(2, Math.max(...initialMeals.map(m => m.examples.length), 0));
  const [columnLabels, setColumnLabels] = useState<string[]>(() => buildInitialColumnLabels(menuPreviewData, initialNumCols));

  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ meals, examples, note, hydration, columnLabels });
  useEffect(() => { latestRef.current = { meals, examples, note, hydration, columnLabels }; });

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
        const s = latestRef.current;
        flush(s.meals, s.examples, s.note, s.hydration, s.columnLabels);
      }
    };
  }, []); // eslint-disable-line

  function flush(ms: ExchangeMeal[], ex: Record<string, string[]>, n: string, h: string, cl: string[]) {
    const builtMeals: ExchangeMeal[] = ms.map(m => ({
      id: m.id,
      label: m.label,
      examples: (ex[m.id] || []),
    }));
    setMenuPreviewData({
      ...menuPreviewData,
      menuType: 'intercambio',
      exchangeMenu: { meals: builtMeals, columnLabels: cl, note: n, hydration: h },
    });
  }

  function scheduleCommit(ms: ExchangeMeal[], ex: Record<string, string[]>, n: string, h: string, cl: string[]) {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      flush(ms, ex, n, h, cl);
    }, 500);
  }

  const numCols = Math.max(1, Math.max(...meals.map(m => (examples[m.id] || []).length), 0));

  function addColumn() {
    const newEx = { ...examples };
    meals.forEach(m => { newEx[m.id] = [...(newEx[m.id] || []), '']; });
    const newCl = [...columnLabels, `Opción ${columnLabels.length + 1}`];
    setExamples(newEx);
    setColumnLabels(newCl);
    scheduleCommit(meals, newEx, note, hydration, newCl);
  }

  function removeColumn(colIdx: number) {
    const newEx = { ...examples };
    meals.forEach(m => {
      const arr = [...(newEx[m.id] || [])];
      arr.splice(colIdx, 1);
      newEx[m.id] = arr;
    });
    const newCl = columnLabels.filter((_, i) => i !== colIdx);
    setExamples(newEx);
    setColumnLabels(newCl);
    scheduleCommit(meals, newEx, note, hydration, newCl);
  }

  function updateColumnLabel(colIdx: number, value: string) {
    const newCl = columnLabels.map((l, i) => i === colIdx ? value : l);
    setColumnLabels(newCl);
    scheduleCommit(meals, examples, note, hydration, newCl);
  }

  function updateCell(mealId: string, colIdx: number, value: string) {
    const newEx = { ...examples, [mealId]: [...(examples[mealId] || [])] };
    newEx[mealId][colIdx] = value;
    setExamples(newEx);
    scheduleCommit(meals, newEx, note, hydration, columnLabels);
  }

  function updateMealLabel(id: string, label: string) {
    const newMeals = meals.map(m => m.id === id ? { ...m, label } : m);
    setMeals(newMeals);
    scheduleCommit(newMeals, examples, note, hydration, columnLabels);
  }

  function moveMeal(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= meals.length) return;
    const newMeals = [...meals];
    [newMeals[index], newMeals[target]] = [newMeals[target], newMeals[index]];
    setMeals(newMeals);
    scheduleCommit(newMeals, examples, note, hydration, columnLabels);
  }

  function updateNote(v: string) {
    setNote(v);
    scheduleCommit(meals, examples, v, hydration, columnLabels);
  }

  function updateHydration(v: string) {
    setHydration(v);
    scheduleCommit(meals, examples, note, v, columnLabels);
  }

  const cellCls = 'w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed overflow-hidden';

  // refs[mealId][colIdx] → textarea element
  const textareaRefs = useRef<Record<string, Record<number, HTMLTextAreaElement | null>>>({});

  function setTextareaRef(mealId: string, colIdx: number, el: HTMLTextAreaElement | null) {
    if (!textareaRefs.current[mealId]) textareaRefs.current[mealId] = {};
    textareaRefs.current[mealId][colIdx] = el;
  }

  // Sync all columns in a row to the height of the tallest one
  function syncRowHeights(mealId: string) {
    const refs = textareaRefs.current[mealId];
    if (!refs) return;
    const els = Object.values(refs).filter(Boolean) as HTMLTextAreaElement[];
    els.forEach(el => { el.style.height = 'auto'; });
    const maxH = Math.max(...els.map(el => el.scrollHeight), 36);
    els.forEach(el => { el.style.height = maxH + 'px'; });
  }

  // Sync all rows when opening or when columns are added/removed
  useEffect(() => {
    if (!open) return;
    setTimeout(() => meals.forEach(m => syncRowHeights(m.id)), 0);
  }, [open, numCols]); // eslint-disable-line

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4 text-emerald-600" />
          Menú de Intercambio
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <button
          onClick={addColumn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-slate-500 border-slate-200 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3 h-3" />
          Agregar opción
        </button>
      </div>

      {open && (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="border-collapse" style={{ minWidth: 500, width: '100%' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ minWidth: 120, width: 120 }}>
                    Tiempo
                  </th>
                  {Array.from({ length: numCols }, (_, i) => (
                    <th key={i} className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider" style={{ minWidth: 220 }}>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          value={columnLabels[i] ?? `Opción ${i + 1}`}
                          onChange={e => updateColumnLabel(i, e.target.value)}
                          title="Renombrar esta opción"
                          className="text-[10px] font-black text-slate-600 uppercase tracking-wider bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none transition-colors min-w-0 flex-1"
                        />
                        {numCols > 1 && (
                          <button
                            onClick={() => removeColumn(i)}
                            title="Eliminar esta opción"
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {meals.map((meal, index) => (
                  <tr key={meal.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-2 py-2 align-top">
                      <div className="flex items-start gap-1">
                        <div className="flex flex-col shrink-0 pt-0.5">
                          <button onClick={() => moveMeal(index, -1)} disabled={index === 0} title="Mover arriba"
                            className={`p-0.5 rounded transition-colors ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveMeal(index, 1)} disabled={index === meals.length - 1} title="Mover abajo"
                            className={`p-0.5 rounded transition-colors ${index === meals.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          value={meal.label}
                          onChange={e => updateMealLabel(meal.id, e.target.value)}
                          title="Editar nombre del tiempo de comida"
                          className="text-[10px] font-black text-slate-600 uppercase leading-tight block w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none transition-colors"
                        />
                      </div>
                    </td>

                    {Array.from({ length: numCols }, (_, j) => (
                      <td key={j} className="px-1.5 py-1.5 align-top">
                        <textarea
                          value={(examples[meal.id] || [])[j] || ''}
                          rows={1}
                          ref={el => setTextareaRef(meal.id, j, el)}
                          onChange={e => {
                            updateCell(meal.id, j, e.target.value);
                            syncRowHeights(meal.id);
                          }}
                          className={cellCls}
                          placeholder={`Ej: 2 huevos revueltos\n1 tortilla\n1 vaso de leche`}
                          style={{ minHeight: '36px' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nota + Hidratación */}
          <div className="mx-4 my-3 rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Nota e Hidratación</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  Nota / Indicaciones
                </label>
                <textarea
                  value={note}
                  rows={3}
                  onChange={e => updateNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed"
                  placeholder="Indicaciones generales del plan de intercambio..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-sky-500 uppercase tracking-wider block mb-1.5">
                  Meta Hidratación
                </label>
                <textarea
                  rows={3}
                  value={hydration}
                  onChange={e => updateHydration(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all resize-none leading-relaxed"
                  placeholder="Ej: 2.5L de agua"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 italic">
              Cada columna es una opción de comida por tiempo. Usa Enter para listar varios alimentos dentro de una opción.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
