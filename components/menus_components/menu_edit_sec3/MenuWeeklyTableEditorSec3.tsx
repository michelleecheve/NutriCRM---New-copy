import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Copy, ChevronDown, ChevronUp, Sun, CalendarDays, AlertCircle, Paintbrush, Upload, X, Info, CheckCircle } from 'lucide-react';
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
  visible?: boolean;
}

const TABLE_MIN_WIDTH_LIBRE = 1360;
const TABLE_MIN_WIDTH_COMPLETO = 1570;

export const MenuWeeklyTableEditorSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData, visible }) => {
  const [open, setOpen] = useState(true);
  const [copiedSource, setCopiedSource] = useState<WeekDay | 'domingo' | null>(null);
  const [clipboard, setClipboard] = useState<Record<string, string> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [tableCopied, setTableCopied] = useState(false);
  const [copyPasteOpen, setCopyPasteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  // Ref that always tracks the latest menuPreviewData prop for use inside timers
  const menuPreviewDataRef = useRef(menuPreviewData);
  useEffect(() => { menuPreviewDataRef.current = menuPreviewData; });

  // Keep latestRef in sync so flush-on-unmount always has current values
  useEffect(() => {
    latestRef.current = { grid, meals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration };
  });

  // Flush any pending debounce commit when the component unmounts
  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
        const s = latestRef.current;
        setMenuPreviewData(buildWeeklyData(s.grid, s.meals, s.domingoNote, s.hydration, s.domingoV2Grid, s.domingoV2Note, s.domingoV2Hydration));
      }
    };
  }, []); // eslint-disable-line

  // Debounce timer for auto-committing local edits to the parent
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Tracks latest state values so the cleanup effect can flush on unmount
  const latestRef = useRef({ grid, meals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration });

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

  useEffect(() => {
    if (open) {
      setTimeout(() => meals.forEach(meal => syncRowHeights(meal.id)), 0);
    }
  }, [open]); // eslint-disable-line

  // Re-sync row heights when the section becomes visible again (e.g. switching from preview to tabla)
  // because scrollHeight measurements are 0 while the container is display:none
  useEffect(() => {
    if (visible) {
      setTimeout(() => latestRef.current.meals.forEach(m => syncRowHeights(m.id)), 50);
    }
  }, [visible]); // eslint-disable-line

  // Builds a full MenuPlanData merging local edits into the latest parent state
  const buildWeeklyData = (
    g: LocalGrid,
    ms: { id: string; label: string }[],
    dNote: string,
    dHydration: string,
    dV2Grid: Record<string, string>,
    dV2Note: string,
    dV2Hydration: string
  ): MenuPlanData => {
    const base = menuPreviewDataRef.current;
    const newWeekly = { ...base.weeklyMenu } as any;
    const newOrder = ms.map(m => m.id);

    WEEKDAYS.forEach(day => {
      const dayData = { ...newWeekly[day], mealsOrder: newOrder };
      ms.forEach(({ id, label }) => {
        dayData[id] = { ...dayData[id], title: g[id]?.[day] || '', label };
      });
      newWeekly[day] = dayData;
    });

    const baseV2: any = newWeekly.domingoV2 || {};
    const updatedV2: DomingoV2 = { ...baseV2, mealsOrder: newOrder, note: dV2Note, hydration: dV2Hydration };
    ms.forEach(({ id, label }) => {
      (updatedV2 as any)[id] = { ...(baseV2[id] || {}), title: dV2Grid[id] || '', label };
    });
    newWeekly.domingoV2 = updatedV2;
    newWeekly.domingo = { ...newWeekly.domingo, note: dNote, hydration: dHydration };

    return { ...base, weeklyMenu: newWeekly };
  };

  // Debounced commit: schedules a parent update 500ms after the last change
  const scheduleCommit = (
    g: LocalGrid,
    ms: { id: string; label: string }[],
    dNote: string,
    dHydration: string,
    dV2Grid: Record<string, string>,
    dV2Note: string,
    dV2Hydration: string
  ) => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      setMenuPreviewData(buildWeeklyData(g, ms, dNote, dHydration, dV2Grid, dV2Note, dV2Hydration));
    }, 500);
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
    scheduleCommit(newGrid, meals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration);
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
    const newDomingoV2Grid = { ...clipboard };
    setDomingoV2Grid(newDomingoV2Grid);
    setIsDirty(true);
    scheduleCommit(grid, meals, domingoNote, hydration, newDomingoV2Grid, domingoV2Note, domingoV2Hydration);
    setTimeout(() => meals.forEach(meal => syncRowHeights(meal.id)), 0);
  };

  const copyTableAsText = () => {
    const FULL_DAY_LABEL: Record<string, string> = {
      lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
      jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
    };

    const allDays = domingoMode === 'completo'
      ? [...WEEKDAYS, 'domingo' as const]
      : [...WEEKDAYS];

    const blocks: string[] = [];

    allDays.forEach(day => {
      const dayLabel = FULL_DAY_LABEL[day];
      const mealChunks: string[] = [];
      meals.forEach(meal => {
        const content = day === 'domingo'
          ? (domingoV2Grid[meal.id] || '').trim()
          : (grid[meal.id]?.[day as WeekDay] || '').trim();
        if (content) {
          mealChunks.push(`${meal.label} ${dayLabel}:\n${content}`);
        }
      });
      if (mealChunks.length > 0) {
        blocks.push(`Dia: ${dayLabel}\n${mealChunks.join('\n\n')}`);
      }
    });

    if (domingoMode === 'libre') {
      const extras: string[] = [];
      if (domingoNote) extras.push(`Indicaciones domingo:\n${domingoNote}`);
      if (hydration) extras.push(`Hidratación domingo:\n${hydration}`);
      if (extras.length > 0) blocks.push(`Dia: Domingo\n${extras.join('\n\n')}`);
    } else {
      const extras: string[] = [];
      if (domingoV2Note) extras.push(`Nota domingo:\n${domingoV2Note}`);
      if (domingoV2Hydration) extras.push(`Hidratación domingo:\n${domingoV2Hydration}`);
      if (extras.length > 0) blocks.push(`Dia: Domingo\n${extras.join('\n\n')}`);
    }

    const text = blocks.join('\n\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setTableCopied(true);
      setTimeout(() => setTableCopied(false), 2000);
    });
  };

  const normStr = (s: string) =>
    s.toLowerCase()
     .normalize('NFD').replace(/[̀-ͯ]/g, '')
     .replace(/[^a-z0-9\s]/g, '')
     .trim();

  const DAY_NORM_KEY: Record<string, WeekDay | 'domingo'> = {
    lunes: 'lunes', martes: 'martes', miercoles: 'miercoles',
    jueves: 'jueves', viernes: 'viernes', sabado: 'sabado', domingo: 'domingo',
  };

  const parseAndApply = () => {
    const errors: string[] = [];

    const clonedGrid: LocalGrid = {};
    Object.keys(grid).forEach(mId => { clonedGrid[mId] = { ...grid[mId] }; });
    const newDomingoV2Grid = { ...domingoV2Grid };

    // Pre-compute normalized meal labels (skip empty labels)
    const mealNormMap = meals
      .map(m => ({ id: m.id, norm: normStr(m.label) }))
      .filter(m => m.norm.length > 0);

    // Trigger 1: line is "dia" + optional punct + day name (e.g. "Dia: Lunes", "Día Martes:")
    const matchDayTrigger = (norm: string): WeekDay | 'domingo' | null => {
      const m = norm.match(/^dia\s*:?\s*(\w+)/);
      if (!m) return null;
      return DAY_NORM_KEY[m[1]] ?? null;
    };

    // Trigger 2: line is [meal label] [day name] only (e.g. "Desayuno Lunes:", "Refacción 1 Martes")
    const matchMealDayTrigger = (norm: string): { mealId: string; dayKey: WeekDay | 'domingo' } | null => {
      for (const { id, norm: mNorm } of mealNormMap) {
        if (!norm.startsWith(mNorm)) continue;
        // Require a word boundary after the meal label
        const boundary = norm[mNorm.length];
        if (boundary !== undefined && boundary !== ' ') continue;
        const rest = norm.slice(mNorm.length).replace(/^[\s:]+/, '').replace(/[\s:]+$/, '');
        const parts = rest.split(/\s+/).filter(Boolean);
        // Must be exactly one word left and that word must be a day name
        if (parts.length !== 1) continue;
        const dayKey = DAY_NORM_KEY[parts[0]];
        if (dayKey) return { mealId: id, dayKey };
      }
      return null;
    };

    let currentMealId: string | null = null;
    let currentDayKey: WeekDay | 'domingo' | null = null;
    let contentLines: string[] = [];

    const flushContent = () => {
      if (!currentMealId || !currentDayKey) return;
      const content = contentLines.join('\n').trim();
      if (currentDayKey === 'domingo') {
        newDomingoV2Grid[currentMealId] = content;
      } else {
        clonedGrid[currentMealId] = { ...clonedGrid[currentMealId], [currentDayKey as WeekDay]: content };
      }
    };

    for (const rawLine of importText.split('\n')) {
      const norm = normStr(rawLine);

      // Check meal+day trigger first (more specific)
      const mealDay = matchMealDayTrigger(norm);
      if (mealDay) {
        flushContent();
        currentMealId = mealDay.mealId;
        currentDayKey = mealDay.dayKey;
        contentLines = [];
        continue;
      }

      // Check day trigger (section marker — resets context without assigning content)
      if (matchDayTrigger(norm) !== null) {
        flushContent();
        currentMealId = null;
        currentDayKey = null;
        contentLines = [];
        continue;
      }

      // Warn if line looks like a day header but the day name isn't recognized
      const dayAttemptMatch = norm.match(/^dia\s*:?\s*([a-z]+)/);
      if (dayAttemptMatch && !DAY_NORM_KEY[dayAttemptMatch[1]]) {
        errors.push(`Día no reconocido: "${rawLine.trim()}". Asegúrate de escribirlo así: Dia Lunes, Dia: Lunes, Día Martes — la palabra "Dia" debe ir siempre al inicio seguida del nombre del día.`);
      }

      // Warn if line looks like a meal+day trigger but the day name isn't recognized
      for (const { id: _id, norm: mNorm } of mealNormMap) {
        if (!norm.startsWith(mNorm)) continue;
        const boundary = norm[mNorm.length];
        if (boundary !== undefined && boundary !== ' ') break;
        const rest = norm.slice(mNorm.length).replace(/^[\s:]+/, '').replace(/[\s:]+$/, '');
        const parts = rest.split(/\s+/).filter(Boolean);
        if (parts.length === 1 && !DAY_NORM_KEY[parts[0]]) {
          const mealLabel = meals.find(m => normStr(m.label) === mNorm)?.label || mNorm;
          errors.push(`Tiempo de comida no reconocido: "${rawLine.trim()}". Asegúrate de escribirlo así: ${mealLabel} Lunes, ${mealLabel} Martes: — primero el tiempo de comida y luego el nombre del día.`);
        }
        break;
      }

      // Content line (blank or text) — accumulate regardless of blank lines
      if (currentMealId && currentDayKey) {
        contentLines.push(rawLine);
      }
    }

    // Flush last accumulated content
    flushContent();

    setImportErrors(errors);
    setGrid(clonedGrid);
    setDomingoV2Grid(newDomingoV2Grid);
    setIsDirty(true);
    scheduleCommit(clonedGrid, meals, domingoNote, hydration, newDomingoV2Grid, domingoV2Note, domingoV2Hydration);
    setTimeout(() => meals.forEach(m => syncRowHeights(m.id)), 0);

    if (errors.length === 0) {
      setImportSuccess(true);
      setTimeout(() => {
        setImportOpen(false);
        setImportText('');
        setImportSuccess(false);
        setImportErrors([]);
      }, 1200);
    }
  };

  const moveMeal = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= meals.length) return;
    const newMeals = [...meals];
    [newMeals[index], newMeals[target]] = [newMeals[target], newMeals[index]];
    setMeals(newMeals);
    setIsDirty(true);
    scheduleCommit(grid, newMeals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration);
    setTimeout(() => newMeals.forEach(m => syncRowHeights(m.id)), 0);
  };

  const updateMealLabel = (id: string, label: string) => {
    const newMeals = meals.map(m => m.id === id ? { ...m, label } : m);
    setMeals(newMeals);
    setIsDirty(true);
    scheduleCommit(grid, newMeals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration);
  };

  const copyMealToAll = (mealId: string) => {
    const srcTitle = grid[mealId]?.lunes || '';
    const newGrid = { ...grid };
    WEEKDAYS.forEach(day => { newGrid[mealId] = { ...newGrid[mealId], [day]: srcTitle }; });
    setGrid(newGrid);
    setIsDirty(true);
    scheduleCommit(newGrid, meals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration);
    setTimeout(() => syncRowHeights(mealId), 0);
  };

  const cellCls =
    'w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium ' +
    'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed overflow-hidden';

  const tableMinWidth = domingoMode === 'completo' ? TABLE_MIN_WIDTH_COMPLETO : TABLE_MIN_WIDTH_LIBRE;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="w-full bg-slate-50 border-b border-slate-100">
        {/* Title row */}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            Menú Semanal
            {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Controls — desktop only */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Dropdown Copiar / Pegar */}
            <div className="relative">
              <button
                onClick={() => setCopyPasteOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
              >
                <Copy className="w-3 h-3" />
                Copiar / Pegar
                <ChevronDown className={`w-3 h-3 transition-transform ${copyPasteOpen ? 'rotate-180' : ''}`} />
              </button>
              {copyPasteOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCopyPasteOpen(false)} />
                  <div className="absolute right-0 mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-44">
                    <button
                      onClick={() => { copyTableAsText(); setCopyPasteOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                        tableCopied ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      {tableCopied ? '¡Copiado!' : 'Copiar Menú'}
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={() => { setImportOpen(true); setImportErrors([]); setImportSuccess(false); setCopyPasteOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                      Pegar en Menú
                    </button>
                  </div>
                </>
              )}
            </div>

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
        </div>

        {/* Mobile controls row — below title */}
        <div className="flex sm:hidden items-center gap-2 px-4 pb-3 flex-wrap">
          {/* Dropdown Copiar / Pegar */}
          <div className="relative">
            <button
              onClick={() => setCopyPasteOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Copy className="w-3 h-3" />
              Copiar / Pegar
              <ChevronDown className={`w-3 h-3 transition-transform ${copyPasteOpen ? 'rotate-180' : ''}`} />
            </button>
            {copyPasteOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCopyPasteOpen(false)} />
                <div className="absolute left-0 mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-44">
                  <button
                    onClick={() => { copyTableAsText(); setCopyPasteOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                      tableCopied ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    {tableCopied ? '¡Copiado!' : 'Copiar Menú'}
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={() => { setImportOpen(true); setImportErrors([]); setImportSuccess(false); setCopyPasteOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                    Pegar en Menú
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Domingo toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
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
                            const newGrid = {
                              ...grid,
                              [meal.id]: { ...grid[meal.id], [day]: e.target.value },
                            };
                            setGrid(newGrid);
                            setIsDirty(true);
                            syncRowHeights(meal.id);
                            scheduleCommit(newGrid, meals, domingoNote, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration);
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
                            const newDomingoV2Grid = { ...domingoV2Grid, [meal.id]: e.target.value };
                            setDomingoV2Grid(newDomingoV2Grid);
                            setIsDirty(true);
                            syncRowHeights(meal.id);
                            scheduleCommit(grid, meals, domingoNote, hydration, newDomingoV2Grid, domingoV2Note, domingoV2Hydration);
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
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider block mb-1.5">
                    Nota / Indicaciones
                  </label>
                  <textarea
                    value={domingoNote}
                    rows={3}
                    onChange={e => {
                      setDomingoNote(e.target.value);
                      setIsDirty(true);
                      scheduleCommit(grid, meals, e.target.value, hydration, domingoV2Grid, domingoV2Note, domingoV2Hydration);
                    }}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all resize-none leading-relaxed"
                    placeholder="Ej: Día de descanso, puede comer más flexible. Evitar excesos. Priorizar proteína en almuerzo..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-500 uppercase tracking-wider block mb-1.5">
                    Hidratación
                  </label>
                  <textarea
                    rows={3}
                    value={hydration}
                    onChange={e => {
                      setHydration(e.target.value);
                      setIsDirty(true);
                      scheduleCommit(grid, meals, domingoNote, e.target.value, domingoV2Grid, domingoV2Note, domingoV2Hydration);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all resize-none overflow-y-auto leading-relaxed"
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
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block mb-1.5">
                    Nota / Observaciones
                  </label>
                  <textarea
                    value={domingoV2Note}
                    rows={3}
                    onChange={e => {
                      setDomingoV2Note(e.target.value);
                      setIsDirty(true);
                      scheduleCommit(grid, meals, domingoNote, hydration, domingoV2Grid, e.target.value, domingoV2Hydration);
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed"
                    placeholder="Observaciones del día..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-500 uppercase tracking-wider block mb-1.5">
                    Hidratación
                  </label>
                  <textarea
                    rows={3}
                    value={domingoV2Hydration}
                    onChange={e => {
                      setDomingoV2Hydration(e.target.value);
                      setIsDirty(true);
                      scheduleCommit(grid, meals, domingoNote, hydration, domingoV2Grid, domingoV2Note, e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all resize-none overflow-y-auto leading-relaxed"
                    placeholder="Ej: 2.5L de agua"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Toggle de modo domingo — acceso rápido bajo el box */}
          <div className="mx-4 mb-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
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

          {/* Footer: hints de uso */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 italic">
              Usa Enter para listar varias opciones por tiempo de comida.
              <Copy className="w-2.5 h-2.5 inline mx-0.5" /> copia el día · <Paintbrush className="w-2.5 h-2.5 inline mx-0.5" /> pega el día copiado · "→ todos" copia desde Lunes a toda la semana.
            </p>
          </div>
        </>
      )}

      {/* Modal importar */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-black text-slate-700">Importar menú editado</span>
              </div>
              <button
                onClick={() => { setImportOpen(false); setImportText(''); setImportErrors([]); setImportSuccess(false); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Tips */}
              <div className="mx-5 mt-4 rounded-xl bg-sky-50 border border-sky-100 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="text-[11px] font-black text-sky-600 uppercase tracking-wide">Antes de pegar, ten en cuenta:</span>
                </div>
                <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-emerald-500 font-black">✓</span> Copia primero el menú para tener la estructura — cambia solo las comidas, sin modificar los títulos de los días ni de los tiempos de comida. Luego pégalo aquí con el mismo formato en que se copió.</p>
                <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-emerald-500 font-black">✓</span> Si el contenido de un tiempo queda vacío, se borrará esa celda.</p>
              </div>

              {/* Textarea */}
              <div className="px-5 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pega aquí el texto editado — Recuerda copiar antes la estructura completa en <span className="text-indigo-400">Copiar Menú</span>
                </label>
                <textarea
                  value={importText}
                  onChange={e => { setImportText(e.target.value); setImportErrors([]); setImportSuccess(false); }}
                  rows={10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none leading-relaxed"
                  placeholder={'Dia: Lunes\nDesayuno Lunes:\nAvena con frutas y yogur\nAlmuerzo Lunes:\nPollo a la plancha con arroz\n\nDia: Martes\nDesayuno Martes:\nHuevos revueltos con tostadas\nAlmuerzo Martes:\n...'}
                />
              </div>

              {/* Errores / éxito */}
              {importErrors.length > 0 && (
                <div className="mx-5 mt-3 mb-1 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-[11px] font-black text-amber-600 mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Se aplicaron los cambios pero hay advertencias:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {importErrors.map((e, i) => (
                      <p key={i} className="text-[11px] text-amber-700">• {e}</p>
                    ))}
                  </div>
                </div>
              )}
              {importSuccess && (
                <div className="mx-5 mt-3 mb-1 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <p className="text-[11px] font-black text-emerald-600">¡Menú importado correctamente!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => { setImportOpen(false); setImportText(''); setImportErrors([]); setImportSuccess(false); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={parseAndApply}
                disabled={!importText.trim()}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  importText.trim()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
