import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, Copy, Paintbrush, Plus, Trash2, Upload, X, Info, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
  // El orden y los nombres de los tiempos de comida vienen de weeklyMenu.lunes
  // (la misma fuente que usan Tabla de Porciones y Menú Semanal), así que un
  // agregar/quitar/reordenar/renombrar hecho en cualquiera de esas dos tablas
  // se refleja aquí. Los ejemplos ya cargados se conservan por id.
  const order = data.weeklyMenu?.lunes?.mealsOrder || DEFAULT_MEAL_ORDER;
  const savedById = new Map((data.exchangeMenu?.meals || []).map(m => [m.id, m]));
  return order.map(id => {
    const saved = savedById.get(id);
    const label = (data.weeklyMenu?.lunes as any)?.[id]?.label || saved?.label || DEFAULT_MEAL_LABELS[id] || id;
    return { id, label, examples: saved?.examples?.length ? [...saved.examples] : ['', ''] };
  });
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
  // Ojito de la sección Nota e Hidratación — si está oculto, la sección no
  // aparece en Vista Previa/PDF. Se lee desde un ref dentro de flush() para no
  // tener que agregar un parámetro más a scheduleCommit en cada uno de sus
  // llamados existentes.
  const [notesVisible, setNotesVisible] = useState(
    menuPreviewData.exchangeMenu?.notesVisible !== false,
  );
  const notesVisibleRef = useRef(notesVisible);
  useEffect(() => { notesVisibleRef.current = notesVisible; });
  const initialNumCols = Math.max(2, Math.max(...initialMeals.map(m => m.examples.length), 0));
  const [columnLabels, setColumnLabels] = useState<string[]>(() => buildInitialColumnLabels(menuPreviewData, initialNumCols));

  // Copiar / pegar columnas (mismo patrón que el Menú Semanal: se copia una
  // opción completa —todos los tiempos de comida— y se pega en otra columna).
  const [copiedColIdx, setCopiedColIdx] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<Record<string, string> | null>(null);

  // Copiar / Pegar todo el menú de intercambio como texto (mismo patrón que
  // el dropdown "Copiar / Pegar" del Menú Semanal).
  const [copyPasteOpen, setCopyPasteOpen] = useState(false);
  const [tableCopied, setTableCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ meals, examples, note, hydration, columnLabels });
  useEffect(() => { latestRef.current = { meals, examples, note, hydration, columnLabels }; });

  // Ref que siempre tiene el menuPreviewData más reciente, para no pisar con
  // datos viejos cambios que hayan llegado de Tabla de Porciones mientras
  // esperamos el debounce (mismo patrón que MenuTablePortionsSec3).
  const menuPreviewDataRef = useRef(menuPreviewData);
  useEffect(() => { menuPreviewDataRef.current = menuPreviewData; });

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

  // Sincroniza los nombres (label) de los tiempos de comida cuando se renombran
  // desde Tabla de Porciones. Agregar/quitar/reordenar ya sincroniza vía remount
  // (key en MenuEditSec3), pero un renombrado puro no cambia esa key.
  const externalLabelsSignature = meals
    .map(m => `${m.id}:${(menuPreviewData.weeklyMenu.lunes as any)[m.id]?.label ?? ''}`)
    .join('|');
  useEffect(() => {
    let changed = false;
    const next = meals.map(m => {
      const freshLabel = (menuPreviewData.weeklyMenu.lunes as any)[m.id]?.label;
      if (freshLabel !== undefined && freshLabel !== m.label) { changed = true; return { ...m, label: freshLabel }; }
      return m;
    });
    if (changed) {
      setMeals(next);
      // A diferencia de Porciones/Semanal (que solo leen weeklyMenu), acá el
      // renombrado también hay que guardarlo en exchangeMenu.meals — si no,
      // Vista Previa/PDF (que lee data.exchangeMenu directamente) queda desactualizada.
      scheduleCommit(next, examples, note, hydration, columnLabels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalLabelsSignature]);

  // Al montar (o remontar por un agregar/quitar/reordenar hecho en Tabla de
  // Porciones), si el orden/nombres canónicos de weeklyMenu.lunes ya no
  // coinciden con lo guardado en exchangeMenu.meals, persiste esa reconciliación
  // de inmediato — si no, el cambio se ve en esta tabla pero no en Vista Previa/PDF
  // hasta que el usuario vuelva a escribir algo acá.
  const didSyncOnMountRef = useRef(false);
  useEffect(() => {
    if (didSyncOnMountRef.current) return;
    didSyncOnMountRef.current = true;
    const saved = menuPreviewData.exchangeMenu?.meals || [];
    const inSync = saved.length === initialMeals.length &&
      saved.every((m, i) => m.id === initialMeals[i].id && m.label === initialMeals[i].label);
    if (!inSync) flush(initialMeals, buildInitialExamples(initialMeals), note, hydration, columnLabels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flush(ms: ExchangeMeal[], ex: Record<string, string[]>, n: string, h: string, cl: string[]) {
    const builtMeals: ExchangeMeal[] = ms.map(m => ({
      id: m.id,
      label: m.label,
      examples: (ex[m.id] || []),
    }));

    // Mantiene el orden y los nombres de los tiempos de comida sincronizados
    // con Tabla de Porciones / Menú Semanal, que también leen weeklyMenu.lunes.
    const base = menuPreviewDataRef.current;
    const newOrder = ms.map(m => m.id);
    const newWeekly = { ...base.weeklyMenu } as any;
    (['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const).forEach(dayKey => {
      const day = { ...newWeekly[dayKey], mealsOrder: newOrder };
      ms.forEach(({ id, label }) => {
        day[id] = day[id] ? { ...day[id], label } : { title: '', label };
      });
      newWeekly[dayKey] = day;
    });
    if (newWeekly.domingoV2) {
      const domingoV2 = { ...newWeekly.domingoV2, mealsOrder: newOrder };
      ms.forEach(({ id, label }) => {
        domingoV2[id] = domingoV2[id] ? { ...domingoV2[id], label } : { title: '', label };
      });
      newWeekly.domingoV2 = domingoV2;
    }

    setMenuPreviewData({
      ...base,
      menuType: 'intercambio',
      weeklyMenu: newWeekly,
      exchangeMenu: { meals: builtMeals, columnLabels: cl, note: n, hydration: h, notesVisible: notesVisibleRef.current },
    });
  }

  function toggleNotesVisible() {
    const next = !notesVisible;
    notesVisibleRef.current = next;
    setNotesVisible(next);
    flush(meals, examples, note, hydration, columnLabels);
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

    // La columna copiada puede desplazarse o desaparecer al eliminar una opción.
    if (copiedColIdx !== null) {
      if (copiedColIdx === colIdx) {
        setCopiedColIdx(null);
        setClipboard(null);
      } else if (copiedColIdx > colIdx) {
        setCopiedColIdx(copiedColIdx - 1);
      }
    }
  }

  function copyColumn(colIdx: number) {
    const snap: Record<string, string> = {};
    meals.forEach(m => { snap[m.id] = (examples[m.id] || [])[colIdx] || ''; });
    setClipboard(snap);
    setCopiedColIdx(colIdx);
  }

  function pasteColumn(dstColIdx: number) {
    if (!clipboard || copiedColIdx === dstColIdx) return;
    const newEx = { ...examples };
    meals.forEach(m => {
      const arr = [...(newEx[m.id] || [])];
      arr[dstColIdx] = clipboard[m.id] || '';
      newEx[m.id] = arr;
    });
    setExamples(newEx);
    scheduleCommit(meals, newEx, note, hydration, columnLabels);
    setTimeout(() => meals.forEach(m => syncRowHeights(m.id)), 0);
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

  function copyTableAsText() {
    const blocks: string[] = [];
    columnLabels.forEach((colLabel, colIdx) => {
      const mealChunks: string[] = [];
      meals.forEach(meal => {
        const content = ((examples[meal.id] || [])[colIdx] || '').trim();
        if (content) {
          mealChunks.push(`${meal.label} ${colLabel}:\n${content}`);
        }
      });
      if (mealChunks.length > 0) {
        blocks.push(`Opcion: ${colLabel}\n${mealChunks.join('\n\n')}`);
      }
    });

    const extras: string[] = [];
    if (note.trim()) extras.push(`Nota:\n${note.trim()}`);
    if (hydration.trim()) extras.push(`Hidratación:\n${hydration.trim()}`);
    if (extras.length > 0) blocks.push(extras.join('\n\n'));

    const text = blocks.join('\n\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setTableCopied(true);
      setTimeout(() => setTableCopied(false), 2000);
    });
  }

  const normStr = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim();

  function parseAndApply() {
    const errors: string[] = [];

    const clonedEx: Record<string, string[]> = {};
    Object.keys(examples).forEach(mId => { clonedEx[mId] = [...(examples[mId] || [])]; });

    // Pre-compute normalized meal labels y de opciones (columnas) — se ignoran vacíos
    const mealNormMap = meals.map(m => ({ id: m.id, norm: normStr(m.label) })).filter(m => m.norm.length > 0);
    const colNormMap = columnLabels.map((label, idx) => ({ idx, norm: normStr(label) })).filter(c => c.norm.length > 0);

    // Trigger 1: línea "opcion" + puntuación opcional + nombre de la opción (ej. "Opcion: Opción 1")
    const matchOptionTrigger = (norm: string): number | null => {
      const m = norm.match(/^opcion\s*:?\s*(.+)/);
      if (!m) return null;
      const rest = m[1].trim();
      const found = colNormMap.find(c => c.norm === rest);
      return found ? found.idx : null;
    };

    // Trigger 2: línea "[tiempo de comida] [nombre de la opción]" (ej. "Desayuno Opción 1:")
    const matchMealOptionTrigger = (norm: string): { mealId: string; colIdx: number } | null => {
      for (const { id, norm: mNorm } of mealNormMap) {
        if (!norm.startsWith(mNorm)) continue;
        const boundary = norm[mNorm.length];
        if (boundary !== undefined && boundary !== ' ') continue;
        const rest = norm.slice(mNorm.length).replace(/^[\s:]+/, '').replace(/[\s:]+$/, '');
        if (!rest) continue;
        const found = colNormMap.find(c => c.norm === rest);
        if (found) return { mealId: id, colIdx: found.idx };
      }
      return null;
    };

    // Trigger 3 y 4: "Nota:" / "Hidratación:" (o "Meta Hidratación:") como encabezados
    const matchNoteTrigger = (norm: string) => /^nota\s*:?\s*$/.test(norm);
    const matchHydrationTrigger = (norm: string) => /^(meta\s+)?hidratacion\s*:?\s*$/.test(norm);

    let currentMealId: string | null = null;
    let currentColIdx: number | null = null;
    let currentField: 'note' | 'hydration' | null = null;
    let contentLines: string[] = [];
    let newNote = note;
    let newHydration = hydration;

    const flushContent = () => {
      const content = contentLines.join('\n').trim();
      if (currentField === 'note') {
        newNote = content;
      } else if (currentField === 'hydration') {
        newHydration = content;
      } else if (currentMealId && currentColIdx !== null) {
        const arr = [...(clonedEx[currentMealId] || [])];
        arr[currentColIdx] = content;
        clonedEx[currentMealId] = arr;
      }
    };

    for (const rawLine of importText.split('\n')) {
      const norm = normStr(rawLine);

      // Trigger tiempo+opción primero (más específico)
      const mealOpt = matchMealOptionTrigger(norm);
      if (mealOpt) {
        flushContent();
        currentMealId = mealOpt.mealId;
        currentColIdx = mealOpt.colIdx;
        currentField = null;
        contentLines = [];
        continue;
      }

      // Trigger de opción (marcador de sección — resetea el contexto sin asignar contenido)
      if (matchOptionTrigger(norm) !== null) {
        flushContent();
        currentMealId = null;
        currentColIdx = null;
        currentField = null;
        contentLines = [];
        continue;
      }

      // Trigger de Nota / Hidratación
      if (matchNoteTrigger(norm)) {
        flushContent();
        currentMealId = null;
        currentColIdx = null;
        currentField = 'note';
        contentLines = [];
        continue;
      }
      if (matchHydrationTrigger(norm)) {
        flushContent();
        currentMealId = null;
        currentColIdx = null;
        currentField = 'hydration';
        contentLines = [];
        continue;
      }

      // Advertencia si la línea parece encabezado de opción pero el nombre no coincide
      const optAttemptMatch = norm.match(/^opcion\s*:?\s*(.+)/);
      if (optAttemptMatch) {
        const rest = optAttemptMatch[1].trim();
        if (!colNormMap.find(c => c.norm === rest)) {
          errors.push(
            `Opción no reconocida: "${rawLine.trim()}". Asegúrate de escribirlo así: Opcion: ${columnLabels[0] || 'Opción 1'} — el nombre debe coincidir exactamente con el de una columna existente.`,
          );
        }
      }

      // Advertencia si la línea parece un trigger tiempo+opción pero la opción no coincide
      for (const { id: _id, norm: mNorm } of mealNormMap) {
        if (!norm.startsWith(mNorm)) continue;
        const boundary = norm[mNorm.length];
        if (boundary !== undefined && boundary !== ' ') break;
        const rest = norm.slice(mNorm.length).replace(/^[\s:]+/, '').replace(/[\s:]+$/, '');
        if (!rest) break;
        if (!colNormMap.find(c => c.norm === rest)) {
          const mealLabel = meals.find(m => normStr(m.label) === mNorm)?.label || mNorm;
          errors.push(
            `Opción no reconocida en "${rawLine.trim()}". Asegúrate de escribirlo así: ${mealLabel} ${columnLabels[0] || 'Opción 1'}: — primero el tiempo de comida y luego el nombre exacto de la opción.`,
          );
        }
        break;
      }

      // Línea de contenido (vacía o con texto) — se acumula aunque haya líneas en blanco
      if ((currentMealId && currentColIdx !== null) || currentField) {
        contentLines.push(rawLine);
      }
    }

    // Vuelca el último bloque acumulado
    flushContent();

    setImportErrors(errors);
    setExamples(clonedEx);
    setNote(newNote);
    setHydration(newHydration);
    scheduleCommit(meals, clonedEx, newNote, newHydration, columnLabels);
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
  }

  function copyMealToAll(mealId: string) {
    const srcVal = (examples[mealId] || [])[0] || '';
    const newEx = { ...examples, [mealId]: new Array(numCols).fill(srcVal) };
    setExamples(newEx);
    scheduleCommit(meals, newEx, note, hydration, columnLabels);
    setTimeout(() => syncRowHeights(mealId), 0);
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Dropdown Copiar / Pegar */}
          <div className="relative">
            <button
              onClick={() => setCopyPasteOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white text-slate-500 border-slate-200 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
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
                      tableCopied
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    {tableCopied ? '¡Copiado!' : 'Copiar Menú'}
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setImportOpen(true);
                      setImportErrors([]);
                      setImportSuccess(false);
                      setCopyPasteOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                    Pegar en Menú
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-slate-500 border-slate-200 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
          >
            <Plus className="w-3 h-3" />
            Agregar opción
          </button>
        </div>
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
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => copyColumn(i)}
                            title={`Copiar ${columnLabels[i] ?? `Opción ${i + 1}`}`}
                            className={`p-1 rounded-lg transition-all ${
                              copiedColIdx === i
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'hover:bg-indigo-100 text-slate-400 hover:text-indigo-600'
                            }`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => pasteColumn(i)}
                            title="Pegar opción copiada"
                            disabled={!clipboard || copiedColIdx === i}
                            className={`p-1 rounded-lg transition-all ${
                              clipboard && copiedColIdx !== i
                                ? 'hover:bg-emerald-100 text-slate-400 hover:text-emerald-600'
                                : 'text-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Paintbrush className="w-3 h-3" />
                          </button>
                          {numCols > 1 && (
                            <button
                              onClick={() => removeColumn(i)}
                              title="Eliminar esta opción"
                              className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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
                        <div className="space-y-1 min-w-0">
                          <input
                            value={meal.label}
                            onChange={e => updateMealLabel(meal.id, e.target.value)}
                            title="Editar nombre del tiempo de comida"
                            className="text-[10px] font-black text-slate-600 uppercase leading-tight block w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none transition-colors"
                          />
                          <button
                            onClick={() => copyMealToAll(meal.id)}
                            title="Copiar desde Opción 1 a todas las opciones"
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
                          >
                            <Copy className="w-2.5 h-2.5" />→ todos
                          </button>
                        </div>
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
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Nota e Hidratación</span>
              <button
                type="button"
                onClick={toggleNotesVisible}
                title={notesVisible ? 'Ocultar en vista previa' : 'Mostrar en vista previa'}
                className="p-1 rounded-lg hover:bg-white transition-colors"
              >
                {notesVisible ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>
            </div>
            <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${notesVisible ? '' : 'opacity-50'}`}>
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
            {!notesVisible && (
              <p className="px-4 pb-3 text-[10px] text-slate-400 italic">
                Esta sección está oculta — no se mostrará en Vista Previa ni en el PDF.
              </p>
            )}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 italic">
              Cada columna es una opción de comida por tiempo. Usa Enter para listar varios alimentos dentro de una opción.{' '}
              <Copy className="w-2.5 h-2.5 inline mx-0.5" /> copia la opción ·{' '}
              <Paintbrush className="w-2.5 h-2.5 inline mx-0.5" /> pega la opción copiada · "→ todos" copia la Opción 1 a todas las opciones de ese tiempo · "Copiar / Pegar" (arriba) copia todo el menú, incluida la Nota y la Meta Hidratación.
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
                <Upload className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-black text-slate-700">
                  Importar menú de intercambio editado
                </span>
              </div>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportText('');
                  setImportErrors([]);
                  setImportSuccess(false);
                }}
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
                  <span className="text-[11px] font-black text-sky-600 uppercase tracking-wide">
                    Antes de pegar, ten en cuenta:
                  </span>
                </div>
                <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5">
                  <span className="text-emerald-500 font-black">✓</span> Copia
                  primero el menú para tener la estructura, cambia solo los
                  alimentos de cada opción, sin modificar los títulos de las
                  opciones ni de los tiempos de comida. Luego pégalo aquí con
                  el mismo formato en que se copió.
                </p>
                <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5">
                  <span className="text-emerald-500 font-black">✓</span> Si el
                  contenido de una opción queda vacío, se borrará esa celda.
                </p>
                <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5">
                  <span className="text-emerald-500 font-black">✓</span> Cada
                  nombre de tiempo de comida y cada nombre de opción (primera
                  fila) debe ser único, si hay dos con el mismo nombre no
                  sabremos cuál es cuál y se pueden mezclar sin querer.
                </p>
                <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5">
                  <span className="text-emerald-500 font-black">✓</span> La
                  Nota y la Meta Hidratación también se copian y se pueden
                  editar — respeta los encabezados "Nota:" e "Hidratación:".
                </p>
              </div>

              {/* Textarea */}
              <div className="px-5 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pega aquí el texto editado. Recuerda copiar antes la
                  estructura completa en{' '}
                  <span className="text-indigo-400">Copiar Menú</span>
                </label>
                <textarea
                  value={importText}
                  onChange={e => {
                    setImportText(e.target.value);
                    setImportErrors([]);
                    setImportSuccess(false);
                  }}
                  rows={10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed"
                  placeholder={
                    'Opcion: Opción 1\nDesayuno Opción 1:\nAvena con frutas y yogur\nAlmuerzo Opción 1:\nPollo a la plancha con arroz\n\nOpcion: Opción 2\nDesayuno Opción 2:\nHuevos revueltos con tostadas\nAlmuerzo Opción 2:\n...\n\nNota:\nIndicaciones generales...\n\nHidratación:\n2.5L de agua'
                  }
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
                      <p key={i} className="text-[11px] text-amber-700">
                        • {e}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {importSuccess && (
                <div className="mx-5 mt-3 mb-1 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <p className="text-[11px] font-black text-emerald-600">
                    ¡Menú de intercambio importado correctamente!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportText('');
                  setImportErrors([]);
                  setImportSuccess(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={parseAndApply}
                disabled={!importText.trim()}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  importText.trim()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
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
