import React, { useEffect, useState } from "react";
import {
  FileText, Plus, Trash2, Eye, Save, X,
  ChevronLeft, ChevronRight, History,
} from "lucide-react";
import { MenuPlanData } from "./MenuDesignTemplates";
import { MenuPreview } from "./MenuPreview";
import { MenuHistory } from "./MenuHistory";
import {
  MenuReferenceRecord,
  MenuReferenceData,
  ExchangeReferenceData,
  emptyExchangeReferenceData,
  MealPortions,
  MealSlot,
  MealLabel,
  WeekDayKey,
  MEAL_LABEL_OPTIONS,
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
  calcPortionsTotal,
  emptyReferenceData,
  newMealSlot,
  defaultMealSlots,
  emptyMealPortions,
} from "./Menu_References_Components/MenuReferencesStorage";
import { ExchangeMeal } from "./menudesigntemplates_components/menuTemplateTypes";
import { MenuReferenceDataToMenuPlanData } from "./Menu_References_Components/MenuReferenceParsertoMenuData";
import { store } from "../../services/store";
import { GeneratedMenu, Patient } from "../../types";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PORTION_GROUPS: { key: keyof MealPortions; label: string }[] = [
  { key: "lacteos",   label: "Lácteos"   },
  { key: "vegetales", label: "Vegetales" },
  { key: "frutas",    label: "Frutas"    },
  { key: "cereales",  label: "Cereales"  },
  { key: "carnes",    label: "Carnes"    },
  { key: "grasas",    label: "Grasas"    },
];

const LABEL_COLORS: Record<MealLabel, string> = {
  Desayuno:  "bg-amber-50  text-amber-700  border-amber-200",
  Refacción: "bg-sky-50    text-sky-700    border-sky-200",
  Almuerzo:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cena:      "bg-indigo-50 text-indigo-700 border-indigo-200",
};

// ─── Portions Table (dynamic slots) ───────────────────────────────────────────

const PortionsTable: React.FC<{
  meals:      MealSlot[];
  readOnly?:  boolean;
  onChangePortions: (slotId: string, group: keyof MealPortions, value: number) => void;
  onChangeLabel:    (slotId: string, label: MealLabel) => void;
  onAddSlot:        () => void;
  onRemoveSlot:     (slotId: string) => void;
}> = ({ meals, readOnly, onChangePortions, onChangeLabel, onAddSlot, onRemoveSlot }) => {
  const totals = calcPortionsTotal(meals);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-44">
              Tiempo
            </th>
            {PORTION_GROUPS.map(g => (
              <th key={g.key} className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {g.label}
              </th>
            ))}
            {!readOnly && (
              <th className="px-2 py-3 w-8" />
            )}
          </tr>
        </thead>
        <tbody>
          {meals.map((slot, i) => (
            <tr key={slot.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
              <td className="px-3 py-2">
                {readOnly ? (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${LABEL_COLORS[slot.label]}`}>
                    {slot.label}
                  </span>
                ) : (
                  <select
                    value={slot.label}
                    onChange={e => onChangeLabel(slot.id, e.target.value as MealLabel)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer ${LABEL_COLORS[slot.label]}`}
                  >
                    {MEAL_LABEL_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </td>

              {PORTION_GROUPS.map(g => (
                <td key={g.key} className="px-3 py-2 text-center">
                  {readOnly ? (
                    <span className="font-bold text-slate-700">
                      {slot.portions[g.key] > 0 ? slot.portions[g.key] : "—"}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={slot.portions[g.key] || ""}
                      onChange={e => onChangePortions(slot.id, g.key, Number(e.target.value) || 0)}
                      className="w-14 text-center bg-white border border-slate-200 rounded-lg px-1 py-1 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="0"
                    />
                  )}
                </td>
              ))}

              {!readOnly && (
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onRemoveSlot(slot.id)}
                    disabled={meals.length <= 1}
                    className="p-1 text-slate-300 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Eliminar tiempo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}

          <tr className="bg-emerald-50 border-t-2 border-emerald-200">
            <td className="px-4 py-2.5 font-extrabold text-emerald-700 text-xs uppercase">
              Total
            </td>
            {PORTION_GROUPS.map(g => (
              <td key={g.key} className="px-3 py-2 text-center font-extrabold text-emerald-700">
                {totals[g.key]}
              </td>
            ))}
            {!readOnly && <td />}
          </tr>
        </tbody>
      </table>

      {!readOnly && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onAddSlot}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar tiempo de comida
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Weekly Menu Editor ────────────────────────────────────────────────────────

const WeeklyMenuEditor: React.FC<{
  meals:      MealSlot[];
  weeklyMenu: MenuReferenceData["weeklyMenu"];
  hydration:  string;
  readOnly?:  boolean;
  onChangeMealText:   (day: WeekDayKey | 'domingoV2', slotId: string, value: string) => void;
  onChangeDomingoNote:(value: string) => void;
  onHydrationChange:  (value: string) => void;
}> = ({ meals, weeklyMenu, hydration, readOnly, onChangeMealText, onChangeDomingoNote, onHydrationChange }) => {
  const ALL_TABS = [...WEEKDAY_KEYS, "domingo", "domingoV2"] as const;
  type TabKey = typeof ALL_TABS[number];
  const [activeTab, setActiveTab] = useState<TabKey>("lunes");

  const TAB_LABELS: Record<TabKey, string> = {
    ...WEEKDAY_LABELS,
    domingo: "Dom V1",
    domingoV2: "Dom V2"
  };
  const currentIndex = ALL_TABS.indexOf(activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab(ALL_TABS[Math.max(0, currentIndex - 1)])}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-1 flex-wrap flex-1">
          {ALL_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? tab.startsWith("domingo") ? "bg-slate-800 text-white" : "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveTab(ALL_TABS[Math.min(ALL_TABS.length - 1, currentIndex + 1)])}
          disabled={currentIndex === ALL_TABS.length - 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in duration-200">
        {activeTab === "domingo" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Nota del Domingo (Día libre / Observaciones)
              </label>
              <textarea
                value={weeklyMenu.domingo.note}
                onChange={e => onChangeDomingoNote(e.target.value)}
                readOnly={readOnly}
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-slate-500/20 outline-none transition-all resize-none font-medium"
                placeholder="Día libre / Observaciones..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Meta de Hidratación (aplica toda la semana)
              </label>
              <input
                type="text"
                value={hydration}
                onChange={e => onHydrationChange(e.target.value)}
                readOnly={readOnly}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-500/20 outline-none transition-all"
                placeholder="Ej: 2.5L Agua/Día"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">
              {TAB_LABELS[activeTab]}
            </h4>

            {meals.length === 0 && (
              <p className="text-sm text-slate-400 italic">
                Agrega tiempos de comida en la sección de porciones primero.
              </p>
            )}

            {meals.map(slot => (
              <div key={slot.id} className="space-y-1.5">
                <label className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${LABEL_COLORS[slot.label]}`}>
                  {slot.label}
                </label>
                <textarea
                  value={(weeklyMenu[activeTab as WeekDayKey | 'domingoV2'] as Record<string, string>)?.[slot.id] ?? ""}
                  onChange={e => onChangeMealText(activeTab as WeekDayKey | 'domingoV2', slot.id, e.target.value)}
                  readOnly={readOnly}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none font-medium"
                  placeholder={`Descripción de ${slot.label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── YAML Importer ─────────────────────────────────────────────────────────────

function parseYamlToReferenceData(yaml: string): MenuReferenceData {
  const lines = yaml.split('\n');

  const get = (key: string): string => {
    const line = lines.find(l => l.trim().startsWith(key + ':'));
    return line ? line.split(':').slice(1).join(':').trim() : '';
  };

  const kcal = parseInt(get('KCAL')) || 0;
  const type = (get('TYPE') as any) || 'SEMANAL';

  const SLOT_MAP: Record<string, { id: string; label: MealLabel }> = {
    desayuno:  { id: 'slot_desayuno',   label: 'Desayuno'  },
    refManana: { id: 'slot_refaccion1', label: 'Refacción' },
    almuerzo:  { id: 'slot_almuerzo',   label: 'Almuerzo'  },
    refTarde:  { id: 'slot_refaccion2', label: 'Refacción' },
    cena:      { id: 'slot_cena',       label: 'Cena'      },
  };

  const porcSection = yaml.match(/PORCIONES_POR_TIEMPO:([\s\S]*?)(?=\nWEEKLY_MENU:|\nNOTAS:)/)?.[1] ?? '';
  const meals: MealSlot[] = Object.entries(SLOT_MAP).map(([yamlKey, { id, label }]) => {
    const blockRe = new RegExp(`${yamlKey}:\\s*\\n((?:  [^\\n]+\\n?)*)`, 'g');
    const block = blockRe.exec(porcSection)?.[1] ?? '';
    const num = (k: string) => {
      const m = block.match(new RegExp(`\\s+${k}:\\s*(\\d+)`));
      return m ? parseInt(m[1]) : 0;
    };
    return {
      id, label,
      portions: {
        lacteos: num('lacteos'), vegetales: num('vegetales'), frutas: num('frutas'),
        cereales: num('cereales'), carnes: num('carnes'), grasas: num('grasas'),
      },
    };
  });

  const weeklySection = yaml.match(/WEEKLY_MENU:([\s\S]*?)(?=\nNOTAS:|\s*$)/)?.[1] ?? '';
  const weekDays: (WeekDayKey | 'domingoV2')[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingoV2'];
  const weeklyMenu: any = { domingo: { note: '' } };

  weekDays.forEach(day => {
    const dayBlockRe = new RegExp(`^${day}:\\n((?:  [^\\n]*\\n?)*)`, 'm');
    const dayBlock = dayBlockRe.exec(weeklySection)?.[1] ?? '';
    const dayMenu: Record<string, string> = {};

    Object.entries(SLOT_MAP).forEach(([yamlKey, { id }]) => {
      const mealRe = new RegExp(`  ${yamlKey}:\\s*\\|\\n((?:    [^\\n]*\\n?)*)`, 'g');
      const mealMatch = mealRe.exec(dayBlock);
      if (mealMatch) {
        dayMenu[id] = mealMatch[1]
          .split('\n')
          .map(l => l.replace(/^    /, '').trimEnd())
          .filter((l, i, arr) => !(i === arr.length - 1 && l === ''))
          .join('\n');
      } else {
        dayMenu[id] = '';
      }
    });
    weeklyMenu[day] = dayMenu;
  });

  const domBlockRe = /^domingo:\n((?:  [^\n]*\n?)*)/m;
  const domBlock = domBlockRe.exec(weeklySection)?.[1] ?? '';
  const noteMatch = /  note:\s*\|\n((?:    [^\n]*\n?)*)/.exec(domBlock);
  if (noteMatch) {
    weeklyMenu.domingo.note = noteMatch[1]
      .split('\n').map(l => l.replace(/^    /, '').trimEnd())
      .filter((l, i, arr) => !(i === arr.length - 1 && l === ''))
      .join('\n');
  }

  const hydroMatch = /hydration:\s*\|\n((?:    [^\n]*\n?)*)/.exec(domBlock);
  const hydration = hydroMatch
    ? hydroMatch[1].split('\n').map(l => l.replace(/^    /, '').trimEnd()).join('').trim()
    : '2.5L Agua/Día';

  return { kcal, type, meals, weeklyMenu, hydration };
}

// ─── Exchange Reference Editor ─────────────────────────────────────────────────

const ExchangeRefEditor: React.FC<{
  initialData: ExchangeReferenceData;
  readOnly?:   boolean;
  editingId:   string | null;
  onSave:      (data: ExchangeReferenceData) => Promise<void>;
}> = ({ initialData, readOnly, editingId, onSave }) => {
  const [name, setName]           = useState(initialData.name || '');
  const [portions, setPortions]   = useState<MealSlot[]>(initialData.portions || defaultMealSlots());
  const [meals, setMeals]         = useState<ExchangeMeal[]>(initialData.exchangeMenu.meals || []);
  const [columnLabels, setColumnLabels] = useState<string[]>(
    initialData.exchangeMenu.columnLabels?.length
      ? initialData.exchangeMenu.columnLabels
      : ['Opción 1', 'Opción 2']
  );
  const [note, setNote]           = useState(initialData.exchangeMenu.note || '');
  const [hydration, setHydration] = useState(initialData.exchangeMenu.hydration || '');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving]   = useState(false);

  // ── Portions handlers ─────────────────────────────────────────────────────
  const handleAddPortionSlot = () => {
    setPortions(prev => [...prev, newMealSlot('Refacción')]);
  };

  const handleRemovePortionSlot = (slotId: string) => {
    setPortions(prev => prev.filter(s => s.id !== slotId));
  };

  const handleChangePortionLabel = (slotId: string, label: MealLabel) => {
    setPortions(prev => prev.map(s => s.id === slotId ? { ...s, label } : s));
  };

  const handleChangePortions = (slotId: string, group: keyof MealPortions, value: number) => {
    setPortions(prev => prev.map(s =>
      s.id === slotId ? { ...s, portions: { ...s.portions, [group]: value } } : s
    ));
  };

  const numCols = columnLabels.length;

  const getCell = (mealId: string, colIdx: number) =>
    (meals.find(m => m.id === mealId)?.examples || [])[colIdx] || '';

  const updateCell = (mealId: string, colIdx: number, value: string) => {
    setMeals(prev => prev.map(m =>
      m.id === mealId
        ? { ...m, examples: m.examples.map((e, i) => i === colIdx ? value : e) }
        : m
    ));
  };

  const updateMealLabel = (id: string, label: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, label } : m));
  };

  const addMeal = () => {
    const id = `exch_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    setMeals(prev => [...prev, { id, label: 'Nuevo tiempo', examples: Array(numCols).fill('') }]);
  };

  const removeMeal = (id: string) => {
    if (meals.length <= 1) return;
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const addColumn = () => {
    setColumnLabels(prev => [...prev, `Opción ${prev.length + 1}`]);
    setMeals(prev => prev.map(m => ({ ...m, examples: [...m.examples, ''] })));
  };

  const removeColumn = (colIdx: number) => {
    if (numCols <= 1) return;
    setColumnLabels(prev => prev.filter((_, i) => i !== colIdx));
    setMeals(prev => prev.map(m => ({ ...m, examples: m.examples.filter((_, i) => i !== colIdx) })));
  };

  const updateColumnLabel = (idx: number, label: string) => {
    setColumnLabels(prev => prev.map((l, i) => i === idx ? label : l));
  };

  const handleSave = async () => {
    setSaveError('');
    if (!name.trim()) { setSaveError('Ingresa un nombre para la plantilla.'); return; }
    if (meals.length === 0) { setSaveError('Agrega al menos un tiempo de comida en la tabla de intercambio.'); return; }
    setIsSaving(true);
    try {
      await onSave({
        kcal: 0,
        type: 'INTERCAMBIO',
        name: name.trim(),
        portions,
        exchangeMenu: { meals, columnLabels, note, hydration },
      });
    } catch {
      setSaveError('Error al guardar la plantilla.');
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : (editingId ? 'Actualizar plantilla' : 'Guardar plantilla')}
          </button>
        )}
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">⚠️ {saveError}</p>
        )}
        {readOnly && (
          <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1.5 rounded-lg">Solo lectura</span>
        )}
      </div>

      {/* 1. Nombre */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">1. Nombre de la Plantilla</h4>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          readOnly={readOnly}
          placeholder="Ej: Intercambio 1800 kcal — Pérdida de peso"
          className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
        />
      </div>

      {/* 2. Porciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">2. Porciones por Tiempo de Comida</h4>
          {!readOnly && (
            <span className="text-[10px] text-slate-400 font-medium">
              Usa el dropdown de cada fila para cambiar la etiqueta
            </span>
          )}
        </div>
        <PortionsTable
          meals={portions}
          readOnly={readOnly}
          onChangePortions={handleChangePortions}
          onChangeLabel={handleChangePortionLabel}
          onAddSlot={handleAddPortionSlot}
          onRemoveSlot={handleRemovePortionSlot}
        />
      </div>

      {/* 3. Tabla de Intercambio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">3. Tabla de Intercambio</h4>
          {!readOnly && (
            <button
              onClick={addColumn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            >
              <Plus className="w-3 h-3" /> Agregar opción
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="border-collapse" style={{ minWidth: 400, width: '100%' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider w-36">
                  Tiempo
                </th>
                {columnLabels.map((label, i) => (
                  <th key={i} className="px-2 py-3 text-[10px] font-black text-slate-600 uppercase" style={{ minWidth: 180 }}>
                    <div className="flex items-center justify-between gap-1">
                      {readOnly ? (
                        <span className="tracking-wider">{label}</span>
                      ) : (
                        <input
                          value={label}
                          onChange={e => updateColumnLabel(i, e.target.value)}
                          className="text-[10px] font-black text-slate-600 uppercase tracking-wider bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none transition-colors min-w-0 flex-1"
                        />
                      )}
                      {!readOnly && numCols > 1 && (
                        <button
                          onClick={() => removeColumn(i)}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {!readOnly && <th className="w-8" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meals.map(meal => (
                <tr key={meal.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-3 py-2 align-top">
                    {readOnly ? (
                      <span className="text-xs font-black text-slate-600 uppercase">{meal.label}</span>
                    ) : (
                      <input
                        value={meal.label}
                        onChange={e => updateMealLabel(meal.id, e.target.value)}
                        className="text-xs font-black text-slate-600 uppercase w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none transition-colors"
                      />
                    )}
                  </td>
                  {columnLabels.map((_, j) => (
                    <td key={j} className="px-1.5 py-1.5 align-top">
                      <textarea
                        value={getCell(meal.id, j)}
                        onChange={e => updateCell(meal.id, j, e.target.value)}
                        readOnly={readOnly}
                        rows={3}
                        placeholder="Ej: 2 huevos, 1 tortilla..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed"
                      />
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-2 py-2 align-middle text-center">
                      <button
                        onClick={() => removeMeal(meal.id)}
                        disabled={meals.length <= 1}
                        className="p-1.5 text-slate-300 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <button
            onClick={addMeal}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar tiempo de comida
          </button>
        )}
      </div>

      {/* 4. Nota e Hidratación */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">4. Nota e Hidratación</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nota / Indicaciones</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder="Indicaciones generales del plan de intercambio..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-500 uppercase">Meta Hidratación</label>
            <textarea
              value={hydration}
              onChange={e => setHydration(e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder="Ej: 2.5L de agua al día"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

type Mode = "LIST" | "EDITOR";
type RefTab = "SEMANAL" | "INTERCAMBIO";

export const MenuReferences: React.FC<{ hideHeader?: boolean; hideContainer?: boolean }> = ({ hideHeader, hideContainer }) => {
  const items = store.menuReferences;

  const [activeRefTab, setActiveRefTab]   = useState<RefTab>("SEMANAL");
  const [mode, setMode]                   = useState<Mode>("LIST");
  const [viewing, setViewing]             = useState<MenuReferenceRecord | null>(null);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [formData, setFormData]           = useState<MenuReferenceData>(emptyReferenceData());
  const [exchangeFormData, setExchangeFormData] = useState<ExchangeReferenceData>(emptyExchangeReferenceData());
  const [previewPlan, setPreviewPlan]     = useState<MenuPlanData | null>(null);
  const [saveError, setSaveError]         = useState("");
  const [showImport, setShowImport]       = useState(false);
  const [yamlText, setYamlText]           = useState("");
  const [importError, setImportError]     = useState("");
  const [importOk, setImportOk]           = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError]     = useState("");
  const [isImportFromMenuOpen, setIsImportFromMenuOpen] = useState(false);
  const [isImportExchangeFromMenuOpen, setIsImportExchangeFromMenuOpen] = useState(false);
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 10;

  const isExchange = (r: MenuReferenceRecord) => (r.data as any)?.type === "INTERCAMBIO";

  const mapToMealLabel = (raw: string): MealLabel => {
    const lower = (raw || '').toLowerCase();
    if (lower.includes('desayuno')) return 'Desayuno';
    if (lower.includes('almuerzo')) return 'Almuerzo';
    if (lower.includes('cena')) return 'Cena';
    return 'Refacción';
  };

  const handleAddAsReference = async (menu: GeneratedMenu, patient: Patient): Promise<void> => {
    const plan = menu.menuData as MenuPlanData;
    if (!plan) throw new Error('No menuData');

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

    const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ');
    const evaluationDate = menu.linkedEvaluationId
      ? store.getEvaluationById(menu.linkedEvaluationId)?.date
      : undefined;

    const refData: MenuReferenceData = {
      kcal:           (plan as any).kcal || menu.kcalToWork || 0,
      type:           'SEMANAL',
      meals,
      weeklyMenu:     refWeeklyMenu,
      hydration:      (plan.weeklyMenu as any)?.domingo?.hydration || '2.5L Agua/Día',
      patientName:    patientName || undefined,
      evaluationDate: evaluationDate || undefined,
      age:            menu.age         ?? (plan as any)?.patient?.age      ?? undefined,
      weightKg:       menu.weightKg    ?? (plan as any)?.patient?.weight   ?? undefined,
      heightCm:       menu.heightCm    ?? (plan as any)?.patient?.height   ?? undefined,
      fatPct:         (plan as any)?.patient?.fatPct ?? undefined,
    };

    await store.saveMenuReference({ data: refData, kcal: refData.kcal, type: refData.type });
  };

  const handleAddExchangeAsReference = async (menu: GeneratedMenu, patient: Patient): Promise<void> => {
    const plan = menu.menuData as MenuPlanData;
    if (!plan) throw new Error('No menuData');
    if (!plan.exchangeMenu) throw new Error('No exchange menu data');

    const lunesData = (plan.weeklyMenu as any)?.lunes;
    const mealsOrder: string[] = lunesData?.mealsOrder || Object.keys((plan.portions as any)?.byMeal || {});

    const portions: MealSlot[] = mealsOrder.map((slotId: string) => {
      const mealInfo = lunesData?.[slotId];
      const rawLabel = mealInfo?.label || slotId;
      const mealPortions = (plan.portions as any)?.byMeal?.[slotId] || emptyMealPortions();
      return { id: slotId, label: mapToMealLabel(rawLabel), portions: mealPortions };
    });

    const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ');
    const evaluationDate = menu.linkedEvaluationId
      ? store.getEvaluationById(menu.linkedEvaluationId)?.date
      : undefined;

    const refData: ExchangeReferenceData = {
      kcal:           (plan as any).kcal || menu.kcalToWork || 0,
      type:           'INTERCAMBIO',
      name:           menu.name || (patientName ? `Intercambio - ${patientName}` : 'Intercambio'),
      portions:       portions.length > 0 ? portions : defaultMealSlots(),
      exchangeMenu:   plan.exchangeMenu,
      patientName:    patientName || undefined,
      evaluationDate: evaluationDate || undefined,
    };

    await store.saveMenuReference({ data: refData as any, kcal: 0, type: 'INTERCAMBIO' });
  };

  const handleImport = async () => {
    setImportError("");
    setImportOk(false);
    try {
      const data = parseYamlToReferenceData(yamlText);
      if (!data.kcal) throw new Error("No se encontró KCAL válido en el YAML.");
      await store.saveMenuReference({ data: data, kcal: data.kcal, type: data.type });
      setImportOk(true);
      setYamlText("");
      setTimeout(() => { setShowImport(false); setImportOk(false); }, 1500);
    } catch (e: any) {
      setImportError(e.message || "Error al parsear el YAML.");
    }
  };

  const isReadOnly = !!viewing;

  // Filter by active tab
  const sortedItems = [...items]
    .filter(r => activeRefTab === "INTERCAMBIO" ? isExchange(r) : !isExchange(r))
    .sort((a, b) => {
      if ((a.data as any).kcal !== (b.data as any).kcal) return (a.data as any).kcal - (b.data as any).kcal;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  const totalPages  = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageItems   = sortedItems.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const switchTab = (tab: RefTab) => {
    setActiveRefTab(tab);
    setMode("LIST");
    setViewing(null);
    setEditingId(null);
    setPreviewPlan(null);
    setSaveError("");
    setPage(1);
  };

  const openNew = () => {
    setViewing(null);
    setEditingId(null);
    setPreviewPlan(null);
    setSaveError("");
    if (activeRefTab === "INTERCAMBIO") {
      setExchangeFormData(emptyExchangeReferenceData());
    } else {
      setFormData(emptyReferenceData());
    }
    setMode("EDITOR");
  };

  const openView = (record: MenuReferenceRecord) => {
    setViewing(record);
    setPreviewPlan(null);
    setSaveError("");
    if (isExchange(record)) {
      setExchangeFormData(record.data as ExchangeReferenceData);
    } else {
      setFormData(record.data as MenuReferenceData);
      try { setPreviewPlan(MenuReferenceDataToMenuPlanData(record.data as MenuReferenceData)); }
      catch { setPreviewPlan(null); }
    }
    setMode("EDITOR");
  };

  const openEdit = (record: MenuReferenceRecord) => {
    setViewing(null);
    setPreviewPlan(null);
    setSaveError("");
    setEditingId(record.id);
    if (isExchange(record)) {
      setExchangeFormData(record.data as ExchangeReferenceData);
    } else {
      setFormData(record.data as MenuReferenceData);
    }
    setMode("EDITOR");
  };

  const backToList = () => {
    setMode("LIST");
    setViewing(null);
    setEditingId(null);
    setPreviewPlan(null);
    setSaveError("");
  };

  // ── Slot management (SEMANAL) ───────────────────────────────────────────────

  const handleAddSlot = () => {
    const slot = newMealSlot('Refacción');
    setFormData(prev => {
      const meals = [...prev.meals, slot];
      const weeklyMenu = { ...prev.weeklyMenu } as any;
      WEEKDAY_KEYS.forEach(dk => { weeklyMenu[dk] = { ...weeklyMenu[dk], [slot.id]: '' }; });
      if (weeklyMenu.domingoV2) weeklyMenu.domingoV2 = { ...weeklyMenu.domingoV2, [slot.id]: '' };
      return { ...prev, meals, weeklyMenu };
    });
  };

  const handleRemoveSlot = (slotId: string) => {
    setFormData(prev => {
      const meals = prev.meals.filter(s => s.id !== slotId);
      const weeklyMenu = { ...prev.weeklyMenu } as any;
      WEEKDAY_KEYS.forEach(dk => {
        const day = { ...weeklyMenu[dk] };
        delete day[slotId];
        weeklyMenu[dk] = day;
      });
      if (weeklyMenu.domingoV2) {
        const domV2 = { ...weeklyMenu.domingoV2 };
        delete domV2[slotId];
        weeklyMenu.domingoV2 = domV2;
      }
      return { ...prev, meals, weeklyMenu };
    });
  };

  const handleChangeLabel = (slotId: string, label: MealLabel) => {
    setFormData(prev => ({ ...prev, meals: prev.meals.map(s => s.id === slotId ? { ...s, label } : s) }));
  };

  const handleChangePortions = (slotId: string, group: keyof MealPortions, value: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map(s => s.id === slotId ? { ...s, portions: { ...s.portions, [group]: value } } : s),
    }));
  };

  const handleChangeMealText = (day: WeekDayKey | 'domingoV2', slotId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      weeklyMenu: { ...prev.weeklyMenu, [day]: { ...(prev.weeklyMenu[day] as Record<string, string>), [slotId]: value } },
    }));
  };

  const handleChangeDomingoNote = (value: string) => {
    setFormData(prev => ({ ...prev, weeklyMenu: { ...prev.weeklyMenu, domingo: { note: value } } }));
  };

  // ── Preview & Save (SEMANAL) ────────────────────────────────────────────────

  const handlePreview = () => {
    try { setPreviewPlan(MenuReferenceDataToMenuPlanData(formData)); setSaveError(""); }
    catch (e: any) { setSaveError(e?.message || "Error al generar preview."); }
  };

  const handleSave = async () => {
    setSaveError("");
    if (!formData.kcal || formData.kcal < 800) { setSaveError("Las kcal deben ser mayores a 800."); return; }
    if (formData.meals.length === 0) { setSaveError("Agrega al menos un tiempo de comida."); return; }
    try {
      await store.saveMenuReference({ id: editingId || undefined, data: formData, kcal: formData.kcal, type: formData.type });
      backToList();
    } catch {
      setSaveError("Error al guardar la referencia.");
    }
  };

  const handleSaveExchange = async (data: ExchangeReferenceData) => {
    await store.saveMenuReference({ id: editingId || undefined, data: data as any, kcal: 0, type: 'INTERCAMBIO' });
    backToList();
  };

  const handleDelete = (id: string) => { setConfirmDeleteId(id); };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await store.deleteMenuReference(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch {
      setDeleteError("Error al eliminar la referencia.");
      setTimeout(() => setDeleteError(""), 3000);
    }
  };

  // ── Tab switcher UI ─────────────────────────────────────────────────────────

  const TabSwitcher = () => (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
      {(["SEMANAL", "INTERCAMBIO"] as RefTab[]).map(tab => (
        <button
          key={tab}
          onClick={() => switchTab(tab)}
          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeRefTab === tab
              ? tab === "INTERCAMBIO"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab === "SEMANAL" ? "Menú Semanal" : "Menú Intercambio"}
        </button>
      ))}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>

      {/* Modal: importar desde menú existente (solo SEMANAL) */}
      {isImportFromMenuOpen && activeRefTab === "SEMANAL" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Agregar Referencia desde Menú Existente</h3>
                  <p className="text-sm text-slate-500">Selecciona un menú semanal del historial para guardarlo como plantilla de referencia (Hoja 1)</p>
                </div>
              </div>
              <button onClick={() => setIsImportFromMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MenuHistory onAddAsReference={handleAddAsReference} filterType="semanal" />
            </div>
          </div>
        </div>
      )}

      {/* Modal: importar desde menú existente (solo INTERCAMBIO) */}
      {isImportExchangeFromMenuOpen && activeRefTab === "INTERCAMBIO" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  <History className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Agregar Plantilla desde Historial de Intercambio</h3>
                  <p className="text-sm text-slate-500">Selecciona un menú de intercambio del historial para guardarlo como plantilla de referencia</p>
                </div>
              </div>
              <button onClick={() => setIsImportExchangeFromMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MenuHistory onAddAsReference={handleAddExchangeAsReference} filterType="intercambio" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900">Eliminar referencia</h3>
              </div>
              <button onClick={() => setConfirmDeleteId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600">¿Estás seguro de que deseas eliminar esta referencia? Esta acción no se puede deshacer.</p>
              {deleteError && <p className="mt-2 text-xs font-bold text-red-500">{deleteError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YAML Import Modal (solo SEMANAL) */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Importar referencia desde YAML</h3>
              <button onClick={() => { setShowImport(false); setYamlText(""); setImportError(""); setImportOk(false); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Pega el YAML de tu referencia. Se convertirá automáticamente al nuevo formato.</p>
            <textarea
              value={yamlText}
              onChange={e => { setYamlText(e.target.value); setImportError(""); setImportOk(false); }}
              rows={16}
              className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              placeholder="KCAL: 1665&#10;TYPE: SEMANAL&#10;..."
            />
            {importError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">⚠️ {importError}</p>}
            {importOk    && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">✅ Referencia importada correctamente.</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowImport(false); setYamlText(""); setImportError(""); setImportOk(false); }} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleImport} disabled={!yamlText.trim()} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {!hideHeader ? (
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Plantillas de Referencias</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {activeRefTab === "SEMANAL"
                    ? "Menús semanales de referencia que la IA usa como base."
                    : "Plantillas de intercambio de alimentos reutilizables."}
                </p>
              </div>
            </div>
            {mode === "LIST" ? (
              <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                {activeRefTab === "SEMANAL" && (
                  <>
                    <button onClick={() => setShowImport(true)} className="hidden flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      Importar YAML
                    </button>
                    <button onClick={() => setIsImportFromMenuOpen(true)} className="flex items-center gap-2 border border-blue-200 hover:bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      <History className="w-4 h-4" /> Agregar desde historial
                    </button>
                  </>
                )}
                {activeRefTab === "INTERCAMBIO" && (
                  <button onClick={() => setIsImportExchangeFromMenuOpen(true)} className="flex items-center gap-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                    <History className="w-4 h-4" /> Agregar desde historial
                  </button>
                )}
                <button onClick={openNew} className={`flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors ${activeRefTab === "INTERCAMBIO" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                  <Plus className="w-4 h-4" /> Nueva
                </button>
              </div>
            ) : (
              <button onClick={backToList} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                ← Volver
              </button>
            )}
          </div>
          {mode === "LIST" && (
            <>
              <TabSwitcher />
              <div className="flex sm:hidden items-center gap-2 flex-wrap mt-3">
                {activeRefTab === "SEMANAL" && (
                  <>
                    <button onClick={() => setShowImport(true)} className="hidden flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      Importar YAML
                    </button>
                    <button onClick={() => setIsImportFromMenuOpen(true)} className="flex items-center gap-2 border border-blue-200 hover:bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      <History className="w-4 h-4" /> Agregar desde historial
                    </button>
                  </>
                )}
                {activeRefTab === "INTERCAMBIO" && (
                  <button onClick={() => setIsImportExchangeFromMenuOpen(true)} className="flex items-center gap-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                    <History className="w-4 h-4" /> Agregar desde historial
                  </button>
                )}
                <button onClick={openNew} className={`flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors ${activeRefTab === "INTERCAMBIO" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                  <Plus className="w-4 h-4" /> Nueva
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            {mode === "LIST" && <TabSwitcher />}
            {mode === "LIST" ? (
              <div className="flex items-center gap-2">
                {activeRefTab === "SEMANAL" && (
                  <>
                    <button onClick={() => setShowImport(true)} className="hidden flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      Importar YAML
                    </button>
                    <button onClick={() => setIsImportFromMenuOpen(true)} className="flex items-center gap-2 border border-blue-200 hover:bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                      <History className="w-4 h-4" />
                    </button>
                  </>
                )}
                {activeRefTab === "INTERCAMBIO" && (
                  <button onClick={() => setIsImportExchangeFromMenuOpen(true)} className="flex items-center gap-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                    <History className="w-4 h-4" />
                  </button>
                )}
                <button onClick={openNew} className={`flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors ${activeRefTab === "INTERCAMBIO" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                  <Plus className="w-4 h-4" /> Nueva
                </button>
              </div>
            ) : (
              <button onClick={backToList} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                ← Volver
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {mode === "LIST" ? (
        <div className="p-6">
          {sortedItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${activeRefTab === "INTERCAMBIO" ? "bg-indigo-50" : "bg-blue-50"}`}>
                <FileText className={`w-8 h-8 ${activeRefTab === "INTERCAMBIO" ? "text-indigo-400" : "text-blue-400"}`} />
              </div>
              <h4 className="font-bold text-slate-700 mb-1">
                {activeRefTab === "INTERCAMBIO" ? "Aún no hay plantillas de intercambio" : "Aún no hay referencias"}
              </h4>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {activeRefTab === "INTERCAMBIO"
                  ? "Crea plantillas de intercambio de alimentos para reutilizarlas en futuros menús."
                  : "Agrega menús reales como referencia. La IA los usará para generar planes personalizados."}
              </p>
              <button onClick={openNew} className={`mt-4 inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors ${activeRefTab === "INTERCAMBIO" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                <Plus className="w-4 h-4" /> {activeRefTab === "INTERCAMBIO" ? "Crear primera plantilla de intercambio" : "Agregar primera referencia"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kcal</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tiempos</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r, i) => {
                      const d = r.data as MenuReferenceData & ExchangeReferenceData;
                      const displayDate = d.evaluationDate
                        ? new Date(d.evaluationDate + 'T00:00:00').toLocaleDateString()
                        : new Date(r.createdAt).toLocaleDateString();
                      const tiempos = activeRefTab === "INTERCAMBIO"
                        ? (d.exchangeMenu?.meals?.length || 0)
                        : (d.meals?.length || 0);
                      return (
                        <tr key={r.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                          <td className="px-4 py-3">
                            {d.kcal
                              ? <><span className="text-base font-extrabold text-slate-900">{d.kcal}</span><span className="ml-1 text-xs font-semibold text-slate-400">kcal</span></>
                              : <span className="text-slate-300 text-xs">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {d.patientName
                              ? <span className="font-semibold">{d.patientName}</span>
                              : <span className="text-slate-300 text-xs">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-500">{d.type}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{displayDate}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{tiempos} tiempos</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openView(r)} className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                                <Eye className="w-3.5 h-3.5" /> Ver
                              </button>
                              <button onClick={() => openEdit(r)} className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                                ✏️ Editar
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="inline-flex items-center justify-center text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 p-1.5 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Página {clampedPage} / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={clampedPage === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={clampedPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* EDITOR mode */
        activeRefTab === "INTERCAMBIO" ? (
          <ExchangeRefEditor
            key={editingId || 'new-exchange'}
            initialData={exchangeFormData}
            readOnly={isReadOnly}
            editingId={editingId}
            onSave={handleSaveExchange}
          />
        ) : (
          <div className="p-6 space-y-8">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3">
              {!isReadOnly && (
                <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
                  <Save className="w-4 h-4" /> Guardar referencia
                </button>
              )}
              <button onClick={handlePreview} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                <Eye className="w-4 h-4" /> Previsualizar
              </button>
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">⚠️ {saveError}</p>
              )}
              {isReadOnly && (
                <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1.5 rounded-lg">Solo lectura</span>
              )}
            </div>

            {/* 1. Datos base */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">1. Datos Base</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kcal</label>
                  <input
                    type="number" min={800}
                    value={formData.kcal || ""}
                    onChange={e => setFormData(prev => ({ ...prev, kcal: Number(e.target.value) || 0 }))}
                    readOnly={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="1820"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-500">SEMANAL</div>
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre y Apellido</label>
                  <input
                    type="text"
                    value={formData.patientName || ""}
                    onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value || undefined }))}
                    readOnly={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            {/* 2. Porciones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  2. Porciones por Tiempo de Comida
                </h4>
                {!isReadOnly && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Usa el dropdown de cada fila para cambiar la etiqueta del tiempo
                  </span>
                )}
              </div>
              <PortionsTable
                meals={formData.meals}
                readOnly={isReadOnly}
                onChangePortions={handleChangePortions}
                onChangeLabel={handleChangeLabel}
                onAddSlot={handleAddSlot}
                onRemoveSlot={handleRemoveSlot}
              />
            </div>

            {/* 3. Menú semanal */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">3. Menú Semanal</h4>
              <WeeklyMenuEditor
                meals={formData.meals}
                weeklyMenu={formData.weeklyMenu}
                hydration={formData.hydration}
                readOnly={isReadOnly}
                onChangeMealText={handleChangeMealText}
                onChangeDomingoNote={handleChangeDomingoNote}
                onHydrationChange={v => setFormData(prev => ({ ...prev, hydration: v }))}
              />
            </div>

            {/* Preview A4 */}
            {previewPlan && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Preview A4</h4>
                <MenuPreview data={previewPlan} elementId="menu-reference-print-area" />
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
