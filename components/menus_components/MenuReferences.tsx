import React, { useEffect, useState } from "react";
import {
  FileText, Plus, Trash2, Eye, Save, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { MenuPlanData } from "./MenuDesignTemplates";
import { MenuPreview } from "./MenuPreview";
import {
  MenuReferenceRecord,
  MenuReferenceData,
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
} from "./Menu_References_Components/MenuReferencesStorage";
import { MenuReferenceDataToMenuPlanData } from "./Menu_References_Components/MenuReferenceParsertoMenuData";
import { store } from "../../services/store";

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
              {/* Label dropdown */}
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

              {/* Portion inputs */}
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

              {/* Remove button */}
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

          {/* Totals row */}
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

      {/* Add slot button */}
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
      {/* Tab bar */}
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

      {/* Tab content */}
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

  // Map old YAML slot keys → new slot IDs
  const SLOT_MAP: Record<string, { id: string; label: MealLabel }> = {
    desayuno:  { id: 'slot_desayuno',   label: 'Desayuno'  },
    refManana: { id: 'slot_refaccion1', label: 'Refacción' },
    almuerzo:  { id: 'slot_almuerzo',   label: 'Almuerzo'  },
    refTarde:  { id: 'slot_refaccion2', label: 'Refacción' },
    cena:      { id: 'slot_cena',       label: 'Cena'      },
  };

  // ── Parse PORCIONES_POR_TIEMPO block ──
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

  // ── Parse WEEKLY_MENU block ──
  const weeklySection = yaml.match(/WEEKLY_MENU:([\s\S]*?)(?=\nNOTAS:|\s*$)/)?.[1] ?? '';
  const weekDays: (WeekDayKey | 'domingoV2')[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingoV2'];
  const weeklyMenu: any = { domingo: { note: '' } };

  weekDays.forEach(day => {
    const dayBlockRe = new RegExp(`^${day}:\\n((?:  [^\\n]*\\n?)*)`, 'm');
    const dayBlock = dayBlockRe.exec(weeklySection)?.[1] ?? '';
    const dayMenu: Record<string, string> = {};

    Object.entries(SLOT_MAP).forEach(([yamlKey, { id }]) => {
      // Match "  yamlKey: |\n    line1\n    line2\n" until next key or end
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

  // Domingo note
  const domBlockRe = /^domingo:\n((?:  [^\n]*\n?)*)/m;
  const domBlock = domBlockRe.exec(weeklySection)?.[1] ?? '';
  const noteMatch = /  note:\s*\|\n((?:    [^\n]*\n?)*)/.exec(domBlock);
  if (noteMatch) {
    weeklyMenu.domingo.note = noteMatch[1]
      .split('\n').map(l => l.replace(/^    /, '').trimEnd())
      .filter((l, i, arr) => !(i === arr.length - 1 && l === ''))
      .join('\n');
  }

  // Hydration
  const hydroMatch = /hydration:\s*\|\n((?:    [^\n]*\n?)*)/.exec(domBlock);
  const hydration = hydroMatch
    ? hydroMatch[1].split('\n').map(l => l.replace(/^    /, '').trimEnd()).join('').trim()
    : '2.5L Agua/Día';

  return { kcal, type, meals, weeklyMenu, hydration };
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Mode = "LIST" | "EDITOR";

export const MenuReferences: React.FC<{ hideHeader?: boolean; hideContainer?: boolean }> = ({ hideHeader, hideContainer }) => {
  // const store = useStore();
  const items = store.menuReferences;
  
  const [mode, setMode]               = useState<Mode>("LIST");
  const [viewing, setViewing]         = useState<MenuReferenceRecord | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [formData, setFormData]       = useState<MenuReferenceData>(emptyReferenceData());
  const [previewPlan, setPreviewPlan] = useState<MenuPlanData | null>(null);
  const [saveError, setSaveError]     = useState("");
  const [showImport, setShowImport]   = useState(false);
  const [yamlText, setYamlText]       = useState("");
  const [importError, setImportError] = useState("");
  const [importOk, setImportOk]       = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleImport = async () => {
    setImportError("");
    setImportOk(false);
    try {
      const data = parseYamlToReferenceData(yamlText);
      if (!data.kcal) throw new Error("No se encontró KCAL válido en el YAML.");
      await store.saveMenuReference({
        data: data,
        kcal: data.kcal,
        type: data.type,
      });
      setImportOk(true);
      setYamlText("");
      setTimeout(() => { setShowImport(false); setImportOk(false); }, 1500);
    } catch (e: any) {
      setImportError(e.message || "Error al parsear el YAML.");
    }
  };

  const isReadOnly = !!viewing;
  const sortedItems = [...items].sort((a, b) => {
    if (b.data.kcal !== a.data.kcal) return b.data.kcal - a.data.kcal;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ── Navigation ──────────────────────────────────────────────────────────────
  const openNew = () => {
    setViewing(null);
    setEditingId(null);
    setFormData(emptyReferenceData());
    setPreviewPlan(null);
    setSaveError("");
    setMode("EDITOR");
  };

  const openView = (record: MenuReferenceRecord) => {
    setViewing(record);
    setFormData(record.data);
    try { setPreviewPlan(MenuReferenceDataToMenuPlanData(record.data)); }
    catch { setPreviewPlan(null); }
    setSaveError("");
    setMode("EDITOR");
  };

  const openEdit = (record: MenuReferenceRecord) => {
    setViewing(null);
    setFormData(record.data);
    setPreviewPlan(null);
    setSaveError("");
    setMode("EDITOR");
    // Store the id so save does update instead of add
    setEditingId(record.id);
  };

  const backToList = () => { setMode("LIST"); setViewing(null); setEditingId(null); setPreviewPlan(null); setSaveError(""); };

  // ── Slot management ─────────────────────────────────────────────────────────

  const handleAddSlot = () => {
    const slot = newMealSlot('Refacción');
    setFormData(prev => {
      // Add slot to meals
      const meals = [...prev.meals, slot];
      // Add empty entry for new slot in every day
      const weeklyMenu = { ...prev.weeklyMenu } as any;
      WEEKDAY_KEYS.forEach(dk => {
        weeklyMenu[dk] = { ...weeklyMenu[dk], [slot.id]: '' };
      });
      if (weeklyMenu.domingoV2) {
        weeklyMenu.domingoV2 = { ...weeklyMenu.domingoV2, [slot.id]: '' };
      }
      return { ...prev, meals, weeklyMenu };
    });
  };

  const handleRemoveSlot = (slotId: string) => {
    setFormData(prev => {
      const meals = prev.meals.filter(s => s.id !== slotId);
      // Remove slot entry from every day
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
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map(s => s.id === slotId ? { ...s, label } : s),
    }));
  };

  const handleChangePortions = (slotId: string, group: keyof MealPortions, value: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map(s =>
        s.id === slotId ? { ...s, portions: { ...s.portions, [group]: value } } : s
      ),
    }));
  };

  // ── Weekly menu text ────────────────────────────────────────────────────────

  const handleChangeMealText = (day: WeekDayKey | 'domingoV2', slotId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      weeklyMenu: {
        ...prev.weeklyMenu,
        [day]: { ...(prev.weeklyMenu[day] as Record<string, string>), [slotId]: value },
      },
    }));
  };

  const handleChangeDomingoNote = (value: string) => {
    setFormData(prev => ({
      ...prev,
      weeklyMenu: { ...prev.weeklyMenu, domingo: { note: value } },
    }));
  };

  // ── Preview & Save ──────────────────────────────────────────────────────────
  const handlePreview = () => {
    try { setPreviewPlan(MenuReferenceDataToMenuPlanData(formData)); setSaveError(""); }
    catch (e: any) { setSaveError(e?.message || "Error al generar preview."); }
  };

  const handleSave = async () => {
    setSaveError("");
    if (!formData.kcal || formData.kcal < 800) { setSaveError("Las kcal deben ser mayores a 800."); return; }
    if (formData.meals.length === 0) { setSaveError("Agrega al menos un tiempo de comida."); return; }
    
    try {
      await store.saveMenuReference({ 
        id: editingId || undefined, 
        data: formData, 
        kcal: formData.kcal, 
        type: formData.type 
      });
      backToList();
    } catch (e: any) {
      setSaveError("Error al guardar la referencia.");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await store.deleteMenuReference(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (e: any) {
      setDeleteError("Error al eliminar la referencia.");
      setTimeout(() => setDeleteError(""), 3000);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>

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
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YAML Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Importar referencia desde YAML</h3>
              <button onClick={() => { setShowImport(false); setYamlText(""); setImportError(""); setImportOk(false); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
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
              <button onClick={() => { setShowImport(false); setYamlText(""); setImportError(""); setImportOk(false); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleImport} disabled={!yamlText.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {!hideHeader ? (
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Plantillas de Referencias</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Ingresa un menú de referencia por kcal para que la IA lo use como base.
              </p>
            </div>
          </div>
          {mode === "LIST" ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                ↑ Importar YAML
              </button>
              <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Nueva referencia
              </button>
            </div>
          ) : (
            <button onClick={backToList} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              ← Volver
            </button>
          )}
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 flex justify-end items-center gap-2 bg-slate-50/30">
          {mode === "LIST" ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                ↑ Importar YAML
              </button>
              <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Nueva referencia
              </button>
            </div>
          ) : (
            <button onClick={backToList} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              ← Volver
            </button>
          )}
        </div>
      )}

      {/* Body */}
      {mode === "LIST" ? (
        <div className="p-6">
          {sortedItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="font-bold text-slate-700 mb-1">Aún no hay referencias</h4>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Agrega menús reales como referencia. La IA los usará para generar planes personalizados.
              </p>
              <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Agregar primera referencia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {sortedItems.map(r => (
                <div key={r.id} className="border border-slate-200 rounded-xl p-3 hover:shadow-sm transition bg-white">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{r.data.type}</div>
                      <div className="text-lg font-extrabold text-slate-900 leading-tight">
                        {r.data.kcal} <span className="text-sm font-bold text-slate-500">kcal</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => openView(r)} className="inline-flex items-center justify-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-2 rounded-lg text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </button>
                    <button onClick={() => openEdit(r)} className="inline-flex items-center justify-center gap-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-2 rounded-lg text-xs font-semibold">
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="inline-flex items-center justify-center gap-1 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-2 py-2 rounded-lg text-xs font-semibold">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-500">SEMANAL</div>
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
              <MenuPreview
                data={previewPlan}
                elementId="menu-reference-print-area"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};