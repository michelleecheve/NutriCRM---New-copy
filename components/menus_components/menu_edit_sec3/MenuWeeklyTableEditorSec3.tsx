import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Copy, ChevronDown, ChevronUp, Sun, CalendarDays, Save, AlertCircle, Paintbrush } from 'lucide-react';
import { MenuPlanData, DomingoV2 } from '../MenuDesignTemplates';

const WEEKDAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
type WeekDay = typeof WEEKDAYS[number];

const DAY_LABEL: Record<WeekDay, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb',
};

type LocalGrid = Record<string, Record<string, string>>; // mealId → dayKey → title

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
}

const TABLE_MIN_WIDTH_LIBRE = 1360;
const TABLE_MIN_WIDTH_COMPLETO = 1570;

export const MenuWeeklyTableEditorSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData }) => {
  const [open, setOpen] = useState(true);
  const [copiedSource, setCopiedSource] = useState<WeekDay | 'domingo' | null>(null);
  const [clipboard, setClipboard] = useState<Record<string, string> | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const getMeals = (): { id: string; label: string }[] => {
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

  const buildGrid = (): LocalGrid => {
    const mealList = getMeals();
    const g: LocalGrid = {};
    mealList.forEach(({ id }) => {
      g[id] = {};
      WEEKDAYS.forEach(day => {
        g[id][day] = (menuPreviewData.weeklyMenu[day] as any)[id]?.title || '';
      });
    });
    return g;
  };

  const buildDomingoV2Grid = (mealList: { id: string }[]): Record<string, string> => {
    const r: Record<string, string> = {};
    mealList.forEach(({ id }) => {
      r[id] = (menuPreviewData.weeklyMenu.domingoV2 as any)?.[id]?.title || '';
    });
    return r;
  };

  const [meals, setMeals] = useState<{ id: string; label: string }[]>(getMeals);
  const [grid, setGrid] = useState<LocalGrid>(buildGrid);
  const [domingoV2Grid, setDomingoV2Grid] = useState<Record<string, string>>(
    () => buildDomingoV2Grid(getMeals())
  );
  const [domingoNote, setDomingoNote] = useState(menuPreviewData.weeklyMenu.domingo.note || '');
  const [hydration, setHydration] = useState(menuPreviewData.weeklyMenu.domingo.hydration || '');
  const [domingoV2Note, setDomingoV2Note] = useState(menuPreviewData.weeklyMenu.domingoV2?.note || '');
  const [domingoV2Hydration, setDomingoV2Hydration] = useState(menuPreviewData.weeklyMenu.domingoV2?.hydration || '');

  const hasV2Data = meals.some(m => (menuPreviewData.weeklyMenu.domingoV2 as any)?.[m.id]?.title);
  const [domingoMode, setDomingoMode] = useState<'libre' | 'completo'>(
    menuPreviewData.weeklyMenu.domingoMode ?? (hasV2Data ? 'completo' : 'libre')
  );

  const textareaRefs = useRef<Record<string, Record<string, HTMLTextAreaElement | null>>>({});
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const handleTableScroll = () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (topScrollRef.current && tableScrollRef.current)
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    isSyncing.current = false;
  };

  const handleTopScroll = () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (tableScrollRef.current && topScrollRef.current)
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    isSyncing.current = false;
  };

  const syncRowHeights = (mealId: string) => {
    const refs = textareaRefs.current[mealId];
    if (!refs) return;
    const els = Object.values(refs).filter(Boolean) as HTMLTextAreaElement[];
    els.forEach(el => { el.style.height = 'auto'; });
    const maxH = Math.max(...els.map(el => el.scrollHeight), 36);
    els.forEach(el => { el.style.height = maxH + 'px'; });
  };

  const setTextareaRef = (mealId: string, day: string, el: HTMLTextAreaElement | null) => {
    if (!textareaRefs.current[mealId]) textareaRefs.current[mealId] = {};
    textareaRefs.current[mealId][day] = el;
  };

  useEffect(() => {
    setTimeout(() => meals.forEach(meal => syncRowHeights(meal.id)), 0);
  }, [domingoMode]); // eslint-disable-line

  const handleSaveAll = () => {
    const newWeekly = { ...menuPreviewData.weeklyMenu } as any;
    const newOrder = meals.map(m => m.id);

    // Commit grid cells + labels + order for each weekday
    WEEKDAYS.forEach(day => {
      const dayData = { ...newWeekly[day], mealsOrder: newOrder };
      meals.forEach(({ id, label }) => {
        dayData[id] = { ...dayData[id], title: grid[id]?.[day] || '', label };
      });
      newWeekly[day] = dayData;
    });

    // Commit domingoV2 grid + meta + order + labels
    const baseV2: any = newWeekly.domingoV2 || {};
    const updatedV2: DomingoV2 = {
      ...baseV2,
      mealsOrder: newOrder,
      note: domingoV2Note,
      hydration: domingoV2Hydration,
    };
    meals.forEach(({ id, label }) => {
      (updatedV2 as any)[id] = { ...(baseV2[id] || {}), title: domingoV2Grid[id] || '', label };
    });
    newWeekly.domingoV2 = updatedV2;

    // Commit domingo libre meta
    newWeekly.domingo = { ...newWeekly.domingo, note: domingoNote, hydration };

    setMenuPreviewData({ ...menuPreviewData, weeklyMenu: newWeekly });
    setIsDirty(false);
  };

  const switchDomingoMode = (mode: 'libre' | 'completo') => {
    setDomingoMode(mode);
    setMenuPreviewData({
      ...menuPreviewData,
      weeklyMenu: { ...menuPreviewData.weeklyMenu, domingoMode: mode },
    });
  };

  const copyDay = (day: WeekDay) => {
    const snap: Record<string, string> = {};
    meals.forEach(({ id }) => { snap[id] = grid[id]?.[day] || ''; });
    setClipboard(snap);
    setCopiedSource(day);
  };

  const pasteDay = (dstDay: WeekDay) => {
    if (!clipboard || copiedSource === dstDay) return;
    const newGrid = { ...grid };
    meals.forEach(({ id }) => {
      newGrid[id] = { ...newGrid[id], [dstDay]: clipboard[id] || '' };
    });
    setGrid(newGrid);
    setIsDirty(true);
    setTimeout(() => meals.forEach(meal => syncRowHeights(meal.id)), 0);
  };

  const copyDomingo = () => {
    const snap: Record<string, string> = {};
    meals.forEach(({ id }) => { snap[id] = domingoV2Grid[id] || ''; });
    setClipboard(snap);
    setCopiedSource('domingo');
  };

  const pasteToDomingo = () => {
    if (!clipboard || copiedSource === 'domingo') return;
    setDomingoV2Grid({ ...clipboard });
    setIsDirty(true);
    setTimeout(() => meals.forEach(meal => syncRowHeights(meal.id)), 0);
  };

  const moveMeal = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= meals.length) return;
    const newMeals = [...meals];
    [newMeals[index], newMeals[target]] = [newMeals[target], newMeals[index]];
    setMeals(newMeals);
    setIsDirty(true);
    setTimeout(() => newMeals.forEach(m => syncRowHeights(m.id)), 0);
  };

  const updateMealLabel = (id: string, label: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, label } : m));
    setIsDirty(true);
  };

  const copyMealToAll = (mealId: string) => {
    const srcTitle = grid[mealId]?.lunes || '';
    const newGrid = { ...grid };
    WEEKDAYS.forEach(day => { newGrid[mealId] = { ...newGrid[mealId], [day]: srcTitle }; });
    setGrid(newGrid);
    setIsDirty(true);
    setTimeout(() => syncRowHeights(mealId), 0);
  };

  const cellCls =
    'w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium ' +
    'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed overflow-hidden';

  const tableMinWidth = domingoMode === 'completo' ? TABLE_MIN_WIDTH_COMPLETO : TABLE_MIN_WIDTH_LIBRE;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          Menú Semanal
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Domingo toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => switchDomingoMode('libre')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              domingoMode === 'libre'
                ? 'bg-amber-400 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sun className="w-3 h-3" />
            Dom. Libre
          </button>
          <button
            onClick={() => switchDomingoMode('completo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              domingoMode === 'completo'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            Dom. Completo
          </button>
        </div>
      </div>

      {open && (
        <>
          {/* Top scrollbar mirror */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-scroll border-b border-slate-100"
            style={{ height: 16 }}
          >
            <div style={{ minWidth: tableMinWidth, height: 1 }} />
          </div>

          {/* Table */}
          <div
            ref={tableScrollRef}
            onScroll={handleTableScroll}
            className="overflow-x-auto"
          >
            <table className="border-collapse" style={{ minWidth: tableMinWidth, width: '100%' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ minWidth: 100, width: 100 }}>
                    Tiempo
                  </th>

                  {WEEKDAYS.map(day => (
                    <th key={day} className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider"
                      style={{ minWidth: 210, width: 210 }}>
                      <div className="flex items-center justify-between gap-1">
                        <span>{DAY_LABEL[day]}</span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => copyDay(day)}
                            title={`Copiar ${DAY_LABEL[day]}`}
                            className={`p-1 rounded-lg transition-all ${
                              copiedSource === day
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'hover:bg-indigo-100 text-slate-400 hover:text-indigo-600'
                            }`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => pasteDay(day)}
                            title="Pegar día copiado"
                            disabled={!clipboard || copiedSource === day}
                            className={`p-1 rounded-lg transition-all ${
                              clipboard && copiedSource !== day
                                ? 'hover:bg-emerald-100 text-slate-400 hover:text-emerald-600'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Paintbrush className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Domingo Completo column header */}
                  {domingoMode === 'completo' && (
                    <th className="px-2 py-2 text-[10px] font-black text-indigo-500 uppercase tracking-wider" style={{ minWidth: 210, width: 210 }}>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3" />
                          Dom.
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={copyDomingo}
                            title="Copiar Dom."
                            className={`p-1 rounded-lg transition-all ${
                              copiedSource === 'domingo'
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'hover:bg-indigo-100 text-indigo-300 hover:text-indigo-600'
                            }`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={pasteToDomingo}
                            title="Pegar día copiado"
                            disabled={!clipboard || copiedSource === 'domingo'}
                            className={`p-1 rounded-lg transition-all ${
                              clipboard && copiedSource !== 'domingo'
                                ? 'hover:bg-emerald-100 text-indigo-300 hover:text-emerald-600'
                                : 'text-indigo-100 cursor-not-allowed'
                            }`}
                          >
                            <Paintbrush className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {meals.map((meal, index) => (
                  <tr key={meal.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-2 py-2 align-top">
                      <div className="flex items-start gap-1">
                        {/* Flechas reordenar */}
                        <div className="flex flex-col shrink-0 pt-0.5">
                          <button
                            onClick={() => moveMeal(index, -1)}
                            disabled={index === 0}
                            title="Mover arriba"
                            className={`p-0.5 rounded transition-colors ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveMeal(index, 1)}
                            disabled={index === meals.length - 1}
                            title="Mover abajo"
                            className={`p-0.5 rounded transition-colors ${index === meals.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Label editable + copiar a todos */}
                        <div className="space-y-1 min-w-0">
                          <input
                            value={meal.label}
                            onChange={e => updateMealLabel(meal.id, e.target.value)}
                            title="Editar nombre del tiempo de comida"
                            className="text-[10px] font-black text-slate-600 uppercase leading-tight block w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none transition-colors"
                          />
                          <button
                            onClick={() => copyMealToAll(meal.id)}
                            title="Copiar desde Lunes a todos los días"
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
                          >
                            <Copy className="w-2.5 h-2.5" />→ todos
                          </button>
                        </div>
                      </div>
                    </td>

                    {WEEKDAYS.map(day => (
                      <td key={day} className="px-1.5 py-1.5 align-top">
                        <textarea
                          value={grid[meal.id]?.[day] || ''}
                          rows={1}
                          ref={el => setTextareaRef(meal.id, day, el)}
                          onChange={e => {
                            setGrid(prev => ({
                              ...prev,
                              [meal.id]: { ...prev[meal.id], [day]: e.target.value },
                            }));
                            setIsDirty(true);
                            syncRowHeights(meal.id);
                          }}
                          className={cellCls}
                          style={{ minHeight: '36px' }}
                          placeholder="Si el campo está vacío se ignora este tiempo de comida"
                        />
                      </td>
                    ))}

                    {/* Domingo Completo cell */}
                    {domingoMode === 'completo' && (
                      <td className="px-1.5 py-1.5 align-top">
                        <textarea
                          value={domingoV2Grid[meal.id] || ''}
                          rows={1}
                          ref={el => setTextareaRef(meal.id, 'domingo', el)}
                          onChange={e => {
                            setDomingoV2Grid(prev => ({ ...prev, [meal.id]: e.target.value }));
                            setIsDirty(true);
                            syncRowHeights(meal.id);
                          }}
                          className={`${cellCls} focus:ring-indigo-500/20 focus:border-indigo-400`}
                          style={{ minHeight: '36px' }}
                          placeholder="Si el campo está vacío se ignora este tiempo de comida"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Domingo Libre section */}
          {domingoMode === 'libre' && (
            <div className="mx-4 my-3 rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-100 bg-amber-50/60">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-black text-amber-600 uppercase tracking-wide">Domingo — Día Libre</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider block mb-1.5">
                    Nota / Indicaciones
                  </label>
                  <textarea
                    value={domingoNote}
                    rows={3}
                    onChange={e => { setDomingoNote(e.target.value); setIsDirty(true); }}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all resize-none leading-relaxed"
                    placeholder="Ej: Día de descanso, puede comer más flexible. Evitar excesos. Priorizar proteína en almuerzo..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-500 uppercase tracking-wider block mb-1.5">
                    Hidratación
                  </label>
                  <input
                    type="text"
                    value={hydration}
                    onChange={e => { setHydration(e.target.value); setIsDirty(true); }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all"
                    placeholder="Ej: 2.5L de agua"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Domingo Completo — nota + hidratación complementarias */}
          {domingoMode === 'completo' && (
            <div className="mx-4 my-3 rounded-2xl border border-indigo-100 bg-indigo-50/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-indigo-100 bg-indigo-50/50">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wide">Domingo — Nota e Hidratación</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block mb-1.5">
                    Nota / Observaciones
                  </label>
                  <textarea
                    value={domingoV2Note}
                    rows={3}
                    onChange={e => { setDomingoV2Note(e.target.value); setIsDirty(true); }}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed"
                    placeholder="Observaciones del día..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-500 uppercase tracking-wider block mb-1.5">
                    Hidratación
                  </label>
                  <input
                    type="text"
                    value={domingoV2Hydration}
                    onChange={e => { setDomingoV2Hydration(e.target.value); setIsDirty(true); }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all"
                    placeholder="Ej: 2.5L de agua"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Toggle de modo domingo — acceso rápido bajo el box */}
          <div className="mx-4 mb-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cambiar modo domingo:</span>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
              <button
                onClick={() => switchDomingoMode('libre')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  domingoMode === 'libre'
                    ? 'bg-amber-400 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sun className="w-2.5 h-2.5" />
                Dom. Libre
              </button>
              <button
                onClick={() => switchDomingoMode('completo')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  domingoMode === 'completo'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CalendarDays className="w-2.5 h-2.5" />
                Dom. Completo
              </button>
            </div>
          </div>

          {/* Footer: aviso de cambios + botón guardar */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-[10px] text-slate-400 italic">
              Usa Enter para listar varias opciones por tiempo de comida.
              <Copy className="w-2.5 h-2.5 inline mx-0.5" /> copia el día · <Paintbrush className="w-2.5 h-2.5 inline mx-0.5" /> pega el día copiado · "→ todos" copia desde Lunes a toda la semana.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {isDirty && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Hay cambios sin guardar
                </span>
              )}
              <button
                onClick={handleSaveAll}
                disabled={!isDirty}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isDirty
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
