import React, { useState, useEffect } from 'react';
import {
  Sparkles, Settings, Save, RotateCcw, Plus, Trash2,
  ChevronDown, ChevronUp, Coffee, Sun, UtensilsCrossed, Apple, Moon,
  ToggleLeft, ToggleRight, User, FlaskConical
} from 'lucide-react';
import { store } from '../../services/store';
import { MenuAIConfig, MealTimeIdeas, PatientDataFields, FoodIdea, MealTimeKey, RecommendationIdeas } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────────
export const DEFAULT_PATIENT_FIELDS: PatientDataFields = {
  datosClinicos:            true,
  antecedentes:             true,
  horasSueno:               true,
  deporteEntrenamiento:     true,
  meta:                     true,
  alergias:                 true,
  diagnostico:              true,
  historialFamiliar:        true,
  medicamentos:             true,
  evaluacionDietetica:      true,
  evaluacionDieteticaFecha: true,
  medidasAntropometricas:   true,
  bioimpedancia:            true,
  laboratorios:             true,
};

// ─── Meal time metadata ───────────────────────────────────────────────────────
const MEAL_TIMES: { key: MealTimeKey; label: string; icon: React.ReactNode }[] = [
  { key: 'desayuno',  label: 'Desayuno',        icon: <Coffee className="w-4 h-4" />          },
  { key: 'refaccion', label: 'Refacción',        icon: <Apple className="w-4 h-4" />           },
  { key: 'almuerzo',  label: 'Almuerzo',         icon: <UtensilsCrossed className="w-4 h-4" /> },
  { key: 'merienda',  label: 'Merienda / Snack', icon: <Sun className="w-4 h-4" />             },
  { key: 'cena',      label: 'Cena',             icon: <Moon className="w-4 h-4" />            },
];

const CATEGORY_LABELS: Record<FoodIdea['category'], string> = {
  ingrediente: '🌽 Ingrediente',
  receta:      '🍳 Receta',
  evitar:      '🚫 Evitar',
  marca:       '🏷️ Marca',
};

const CATEGORY_COLORS: Record<FoodIdea['category'], string> = {
  ingrediente: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  receta:      'bg-blue-50 text-blue-700 border-blue-200',
  evitar:      'bg-red-50 text-red-700 border-red-200',
  marca:       'bg-purple-50 text-purple-700 border-purple-200',
};

const MEAL_COLOR_CLASSES: Record<MealTimeKey, { bg: string; border: string; text: string; icon: string }> = {
  desayuno:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: 'bg-amber-100 text-amber-600'   },
  refaccion: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  icon: 'bg-green-100 text-green-600'   },
  almuerzo:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: 'bg-blue-100 text-blue-600'     },
  merienda:  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'bg-orange-100 text-orange-600' },
  cena:      { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600' },
};

// ─── Field definitions for the toggle UI ─────────────────────────────────────
interface FieldDef {
  key: keyof PatientDataFields;
  label: string;
  description: string;
  dateScoped?: boolean;
  group: 'general' | 'fecha';
}

const FIELD_DEFS: FieldDef[] = [
  // General group
  { key: 'datosClinicos',            label: 'Datos Personales',            description: 'Nombre, Apellido, Edad y Género del paciente',                                              group: 'general' },
  { key: 'antecedentes',             label: 'Antecedentes',                description: 'Antecedentes clínicos y patológicos del paciente',                                     group: 'general' },
  { key: 'horasSueno',               label: 'Horas de Sueño',              description: 'Promedio de horas de sueño diarias',                                                   group: 'general' },
  { key: 'deporteEntrenamiento',     label: 'Deporte y Entrenamiento',   description: 'Perfil deportivo completo (deporte, frecuencia, duración)',                                group: 'general' },
  { key: 'meta',                     label: 'Meta del Paciente',         description: 'Objetivo principal (bajar de peso, ganar músculo, etc.)',                              group: 'general' },
  { key: 'alergias',                 label: 'Alergias',                  description: 'Alimentos o sustancias a los que el paciente es alérgico',                             group: 'general' },
  { key: 'diagnostico',              label: 'Diagnóstico Médico',        description: 'Diagnóstico clínico registrado',                                                       group: 'general' },
  { key: 'historialFamiliar',        label: 'Historial Familiar',        description: 'Antecedentes familiares relevantes',                                                   group: 'general' },
  { key: 'medicamentos',             label: 'Medicamentos',              description: 'Medicamentos actuales que pueden afectar la nutrición',                                group: 'general' },
  { key: 'evaluacionDietetica',      label: 'Evaluación Dietética',      description: 'Preferencias y aversiones alimentarias, notas dietéticas generales del paciente',     group: 'general' },
  // Date-scoped group
  { key: 'evaluacionDieteticaFecha', label: 'Evaluación Dietética',      description: 'Tiempos de comida, alimentos excluidos, recordatorio 24h y frecuencia de consumo',    group: 'fecha', dateScoped: true },
  { key: 'medidasAntropometricas',   label: 'Medidas Antropométricas',   description: 'Peso, talla, IMC, % grasa, grasa kg, músculo kg, masa libre de grasa,  somatotipo y diagnóstico nutricional',   group: 'fecha', dateScoped: true },
  { key: 'bioimpedancia',            label: 'Medidas Bioimpedancia',       description: 'Peso, % grasa, % músculo, grasa visceral, metabolismo basal, edad metabólica, agua corporal, masa ósea', group: 'fecha', dateScoped: true },
  { key: 'laboratorios',             label: 'Laboratorios',              description: 'Interpretaciones clínicas de los resultados de laboratorio',                          group: 'fecha', dateScoped: true },
];

// ─── Default prompt suffix ────────────────────────────────────────────────────
export const DEFAULT_MENU_PROMPT_SUFFIX = `
\u2550\u2550\u2550 PREFERENCIAS E IDEAS DE COMIDAS DE LA NUTRICIONISTA \u2550\u2550\u2550
{foodIdeas}

\u2550\u2550\u2550 IDEAS PARA RECOMENDACIONES (PÁGINA 2) \u2550\u2550\u2550
{recommendationIdeas}

Toma en cuenta estas ideas y preferencias al construir el menú semanal y la página de recomendaciones.
Incorpora los ingredientes y recetas sugeridos cuando sea apropiado según las metas nutricionales del paciente.
Evita los alimentos marcados como "evitar".
Usa las ideas de recomendaciones para completar las secciones de la segunda página (preparación, restricciones, hábitos y organización).`;

// ─── Storage helpers ──────────────────────────────────────────────────────────
const emptyIdeas = (): MealTimeIdeas => ({
  desayuno: [], refaccion: [], almuerzo: [], merienda: [], cena: [],
});

const emptyRecommendationIdeas = (): RecommendationIdeas => ({
  preparacion: [], restricciones: [], habitos: [], organizacion: [],
});

// ─── Build ideas context strings ──────────────────────────────────────────────
export function buildFoodIdeasContext(ideas: MealTimeIdeas): string {
  const lines: string[] = [];
  MEAL_TIMES.forEach(({ key, label }) => {
    const items = ideas[key];
    if (items.length === 0) return;
    lines.push(`${label.toUpperCase()}:`);
    items.forEach(item => {
      const cat = CATEGORY_LABELS[item.category];
      lines.push(`  - [${cat}] ${item.name}${item.description ? `: ${item.description}` : ''}`);
    });
  });
  return lines.length > 0 ? lines.join('\n') : 'Sin ideas específicas.';
}

export function buildRecommendationIdeasContext(recs: RecommendationIdeas): string {
  const lines: string[] = [];
  const sections = [
    { key: 'preparacion', label: 'PREPARACIÓN DE ALIMENTOS' },
    { key: 'restricciones', label: 'RESTRICCIONES ESPECÍFICAS' },
    { key: 'habitos', label: 'HÁBITOS SALUDABLES' },
    { key: 'organizacion', label: 'ORGANIZACIÓN Y HORARIOS' },
  ];

  sections.forEach(({ key, label }) => {
    const items = recs[key as keyof RecommendationIdeas];
    if (items && items.length > 0) {
      lines.push(`${label}:`);
      items.forEach(item => lines.push(`  - ${item}`));
    }
  });

  return lines.length > 0 ? lines.join('\n') : 'Sin ideas de recomendaciones específicas.';
}

// ─── Toggle component ─────────────────────────────────────────────────────────
const Toggle: React.FC<{ enabled: boolean; onChange: (v: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`flex items-center transition-colors ${enabled ? 'text-emerald-600' : 'text-slate-300'}`}
  >
    {enabled
      ? <ToggleRight className="w-8 h-8" />
      : <ToggleLeft  className="w-8 h-8" />}
  </button>
);

// ─── Sub-component: MealTimePanel ─────────────────────────────────────────────
const MealTimePanel: React.FC<{
  mealKey: MealTimeKey;
  label: string;
  icon: React.ReactNode;
  ideas: FoodIdea[];
  onChange: (ideas: FoodIdea[]) => void;
}> = ({ mealKey, label, icon, ideas, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<FoodIdea['category']>('ingrediente');
  const colors = MEAL_COLOR_CLASSES[mealKey];

  const handleAdd = () => {
    if (!newName.trim()) return;
    onChange([...ideas, {
      id: `${mealKey}_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      category: newCat,
    }]);
    setNewName(''); setNewDesc(''); setNewCat('ingrediente');
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? `${colors.border} shadow-sm` : 'border-slate-200'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${colors.icon}`}>{icon}</div>
          <div>
            <p className="text-sm font-bold text-slate-700">{label}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {ideas.length === 0 ? 'Sin ideas' : `${ideas.length} idea${ideas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ideas.length > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
              {ideas.length}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-150">
          {ideas.length > 0 && (
            <div className="space-y-2">
              {ideas.map(idea => (
                <div key={idea.id} className="flex items-start justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${CATEGORY_COLORS[idea.category]}`}>
                      {CATEGORY_LABELS[idea.category]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700">{idea.name}</p>
                      {idea.description && <p className="text-xs text-slate-500 mt-0.5">{idea.description}</p>}
                    </div>
                  </div>
                  <button onClick={() => onChange(ideas.filter(i => i.id !== idea.id))}
                    className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={`p-3 rounded-xl border ${colors.border} ${colors.bg} space-y-2`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Agregar idea</p>
            <div className="grid grid-cols-3 gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Nombre (ej: frijoles negros)"
                className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300" />
              <select value={newCat} onChange={e => setNewCat(e.target.value as FoodIdea['category'])}
                className="bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 outline-none cursor-pointer">
                {(Object.keys(CATEGORY_LABELS) as FoodIdea['category'][]).map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Descripción corta (opcional)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300" />
              <button onClick={handleAdd} disabled={!newName.trim()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${newName.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main MenuAIConfigurator ──────────────────────────────────────────────────
export const MenuAIConfigurator: React.FC<{ hideHeader?: boolean; hideContainer?: boolean }> = ({ hideHeader, hideContainer }) => {
  // const store = useStore(); // Removed hook call
  const saved = store.getUserProfile()?.menuAIConfig || { 
    prompt: DEFAULT_MENU_PROMPT_SUFFIX, 
    ideas: emptyIdeas(), 
    fields: { ...DEFAULT_PATIENT_FIELDS } 
  };

  const [promptSuffix, setPromptSuffix]     = useState(saved.prompt || DEFAULT_MENU_PROMPT_SUFFIX);
  const [ideas, setIdeas]                   = useState<MealTimeIdeas>(saved.ideas || emptyIdeas());
  const [recIdeas, setRecIdeas]             = useState<RecommendationIdeas>(saved.recommendationIdeas || emptyRecommendationIdeas());
  const [fields, setFields]                 = useState<PatientDataFields>({ ...DEFAULT_PATIENT_FIELDS, ...saved.fields });
  const [activeTab, setActiveTab]           = useState<'ideas' | 'recs' | 'datos' | 'prompt'>('ideas');
  const [savedOk, setSavedOk]               = useState(false);
  const [isPromptCustom, setIsPromptCustom] = useState(
    !!saved.prompt && saved.prompt !== DEFAULT_MENU_PROMPT_SUFFIX
  );

  // Sync with store when store data changes (e.g. after initial load)
  useEffect(() => {
    const profile = store.getUserProfile();
    if (profile?.menuAIConfig) {
      const cfg = profile.menuAIConfig;
      setPromptSuffix(cfg.prompt || DEFAULT_MENU_PROMPT_SUFFIX);
      setIdeas(cfg.ideas || emptyIdeas());
      setRecIdeas(cfg.recommendationIdeas || emptyRecommendationIdeas());
      setFields({ ...DEFAULT_PATIENT_FIELDS, ...cfg.fields });
      setIsPromptCustom(!!cfg.prompt && cfg.prompt !== DEFAULT_MENU_PROMPT_SUFFIX);
    }
  }, [store.getUserProfile()?.menuAIConfig]);

  // Save changes to store
  const handleSaveAll = async (newConfig: MenuAIConfig) => {
    try {
      await store.updateMenuAIConfig(newConfig);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } catch (error) {
      console.error("Error saving AI config:", error);
    }
  };

  const handleSavePrompt = () => {
    const newConfig = { prompt: promptSuffix, ideas, fields, recommendationIdeas: recIdeas };
    handleSaveAll(newConfig);
    setIsPromptCustom(promptSuffix !== DEFAULT_MENU_PROMPT_SUFFIX);
  };

  const handleResetPrompt = () => {
    const newPrompt = DEFAULT_MENU_PROMPT_SUFFIX;
    setPromptSuffix(newPrompt);
    setIsPromptCustom(false);
    handleSaveAll({ prompt: newPrompt, ideas, fields, recommendationIdeas: recIdeas });
  };

  const handleFieldToggle = (key: keyof PatientDataFields, value: boolean) => {
    const newFields = { ...fields, [key]: value };
    setFields(newFields);
    handleSaveAll({ prompt: promptSuffix, ideas, fields: newFields, recommendationIdeas: recIdeas });
  };

  const handleResetFields = () => {
    const newFields = { ...DEFAULT_PATIENT_FIELDS };
    setFields(newFields);
    handleSaveAll({ prompt: promptSuffix, ideas, fields: newFields, recommendationIdeas: recIdeas });
  };

  const handleIdeasChange = (newIdeas: MealTimeIdeas) => {
    setIdeas(newIdeas);
    handleSaveAll({ prompt: promptSuffix, ideas: newIdeas, fields, recommendationIdeas: recIdeas });
  };

  const handleRecIdeasChange = (newRecIdeas: RecommendationIdeas) => {
    setRecIdeas(newRecIdeas);
    handleSaveAll({ prompt: promptSuffix, ideas, fields, recommendationIdeas: newRecIdeas });
  };

  const totalIdeas   = (Object.values(ideas) as FoodIdea[][]).reduce((sum, arr) => sum + arr.length, 0);
  const totalRecs    = (Object.values(recIdeas) as string[][]).reduce((sum, arr) => sum + arr.length, 0);
  const activeFields = (Object.values(fields) as boolean[]).filter(Boolean).length;
  const totalFields  = Object.keys(fields).length;
  const generalDefs  = FIELD_DEFS.filter(f => f.group === 'general');
  const fechaDefs    = FIELD_DEFS.filter(f => f.group === 'fecha');

  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>
      {/* Header */}
      {!hideHeader ? (
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Configuración de AI para Menús</h3>
              <p className="text-sm text-slate-500 mt-0.5">Personaliza cómo Gemini genera los menús de tus pacientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalIdeas > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''}
              </span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              activeFields === totalFields
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              {activeFields}/{totalFields} datos activos
            </span>
            {isPromptCustom && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Prompt personalizado
              </span>
            )}
            <button onClick={handleSavePrompt}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                savedOk
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
              }`}>
              <Save className="w-4 h-4" />
              {savedOk ? '¡Guardado!' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 flex justify-end items-center gap-2 bg-slate-50/30">
          {totalIdeas > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            activeFields === totalFields
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            {activeFields}/{totalFields} datos activos
          </span>
          {isPromptCustom && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              Prompt personalizado
            </span>
          )}
          <button onClick={handleSavePrompt}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              savedOk
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}>
            <Save className="w-4 h-4" />
            {savedOk ? '¡Guardado!' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-6">
        {[
          { id: 'ideas',  label: 'Ideas de Comidas',   icon: <UtensilsCrossed className="w-4 h-4" />,
            badge: totalIdeas > 0 ? String(totalIdeas) : null, badgeColor: 'bg-indigo-100 text-indigo-600' },
          { id: 'recs',   label: 'Ideas de Recomendaciones', icon: <FlaskConical className="w-4 h-4" />,
            badge: totalRecs > 0 ? String(totalRecs) : null, badgeColor: 'bg-emerald-100 text-emerald-600' },
          { id: 'datos',  label: 'Datos del Paciente', icon: <User className="w-4 h-4" />,
            badge: activeFields < totalFields ? `${activeFields}/${totalFields}` : null, badgeColor: 'bg-amber-100 text-amber-600' },
          { id: 'prompt', label: 'Prompt Avanzado',    icon: <Settings className="w-4 h-4" />,
            badge: isPromptCustom ? '✎' : null, badgeColor: 'bg-amber-100 text-amber-600' },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-1 py-3.5 text-sm font-bold border-b-2 transition-colors mr-6 last:mr-0 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Ideas ── */}
      {activeTab === 'ideas' && (
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-400 font-medium">
            Agrega ingredientes, recetas, alimentos a evitar o marcas específicas por tiempo de comida. Gemini los tomará en cuenta al generar cada menú.
          </p>
          {MEAL_TIMES.map(({ key, label, icon }) => (
            <MealTimePanel key={key} mealKey={key} label={label} icon={icon}
              ideas={ideas[key]}
              onChange={newIdeas => handleIdeasChange({ ...ideas, [key]: newIdeas })}
            />
          ))}
          {totalIdeas === 0 && (
            <div className="text-center py-6 text-slate-400">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Sin ideas agregadas aún</p>
              <p className="text-xs mt-1">Expande cualquier tiempo de comida para agregar ideas</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Recommendation Ideas ── */}
      {activeTab === 'recs' && (
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-400 font-medium">
            Agrega ideas predefinidas para las 4 secciones de la página de recomendaciones. Gemini las usará como base para generar el contenido.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'preparacion', label: 'Preparación de Alimentos', icon: '🍳' },
              { key: 'restricciones', label: 'Restricciones Específicas', icon: '🚫' },
              { key: 'habitos', label: 'Hábitos Saludables', icon: '❤️' },
              { key: 'organizacion', label: 'Organización y Horarios', icon: '⏰' },
            ].map(section => (
              <div key={section.key} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col h-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{section.icon}</span>
                    <h4 className="text-sm font-bold text-slate-700">{section.label}</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                    {recIdeas[section.key as keyof RecommendationIdeas]?.length || 0}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 custom-scrollbar">
                  {recIdeas[section.key as keyof RecommendationIdeas]?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 group">
                      <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium">
                        {item}
                      </div>
                      <button 
                        onClick={() => {
                          const newItems = [...recIdeas[section.key as keyof RecommendationIdeas]];
                          newItems.splice(idx, 1);
                          handleRecIdeasChange({ ...recIdeas, [section.key]: newItems });
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!recIdeas[section.key as keyof RecommendationIdeas] || recIdeas[section.key as keyof RecommendationIdeas].length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 italic text-[10px]">
                      Sin ideas aún
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Nueva idea..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          const current = recIdeas[section.key as keyof RecommendationIdeas] || [];
                          handleRecIdeasChange({ ...recIdeas, [section.key]: [...current, val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button 
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      const val = input.value.trim();
                      if (val) {
                        const current = recIdeas[section.key as keyof RecommendationIdeas] || [];
                        handleRecIdeasChange({ ...recIdeas, [section.key]: [...current, val] });
                        input.value = '';
                      }
                    }}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Datos del Paciente ── */}
      {activeTab === 'datos' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Activa o desactiva qué información del paciente incluye Gemini al generar el menú.
            </p>
            <button onClick={handleResetFields}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">
              <RotateCcw className="w-3 h-3" /> Restaurar
            </button>
          </div>

          {/* General fields */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-slate-100 p-1.5 rounded-lg">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Datos Generales</p>
            </div>
            {generalDefs.map(field => (
              <div key={field.key}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  fields[field.key]
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                <div className="min-w-0 pr-4">
                  <p className={`text-sm font-bold transition-colors ${fields[field.key] ? 'text-slate-800' : 'text-slate-400'}`}>
                    {field.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>
                </div>
                <Toggle enabled={fields[field.key]} onChange={v => handleFieldToggle(field.key, v)} />
              </div>
            ))}
          </div>

          {/* Date-scoped fields */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Datos con Fecha</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Solo usa la información vinculada a la evaluación asignada al menú
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-600 font-medium mb-2">
              📅 Estos datos se obtienen únicamente de la evaluación asignada al menú, no del historial completo del paciente.
            </div>

            {fechaDefs.map(field => (
              <div key={field.key}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  fields[field.key]
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold transition-colors ${fields[field.key] ? 'text-slate-800' : 'text-slate-400'}`}>
                      {field.label}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-500 border border-indigo-200 uppercase tracking-wide">
                      Por fecha
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>
                </div>
                <Toggle enabled={fields[field.key]} onChange={v => handleFieldToggle(field.key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Prompt Avanzado ── */}
      {activeTab === 'prompt' && (
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
            💡 Este texto se agrega al final del prompt principal. Úsalo para instrucciones avanzadas adicionales.
            Las ideas de comidas se insertan en{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">{'{foodIdeas}'}</code>.
          </div>
          <textarea
            value={promptSuffix}
            onChange={e => setPromptSuffix(e.target.value)}
            rows={12}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 font-mono leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all resize-y"
          />
          <div className="flex items-center justify-between">
            <button onClick={handleResetPrompt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar por defecto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};