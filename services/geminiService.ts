import { Patient, Measurement, MenuTemplateDesign } from "../types";
import { MenuPlanData } from "../components/menus_components/MenuDesignTemplates";
import type { MenuReferenceData } from "../components/menus_components/Menu_References_Components/MenuReferencesStorage";
import { WEEKDAY_KEYS, calcPortionsTotal } from "../components/menus_components/Menu_References_Components/MenuReferencesStorage";
import { store } from "./store";
import { 
  DEFAULT_PATIENT_FIELDS, 
  DEFAULT_MENU_PROMPT_SUFFIX, 
  buildFoodIdeasContext,
  buildRecommendationIdeasContext
} from "../components/menus_components/MenuAIConfigurator";
import { PatientDataFields } from "../types";
import { aiService } from "./aiService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIMealEntry {
  id:    string;
  label: string;
  portions: {
    lacteos: number; vegetales: number; frutas: number;
    cereales: number; carnes: number; grasas: number;
  };
}

interface AIMenuResponse {
  weeklyMenu:    { dayKey: string; meals: any[] }[];
  domingoV1:     { note: string; hydration: string };
  domingoV2:     { note: string; hydration: string; meals: any[] };
  patient:       { name: string; age: number; weight: number; height: number; fatPct: number };
  kcal:          number;
  recommendations?: { preparacion: string[]; restricciones: string[]; habitos: string[]; organizacion: string[] };
  rationale:     string;
}

// ─── System Instruction (estático — se envía separado del prompt) ─────────────

const PORTION_EQUIVALENTS = `EQUIVALENCIAS — 1 PORCIÓN:
LÁCTEOS DESC: 1 vaso leche descremada, yogurt descremado/light | ENTEROS: 1 vaso leche entera, yogurt entero
VERDURAS: ½ tz cocidos ó 1 tz crudos/ensalada (brócoli, espinaca, lechuga, tomate, zanahoria, pepino, zucchini, coliflor, güisquil)
FRUTAS: 1 unidad mediana | 1 tz en trozos | 1 rodaja gruesa melón/piña/papaya | ¾ tz moras | 10-12 fresas/uvas
CEREALES: 1 tortilla | 1 rodaja pan | ½ tz arroz/frijol/pasta/avena cocida/papa/camote/lentejas | ¼ tz granola | 1 barra granola
CARNES (1 porción = 1 oz): 1 oz pollo/pescado/res/cerdo | 1 huevo | 2 claras | 1 rodaja jamón pavo | ¼ tz queso fresco | 3 oz = 1 chuleta | 4 oz = 1 pechuga/lata atún
GRASAS: 1 cdta aceite oliva | ¼ aguacate | 6 almendras/nueces/marañón | 5-10 manías/aceitunas | 1 cda aderezo/queso crema

TABLA DE CONVERSIÓN PORCIONES → MEDIDAS CASERAS:
VEGETALES:
  vegetales_1 = 1 tz crudos O ½ tz cocidos
  vegetales_2 = 2 tz crudos O 1 tz cocidos O mezcla (1 tz crudos + ½ tz cocidos)
  vegetales_3 = 3 tz crudos O 1½ tz cocidos O mezcla
  vegetales_4 = 4 tz crudos O 2 tz cocidos O mezcla (ej: 1 tz ensalada cruda + 1½ tz vegetales cocidos)
  vegetales_5 = 5 tz crudos O 2½ tz cocidos O mezcla (ej: 2 tz ensalada + 1½ tz cocidos)
CARNES:
  carnes_1 = 1 oz proteína O 1 huevo O 2 claras O 1 rodaja jamón O 1 oz queso fresco
  carnes_2 = 2 oz proteína O 2 huevos O 1 huevo + 2 claras
  carnes_3 = 3 oz proteína O 1 chuleta
  carnes_4 = 4 oz proteína O 1 pechuga completa O 1 lata atún
  carnes_5 = 5 oz O 1 pechuga grande O 1 lata atún + 1 huevo
  carnes_6 = 6 oz O 1 filete grande O 2 chuletas
  carnes_7 = 7 oz O 1 filete grande + 1 huevo
  carnes_8 = 8 oz O 2 pechugas O 2 latas atún
LÁCTEOS:
  lacteos_1 = 1 vaso leche O 1 yogurt
  lacteos_2 = 2 vasos leche O 1 vaso + 1 yogurt O 2 yogurts
  lacteos_3 = 3 vasos/yogurts combinados
  lacteos_4 = 4 vasos/yogurts combinados
FRUTAS:
  frutas_1 = 1 fruta mediana O 1 tz en trozos O 10-12 fresas/uvas
  frutas_2 = 2 frutas medianas O 1 fruta + 1 tz en trozos O combinación
  frutas_3 = 3 frutas medianas O 2 frutas + 1 tz en trozos
  frutas_4 = 4 frutas medianas O combinación
  frutas_5 = 5 frutas medianas O combinación
CEREALES:
  cereales_1 = 1 tortilla O 1 rodaja pan O ½ tz arroz/frijol/pasta cocida
  cereales_2 = 2 tortillas O 1 tortilla + ½ tz arroz O 1 pan + ½ tz frijol
  cereales_3 = 3 porciones combinadas (ej: 1 tortilla + ½ tz arroz + ½ tz frijol)
  cereales_4 = 4 porciones combinadas
  cereales_5 = 5 porciones combinadas
GRASAS:
  grasas_1 = 1 cdta aceite O ¼ aguacate O 6 almendras
  grasas_2 = 2 cdtas aceite O ½ aguacate O 12 almendras O combinación
  grasas_3 = 3 porciones combinadas`;

const MENU_SYSTEM_INSTRUCTION = `Eres nutricionista experta. Generas menús semanales personalizados en español.

${PORTION_EQUIVALENTS}

ESTILO: Natural, compacto, medidas caseras, máx 4 líneas por tiempo. Sin corchetes, sin "porción de".
REGLA: SIEMPRE escribir la cantidad antes del alimento. NUNCA escribir solo el nombre del alimento sin medida. Correcto: "1 taza de brócoli al vapor", "½ taza de espinaca cocida". Incorrecto: "Brócoli al vapor", "Espinaca cocida".

Responde SOLO con JSON válido, sin texto adicional ni markdown.`;

// ─── Grupos de porciones ──────────────────────────────────────────────────────

const GROUPS = ['lacteos', 'vegetales', 'frutas', 'cereales', 'carnes', 'grasas'] as const;

const GROUP_LABELS: Record<string, string> = {
  lacteos:   'LÁCTEO',
  vegetales: 'VEGETALES',
  frutas:    'FRUTA',
  cereales:  'CEREALES',
  carnes:    'CARNES',
  grasas:    'GRASA',
};

// Ejemplos de medidas caseras por grupo y cantidad de porciones
const GROUP_EXAMPLES: Record<string, Record<number, string>> = {
  lacteos: {
    1: '1 vaso leche / 1 yogurt',
    2: '2 vasos leche / 2 yogurts',
    3: '3 vasos/yogurts combinados',
    4: '4 vasos/yogurts combinados',
  },
  vegetales: {
    1: '1 tz crudos / ½ tz cocidos',
    2: '2 tz crudos / 1 tz cocidos',
    3: '3 tz crudos / 1½ tz cocidos',
    4: '2 tz crudos + 1 tz cocidos',
    5: '2 tz ensalada + 1½ tz cocidos',
  },
  frutas: {
    1: '1 fruta mediana / 1 tz en trozos',
    2: '2 frutas / 1 fruta + 1 tz trozos',
    3: '3 frutas / combinación',
    4: '4 frutas / combinación',
    5: '5 frutas / combinación',
  },
  cereales: {
    1: '1 tortilla / 1 rodaja pan / ½ tz arroz',
    2: '2 tortillas / 1 tortilla + ½ tz arroz',
    3: '1 tortilla + ½ tz arroz + ½ tz frijol',
    4: '2 tortillas + ½ tz arroz + ½ tz frijol',
    5: '3 tortillas + ½ tz arroz + ½ tz frijol',
  },
  carnes: {
    1: '1 oz proteína / 1 huevo / 2 claras',
    2: '2 oz proteína / 2 huevos',
    3: '3 oz proteína / 1 chuleta',
    4: '4 oz proteína / 1 pechuga / 1 lata atún',
    5: '5 oz / pechuga grande / 1 lata atún + 1 huevo',
    6: '6 oz / 2 chuletas / 1 filete grande',
    7: '7 oz / filete grande + 1 huevo',
    8: '8 oz / 2 pechugas / 2 latas atún',
  },
  grasas: {
    1: '1 cdta aceite / ¼ aguacate / 6 almendras',
    2: '½ aguacate / 2 cdtas aceite / 12 almendras',
    3: '¾ aguacate / 3 cdtas aceite / 18 almendras',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

function parseGeminiJson(geminiData: any): any {
  const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini no devolvió contenido. Intenta de nuevo.");
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(clean); }
  catch { throw new Error("La IA no devolvió JSON válido. Intenta de nuevo."); }
}

function cleanTitle(title: string): string {
  return title
    .replace(/\[/g, '').replace(/\]/g, '')
    .replace(/\(\d+ porciones?\)\s*/gi, '')
    .replace(/  +/g, ' ')
    .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function structuredMealToTitle(meal: any): string {
  const lines: string[] = [];
  for (const group of GROUPS) {
    let val: string | undefined;
    if (typeof meal[group] === 'string' && meal[group].trim()) {
      val = meal[group].trim();
    } else {
      for (const key of Object.keys(meal)) {
        if (key.startsWith(group + '_') && typeof meal[key] === 'string' && meal[key].trim()) {
          val = meal[key].trim();
          break;
        }
      }
    }
    if (val) lines.push(val);
  }
  return lines.join('\n');
}

// ─── Extract mealStructure from portions.byMeal ──────────────────────────────

const MEAL_LABELS: Record<string, string> = {
  desayuno:        'Desayuno',
  refaccion1:      'Refacción 1',
  refaccion_1:     'Refacción 1',
  almuerzo:        'Almuerzo',
  refaccion2:      'Refacción 2',
  refaccion_2:     'Refacción 2',
  cena:            'Cena',
  slot_desayuno:   'Desayuno',
  slot_refaccion1: 'Refacción 1',
  slot_almuerzo:   'Almuerzo',
  slot_refaccion2: 'Refacción 2',
  slot_cena:       'Cena',
};

const DEFAULT_MEALS_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena',
  'slot_desayuno', 'slot_refaccion1', 'slot_almuerzo', 'slot_refaccion2', 'slot_cena'];

function extractMealStructure(portions: any, vetData: any): AIMealEntry[] {
  const byMeal = portions?.byMeal 
    || portions?.portions?.byMeal
    || vetData?.byMeal 
    || vetData?.portions?.byMeal
    || vetData?.menuData?.portions?.byMeal;
  
  if (!byMeal || typeof byMeal !== 'object') {
    console.error("❌ byMeal NO encontrado");
    console.error("portions keys:", JSON.stringify(Object.keys(portions || {})));
    console.error("vetData keys:", JSON.stringify(Object.keys(vetData || {})));
    return [];
  }

  console.log("✅ byMeal encontrado, tiempos:", Object.keys(byMeal));

  const ids = Object.keys(byMeal);
  const ordered = DEFAULT_MEALS_ORDER.filter(id => ids.includes(id));
  ids.forEach(id => { if (!ordered.includes(id)) ordered.push(id); });

  return ordered.map(id => {
    const p = byMeal[id] || {};
    return {
      id,
      label: MEAL_LABELS[id] || (byMeal[id] as any)?.label || id,
      portions: {
        lacteos:   p.lacteos   || 0,
        vegetales: p.vegetales || 0,
        frutas:    p.frutas    || 0,
        cereales:  p.cereales  || 0,
        carnes:    p.carnes    || 0,
        grasas:    p.grasas    || 0,
      },
    };
  });
}

// ─── Build JSON template for one meal ────────────────────────────────────────

function buildMealJsonTemplate(meal: AIMealEntry): string {
  return `      {"id": "${meal.id}", "title": "..."}`;
}

// ─── Build explicit portion summary with examples ─────────────────────────────

function buildPortionSummary(meals: AIMealEntry[]): string {
  return meals.map(m => {
    const active = GROUPS.filter(g => m.portions[g] > 0);
    if (!active.length) return `${m.label.toUpperCase()} (id="${m.id}"): sin porciones — omitir`;
    const lines = active.map(g => {
      const n = m.portions[g];
      const ex = GROUP_EXAMPLES[g]?.[n] ?? `${n} porciones`;
      return `  · ${GROUP_LABELS[g]}: ${n} porción${n > 1 ? 'es' : ''} (equivale a ${ex})`;
    }).join('\n');
    return `${m.label.toUpperCase()} (id="${m.id}") — metas nutricionales:\n${lines}`;
  }).join('\n\n');
}

// ─── Build reference context (solo 3 días) ───────────────────────────────────

const REF_DAYS = ['lunes', 'miercoles', 'viernes'];

function buildRefContext(references: { title: string; data: MenuReferenceData }[]): string {
  if (!references.length) return "Sin referencias. Usa comida guatemalteca típica.";

  return references.sort((a, b) => a.title.localeCompare(b.title)).map(ref => {
    const { data } = ref;
    const weekLines = REF_DAYS.map(dayKey => {
      const day = data.weeklyMenu[dayKey];
      const meals = data.meals.map(slot => {
        const text = day?.[slot.id]?.trim();
        if (!text) return null;
        return `    ${slot.label}:\n      ${text.split("\n").join("\n      ")}`;
      }).filter(Boolean).join("\n");
      return meals ? `  ${dayKey.toUpperCase()}:\n${meals}` : null;
    }).filter(Boolean).join("\n");
    return `REFERENCIA [${ref.title}] (${data.kcal} kcal):\n${weekLines}`;
  }).join("\n---\n");
}

// ─── Build patient context ────────────────────────────────────────────────────

function buildPatientContext(
  patient: Patient, vetData: any, portions: any,
  fields: PatientDataFields, linkedDate?: string
): string {
  const lines: string[] = [];

  if (fields.datosClinicos)
    lines.push(`${patient.firstName} ${patient.lastName} | ${patient.clinical.age} años | ${patient.clinical.sex}`);
  if (fields.antecedentes && patient.clinical.clinicalbackground)
    lines.push(`Antecedentes: ${patient.clinical.clinicalbackground}`);
  if (fields.horasSueno && patient.clinical.sleep_hours)
    lines.push(`Sueño: ${patient.clinical.sleep_hours}h`);
  if (fields.deporteEntrenamiento) {
    const s = (patient.sportsProfile || []).map(s =>
      `${s.sport} (${s.daysPerWeek}d/sem, ${s.hoursPerDay}h${s.schedule ? `, ${s.schedule}` : ''})`
    ).join(' | ');
    if (s) lines.push(`Deporte: ${s}`);
  }
  if (fields.meta && patient.clinical.consultmotive)
    lines.push(`Meta: ${patient.clinical.consultmotive}`);
  if (fields.alergias && patient.clinical.allergies)
    lines.push(`Alergias: ${patient.clinical.allergies}`);
  if (fields.diagnostico && patient.clinical.diagnosis)
    lines.push(`Diagnóstico: ${patient.clinical.diagnosis}`);
  if (fields.historialFamiliar && patient.clinical.familyHistory)
    lines.push(`Historial familiar: ${patient.clinical.familyHistory}`);
  if (fields.medicamentos && patient.clinical.medications)
    lines.push(`Medicamentos: ${patient.clinical.medications}`);
  if (fields.evaluacionDietetica && patient.dietary.preferences)
    lines.push(`Preferencias: ${patient.dietary.preferences}`);

  if (fields.evaluacionDieteticaFecha && linkedDate) {
    const de = patient.dietaryEvaluations?.find(d => d.date === linkedDate);
    if (de) {
      if (de.excludedFoods) lines.push(`Evita: ${de.excludedFoods}`);
      if (de.notes) lines.push(`Notas: ${de.notes}`);
      if (de.recall?.length)
        lines.push(`Recordatorio 24h: ${de.recall.map(r => `${r.mealTime}: ${r.description}`).join(' | ')}`);
      const freq = (de.foodFrequency || []).filter((f: any) => f.frequency && f.frequency !== 'Nunca');
      if (freq.length) lines.push(`Frecuencia: ${freq.map((f: any) => `${f.category}: ${f.frequency}`).join(' | ')}`);
    }
  }

  if (fields.medidasAntropometricas && linkedDate) {
    const m = patient.measurements?.find(m => m.date === linkedDate);
    if (m) {
      const p: string[] = [];
      if (m.weight) p.push(`${m.weight}kg`);
      if (m.height) p.push(`${m.height}cm`);
      if (m.imc) p.push(`IMC ${m.imc.toFixed(1)}`);
      if (m.bodyFat) p.push(`Grasa ${m.bodyFat.toFixed(1)}%`);
      if (m.muscleKg) p.push(`Músculo ${m.muscleKg.toFixed(1)}kg`);
      if (p.length) lines.push(`Medidas: ${p.join(' | ')}`);
    }
  }

  if (fields.laboratorios && linkedDate) {
    const labs = (patient.labs || []).filter(
      (l: any) => l?.linkedEvaluationId === linkedDate && l?.labInterpretation?.trim()
    );
    if (labs.length) {
      const labSummaries = labs.map((l: any) => {
        const key = extractLabKeyFindings(l.labInterpretation.trim(), 300);
        return key ? `${l.name}: ${key}` : null;
      }).filter(Boolean).join(' | ');
      if (labSummaries) lines.push(`Labs (hallazgos relevantes): ${labSummaries}`);
    }
  }

  return lines.join('\n');
}

// ─── SINGLE AI CALL ───────────────────────────────────────────────────────────

async function generateWeeklyMenu(
  mealStructure: AIMealEntry[],
  patientCtx:    string,
  bioCtx:        string,
  refContext:    string,
  promptSuffix:  string,
  kcal:          number,
  scopeInstr:    string,
): Promise<AIMenuResponse> {

  const portionSummary = buildPortionSummary(mealStructure);
  const mealExamples   = mealStructure.map(m => buildMealJsonTemplate(m)).join(',\n');

  const prompt = `Nutricionista experta. Genera menú semanal personalizado.
${scopeInstr}

PACIENTE:
${patientCtx}
${bioCtx}
Kcal: ${kcal}

METAS NUTRICIONALES POR TIEMPO DE COMIDA (cuántas porciones de cada grupo debe haber):
${portionSummary}

CÓMO ESCRIBIR EL CAMPO "title" DE CADA TIEMPO:
- Escribe ALIMENTOS REALES con nombre y medida casera, una línea por grupo activo, en el mismo orden.
- Usa las equivalencias indicadas para respetar la cantidad de porciones.
- CORRECTO: "2 huevos revueltos con chile pimiento\\n1 vaso de leche descremada\\n2 tortillas de maíz\\n1 banano mediano"
- INCORRECTO (PROHIBIDO): "2 CARNES\\n1 LÁCTEO\\n2 CEREALES\\n1 FRUTA" — nunca escribas el nombre del grupo, siempre el alimento real.
- Si un grupo tiene 0 porciones para ese tiempo, NO incluirlo. Puedes variar alimentos entre días.

REFERENCIAS DE COMIDAS — USA ESTOS ALIMENTOS E IDEAS COMO BASE PRINCIPAL:
${refContext}

JSON — cada meal: {"id": "...", "title": "línea1\nlínea2\n..."} (una \n entre cada línea):
{
  "weeklyMenu": [
    {"dayKey":"lunes","meals":[
${mealExamples}
    ]},
    {"dayKey":"martes","meals":[...]},{"dayKey":"miercoles","meals":[...]},
    {"dayKey":"jueves","meals":[...]},{"dayKey":"viernes","meals":[...]},
    {"dayKey":"sabado","meals":[...]}
  ],
  "domingoV1":{"note":"...","hydration":"X.XL Agua/Día"},
  "domingoV2":{"note":"...","hydration":"X.XL Agua/Día","meals":[...]},
  "patient":{"name":"...","age":0,"weight":0,"height":0,"fatPct":0},
  "kcal":${kcal},
  "recommendations":{"preparacion":[],"restricciones":[],"habitos":[],"organizacion":[]},
  "rationale":"..."
}

DOMINGO — OBLIGATORIO generar ambas versiones:
- domingoV1: Día libre. "note" = observación breve sobre el día libre y porciones. "hydration" = "2.5L Agua/Día".
- domingoV2: Día completo. Mismos campos por meal que lunes-sábado + "note" = nota personalizada para el paciente sobre su plan nutricional (consejo motivacional, recordatorio importante o tip práctico relacionado a su meta y condición) + "hydration" = "2.5L Agua/Día".

Mismos campos por meal todos los días. Solo JSON.
${promptSuffix}`;

  const resp = await aiService.invokeGemini(prompt, 'menu', MENU_SYSTEM_INSTRUCTION);
  const parsed = parseGeminiJson(resp.output);

  parsed.weeklyMenu = toArray(parsed.weeklyMenu).map((day: any) => {
    if (!day?.dayKey) return day;
    return {
      dayKey: day.dayKey,
      meals: toArray(day.meals).map((meal: any) => {
        if (!meal?.id) return meal;
        return { id: meal.id, title: cleanTitle(meal.title || '') };
      }),
    };
  });

  if (parsed.domingoV2?.meals) {
    parsed.domingoV2.meals = toArray(parsed.domingoV2.meals).map((meal: any) => {
      if (!meal?.id) return meal;
      return { id: meal.id, title: cleanTitle(meal.title || '') };
    });
  }

  if (!parsed.weeklyMenu?.length) throw new Error("Gemini no generó el menú. Intenta de nuevo.");
  return parsed as AIMenuResponse;
}

// ─── Transform response → MenuPlanData ───────────────────────────────────────

function transformToMenuPlanData(
  mealStructure: AIMealEntry[],
  response:      AIMenuResponse,
  nutritionist:  any,
  patient:       Patient,
  vetData:       any,
  portions:      any,
  linkedDate?:   string,
): MenuPlanData {
  const mealOrder  = mealStructure.map(m => m.id);
  const mealLabels: Record<string, string> = {};
  mealStructure.forEach(m => { mealLabels[m.id] = m.label; });

  const weeklyMenu: any = {};

  weeklyMenu.domingo = {
    note:      response.domingoV1?.note || '',
    hydration: response.domingoV1?.hydration || '2.5L Agua/Día',
  };

  if (response.domingoV2?.meals?.length) {
    const domV2: any = {
      mealsOrder: mealOrder,
      note:       response.domingoV2.note || '',
      hydration:  response.domingoV2.hydration || '2.5L Agua/Día',
    };
    toArray(response.domingoV2.meals).forEach((meal: any) => {
      if (!meal?.id) return;
      domV2[meal.id] = { title: meal.title || '', label: mealLabels[meal.id] || meal.id };
    });
    weeklyMenu.domingoV2 = domV2;
  }

  toArray(response.weeklyMenu).forEach((dayEntry: any) => {
    if (!dayEntry?.dayKey) return;
    const dayObj: any = { mealsOrder: mealOrder };
    toArray(dayEntry.meals).forEach((meal: any) => {
      if (!meal?.id) return;
      dayObj[meal.id] = { title: meal.title || '', label: mealLabels[meal.id] || meal.id };
    });
    weeklyMenu[dayEntry.dayKey] = dayObj;
  });

  WEEKDAY_KEYS.forEach(day => {
    if (!weeklyMenu[day]) {
      const dayObj: any = { mealsOrder: mealOrder };
      mealOrder.forEach(id => { dayObj[id] = { title: '', label: mealLabels[id] || id }; });
      weeklyMenu[day] = dayObj;
    }
  });

  const measurement = linkedDate
    ? patient.measurements?.find(m => m.date === linkedDate)
    : patient.measurements?.[0];

  return {
    patient: response.patient || {
      name:   `${patient.firstName} ${patient.lastName}`,
      age:    vetData.age || measurement?.age || 0,
      weight: measurement?.weight || 0,
      height: measurement?.height || 0,
      fatPct: measurement?.bodyFat || 0,
    },
    kcal:    response.kcal || vetData.kcalToWork || 0,
    portions,
    weeklyMenu,
    nutritionist,
    recommendations: response.recommendations,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateStructuredMenu = async (
  patient:        Patient,
  vetData:        any,
  portions:       any,
  references:     { title: string; data: MenuReferenceData }[],
  nutritionist:   any,
  linkedDate?:    string,
  templateDesign: MenuTemplateDesign = 'plantilla_v1',
  scope:          'page1' | 'page2' | 'both' = 'both',
  bioimpedance?:  any
): Promise<{ plan: MenuPlanData; rationale: string }> => {

  const aiConfig = store.getUserProfile()?.menuAIConfig || {
    prompt:               DEFAULT_MENU_PROMPT_SUFFIX,
    ideas:                { desayuno: [], refaccion: [], almuerzo: [], merienda: [], cena: [] },
    fields:               DEFAULT_PATIENT_FIELDS,
    recommendationIdeas:  { preparacion: [], restricciones: [], habitos: [], organizacion: [] },
  };

  const foodIdeasCtx = buildFoodIdeasContext(aiConfig.ideas);
  const recIdeasCtx  = buildRecommendationIdeasContext(
    aiConfig.recommendationIdeas || { preparacion: [], restricciones: [], habitos: [], organizacion: [] }
  );
  const promptSuffix = (aiConfig.prompt || DEFAULT_MENU_PROMPT_SUFFIX)
    .replace('{foodIdeas}', foodIdeasCtx)
    .replace('{recommendationIdeas}', recIdeasCtx);

  const refContext = buildRefContext(references);
  const patientCtx = buildPatientContext(patient, vetData, portions, aiConfig.fields, linkedDate);

  const mealStructure = extractMealStructure(portions, vetData);

  if (!mealStructure.length) {
    throw new Error("Para generar con IA, primero haz click en 'Iniciar Menú en Blanco', luego edita la 'Tabla de Porciones' con la distribución por tiempo de comida, y después genera con IA.");
  }

  let bioCtx = "";
  if (bioimpedance && aiConfig.fields.bioimpedancia) {
    bioCtx = `Bioimpedancia: ${bioimpedance.weight}kg | Grasa ${bioimpedance.fat_pct}% | Músculo ${bioimpedance.muscle_pct}% | Visc ${bioimpedance.visceral_fat} | Metab ${bioimpedance.basal_metabolism}kcal | Edad Met ${bioimpedance.metabolic_age} | Agua ${bioimpedance.body_water}% | Ósea ${bioimpedance.bone_mass}kg`;
  }

  const scopeInstr = scope === 'page1' ? "ALCANCE: Solo menú semanal. Recomendaciones breves."
    : scope === 'page2'                 ? "ALCANCE: Solo recomendaciones. Menú genérico."
    :                                     "ALCANCE: Menú completo + recomendaciones detalladas.";

  const kcal = vetData.kcalToWork || 0;

  try {
    const menuResponse = await generateWeeklyMenu(
      mealStructure, patientCtx, bioCtx, refContext,
      promptSuffix, kcal, scopeInstr,
    );

    const plan = transformToMenuPlanData(
      mealStructure, menuResponse, nutritionist, patient,
      vetData, portions, linkedDate,
    );

    return { plan, rationale: menuResponse.rationale || "" };
  } catch (error) {
    console.error("AI Generation error:", error);
    throw error;
  }
};

// ─── Build full 7-day reference text (all days, not just 3) ──────────────────

const ALL_DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function buildFullRefContext(references: { title: string; data: MenuReferenceData }[]): string {
  return references.map((ref, idx) => {
    const { data } = ref;
    const dayLines = ALL_DAYS.map(dayKey => {
      const day = data.weeklyMenu[dayKey];
      const meals = data.meals.map(slot => {
        const text = day?.[slot.id]?.trim();
        if (!text) return null;
        return `    ${slot.label}:\n      ${text.split('\n').join('\n      ')}`;
      }).filter(Boolean).join('\n');
      return meals ? `  ${dayKey.toUpperCase()}:\n${meals}` : null;
    }).filter(Boolean).join('\n');

    const domNote = data.weeklyMenu['domingo']?.note?.trim();
    const domLine = domNote ? `  DOMINGO (día libre):\n    ${domNote}` : '';

    return `REFERENCIA_${idx + 1} [${data.kcal} kcal · ${data.type}]:\n${dayLines}${domLine ? '\n' + domLine : ''}`;
  }).join('\n\n═══════════════════\n\n');
}

// ─── Mix de plantillas de referencia ─────────────────────────────────────────

export const generateMixFromReferences = async (
  patient:      Patient,
  vetData:      any,
  portions:     any,
  references:   { title: string; data: MenuReferenceData }[],
  nutritionist: any,
  evaluationId?: string | null,
  bioimpedance?: any
): Promise<{ plan: MenuPlanData; rationale: string }> => {

  if (references.length < 2) {
    throw new Error('Se necesitan al menos 2 referencias seleccionadas para usar Mix de plantillas.');
  }

  const mealStructure = extractMealStructure(portions, vetData);
  if (!mealStructure.length) {
    throw new Error('Para generar el Mix, primero define la tabla de porciones por tiempo de comida.');
  }

  const portionSummary = buildPortionSummary(mealStructure);
  const mealExamples   = mealStructure.map(m => buildMealJsonTemplate(m)).join(',\n');
  const fullRefCtx     = buildFullRefContext(references);

  const patientLine = `${patient.firstName} ${patient.lastName} | ${vetData.age || patient.clinical?.age} años | ${patient.clinical?.sex} | ${vetData.kcalToWork} kcal`;
  let bioCtx = '';
  if (bioimpedance) {
    bioCtx = `Bioimpedancia: Peso ${bioimpedance.weight}kg | Grasa ${bioimpedance.fat_pct}% | Músculo ${bioimpedance.muscle_pct}% | Visc ${bioimpedance.visceral_fat} | TMB ${bioimpedance.basal_metabolism}kcal`;
  }

  const allergies = patient.clinical?.allergies ? `\nALERGIAS/RESTRICCIONES ABSOLUTAS (no incluir bajo ningún motivo): ${patient.clinical.allergies}` : '';
  const excluded  = patient.dietary?.preferences ? `\nEvita: ${patient.dietary.preferences}` : '';

  const numRefs = references.length;
  const assignmentLines = ALL_DAYS.map((day, i) => {
    const refIdx = (i % numRefs) + 1;
    return `  - ${day.toUpperCase()}: base en REFERENCIA_${refIdx}`;
  }).join('\n');

  const aiConfig = store.getUserProfile()?.menuAIConfig || {
    prompt: DEFAULT_MENU_PROMPT_SUFFIX,
    ideas: { desayuno: [], refaccion: [], almuerzo: [], merienda: [], cena: [] },
    fields: DEFAULT_PATIENT_FIELDS,
    recommendationIdeas: { preparacion: [], restricciones: [], habitos: [], organizacion: [] },
  };
  const mixFoodIdeasCtx = buildFoodIdeasContext(aiConfig.ideas);

  const prompt = `Eres nutricionista experta. Tu tarea es generar un menú semanal que sea un MIX FIEL de las ${numRefs} referencias alimentarias proporcionadas.

PACIENTE: ${patientLine}
${bioCtx}${allergies}${excluded}

════════════════════════════════════════
REFERENCIAS COMPLETAS (TU PRINCIPAL FUENTE DE ALIMENTOS):
════════════════════════════════════════
${fullRefCtx}

════════════════════════════════════════
REGLAS ABSOLUTAS — NO NEGOCIABLES:
════════════════════════════════════════
1. Usa principalmente alimentos que aparecen en las referencias. Si la tabla de porciones requiere un grupo alimentario que no está en la referencia asignada para ese tiempo de comida, selecciona un alimento apropiado de ese grupo desde otras referencias o usa un alimento típico de ese grupo.
2. Los alimentos de cada día deben provenir principalmente de la referencia asignada a ese día (ver asignación abajo). Puedes combinar elementos de distintas referencias dentro del mismo día, siempre dentro del universo de alimentos de las referencias.
3. OBLIGATORIO respetar EXACTAMENTE las porciones por tiempo de comida definidas en la tabla de porciones. Cada grupo con porciones > 0 DEBE aparecer en ese tiempo con la cantidad correcta. Si un grupo tiene 0 para ese tiempo, NO incluirlo.
4. Puedes repetir alimentos o preparaciones entre días si es necesario o conveniente para el plan.
5. Si las referencias muestran "½ taza arroz + frijoles", respeta esa combinación como unidad. No separes alimentos que en la referencia aparecen juntos como componente de una misma porción.
6. Sábado puede tener ligeras variaciones creativas usando alimentos de las referencias.
7. Mantén el estilo de escritura de las referencias: natural, conciso, medidas caseras (tazas, oz, cdas), máximo 4 líneas por tiempo de comida. NUNCA escribir solo el nombre del alimento sin medida.

ASIGNACIÓN DE REFERENCIA POR DÍA (guía de distribución):
${assignmentLines}
  - SABADO: libre mix de todas las referencias
  - DOMINGO v1: día libre (solo nota y hidratación)
  - DOMINGO v2: menú completo usando alimentos de las referencias

DISTRIBUCIÓN DE PORCIONES (nutricionista — respetar exactamente):
${portionSummary}

CÓMO ESCRIBIR EL CAMPO "title": Escribe ALIMENTOS REALES con medidas caseras, una línea por grupo activo en el orden indicado. NUNCA escribas el nombre del grupo — escribe el alimento concreto.
CORRECTO: "3 oz pollo a la plancha\\n½ taza arroz\\n½ taza frijoles\\n1 taza ensalada mixta"
INCORRECTO (PROHIBIDO): "3 CARNES\\n2 CEREALES\\n1 VEGETAL" — esto nunca debe aparecer en el menú.
Cada grupo con porciones > 0 DEBE aparecer. Si tiene 0, NO incluirlo.${mixFoodIdeasCtx ? `\n\nPREFERENCIAS DE COMIDAS (tomar en cuenta al elegir alimentos):\n${mixFoodIdeasCtx}` : ''}

RATIONALE: Explica brevemente (3-5 frases) de qué referencias tomaste cada día, cómo adaptaste las porciones y si tuviste que hacer alguna sustitución menor.

Responde SOLO con JSON válido (sin markdown, sin texto extra). Cada meal: {"id":"...","title":"línea1\nlínea2\n..."}:
{
  "weeklyMenu": [
    {"dayKey":"lunes","meals":[
${mealExamples}
    ]},
    {"dayKey":"martes","meals":[...]},{"dayKey":"miercoles","meals":[...]},
    {"dayKey":"jueves","meals":[...]},{"dayKey":"viernes","meals":[...]},
    {"dayKey":"sabado","meals":[...]}
  ],
  "domingoV1":{"note":"...","hydration":"2.5L Agua/Día"},
  "domingoV2":{"note":"...","hydration":"2.5L Agua/Día","meals":[...]},
  "patient":{"name":"${patient.firstName} ${patient.lastName}","age":${vetData.age || patient.clinical?.age || 0},"weight":${vetData.weight || 0},"height":${vetData.height || 0},"fatPct":0},
  "kcal":${vetData.kcalToWork || 0},
  "recommendations":{"preparacion":[],"restricciones":[],"habitos":[],"organizacion":[]},
  "rationale":"..."
}`;

  const resp   = await aiService.invokeGemini(prompt, 'menu', MENU_SYSTEM_INSTRUCTION);
  const parsed = parseGeminiJson(resp.output);

  parsed.weeklyMenu = toArray(parsed.weeklyMenu).map((day: any) => {
    if (!day?.dayKey) return day;
    return {
      dayKey: day.dayKey,
      meals:  toArray(day.meals).map((meal: any) => {
        if (!meal?.id) return meal;
        return { id: meal.id, title: cleanTitle(meal.title || '') };
      }),
    };
  });

  if (parsed.domingoV2?.meals) {
    parsed.domingoV2.meals = toArray(parsed.domingoV2.meals).map((meal: any) => {
      if (!meal?.id) return meal;
      return { id: meal.id, title: cleanTitle(meal.title || '') };
    });
  }

  if (!parsed.weeklyMenu?.length) throw new Error('La IA no generó el mix de referencias. Intenta de nuevo.');

  const plan = transformToMenuPlanData(mealStructure, parsed as AIMenuResponse, nutritionist, patient, vetData, portions);
  return { plan, rationale: parsed.rationale || '' };
};

// ─── Adaptar porciones de referencia copiada ─────────────────────────────────

export const adaptPortionsFromMenu = async (
  currentMenu:  MenuPlanData,
  portions:     any,
  patient:      Patient,
  vetData:      any,
  nutritionist: any,
): Promise<{ plan: MenuPlanData; rationale: string }> => {

  const mealStructure = extractMealStructure(portions, vetData);
  if (!mealStructure.length) {
    throw new Error('No se encontró tabla de porciones. Define la distribución por tiempo de comida antes de adaptar.');
  }

  const portionSummary = buildPortionSummary(mealStructure);
  const mealExamples   = mealStructure.map(m => buildMealJsonTemplate(m)).join(',\n');

  // Serializar el menú actual como texto para enviarlo a la IA
  const menuLines: string[] = [];
  for (const dayKey of ALL_DAYS) {
    const dayData = (currentMenu.weeklyMenu as any)?.[dayKey];
    if (!dayData) continue;
    const mealsOrder: string[] = dayData.mealsOrder || mealStructure.map(m => m.id);
    const dayLines = mealsOrder.map((slotId: string) => {
      const mealText = dayData[slotId]?.title?.trim();
      const label    = dayData[slotId]?.label || slotId;
      if (!mealText) return null;
      return `    ${label}:\n      ${mealText.split('\n').join('\n      ')}`;
    }).filter(Boolean).join('\n');
    if (dayLines) menuLines.push(`  ${dayKey.toUpperCase()}:\n${dayLines}`);
  }

  // Incluir domingoV2 si existe
  const domV2 = (currentMenu.weeklyMenu as any)?.domingoV2;
  if (domV2) {
    const mealsOrder: string[] = domV2.mealsOrder || mealStructure.map(m => m.id);
    const domLines = mealsOrder.map((slotId: string) => {
      const mealText = domV2[slotId]?.title?.trim();
      const label    = domV2[slotId]?.label || slotId;
      if (!mealText) return null;
      return `    ${label}:\n      ${mealText.split('\n').join('\n      ')}`;
    }).filter(Boolean).join('\n');
    if (domLines) menuLines.push(`  DOMINGO v2:\n${domLines}`);
  }

  const patientLine = `${patient.firstName} ${patient.lastName} | ${vetData.age || patient.clinical?.age} años | ${patient.clinical?.sex} | ${vetData.kcalToWork} kcal`;
  const allergies   = patient.clinical?.allergies ? `\nALERGIAS/RESTRICCIONES (respetar): ${patient.clinical.allergies}` : '';

  const adaptAiConfig = store.getUserProfile()?.menuAIConfig || {
    prompt: DEFAULT_MENU_PROMPT_SUFFIX,
    ideas: { desayuno: [], refaccion: [], almuerzo: [], merienda: [], cena: [] },
    fields: DEFAULT_PATIENT_FIELDS,
    recommendationIdeas: { preparacion: [], restricciones: [], habitos: [], organizacion: [] },
  };
  const adaptFoodIdeasCtx = buildFoodIdeasContext(adaptAiConfig.ideas);

  const prompt = `Eres nutricionista experta. Tu tarea es ADAPTAR el menú semanal existente para que coincida con las metas nutricionales por tiempo de comida.

PACIENTE: ${patientLine}${allergies}

════════════════════════════════════════
MENÚ ACTUAL (conserva estos alimentos — solo ajusta cantidades):
════════════════════════════════════════
${menuLines.join('\n\n')}

════════════════════════════════════════
METAS NUTRICIONALES OBJETIVO (cuántas porciones de cada grupo por tiempo):
════════════════════════════════════════
${portionSummary}

════════════════════════════════════════
REGLAS ABSOLUTAS — NO NEGOCIABLES:
════════════════════════════════════════
1. CONSERVA los alimentos del menú actual. Solo cambia la cantidad (medida) para que coincida con las porciones objetivo.
2. Si las metas requieren un grupo que NO estaba en ese tiempo del menú original, AGRÉGALO con un alimento concreto apropiado (ej: si falta 1 Lácteo, agrega "1 vaso de leche descremada"; si falta 1 Fruta, agrega "1 manzana mediana").
3. NUNCA escribas el nombre del grupo en el menú — siempre escribe el alimento real con su medida casera.
4. Si la meta es 0 para un grupo que sí está en el menú actual, ELIMÍNALO.
5. Si un tiempo no tiene porciones asignadas, cópialo exactamente igual.
6. Estilo: medidas caseras, cantidad siempre antes del alimento, máx 4 líneas por tiempo.
7. En "title", una línea por grupo activo en el orden de las metas, separadas por \n.

CÓMO ESCRIBIR "title" CORRECTO:
- BIEN: "3 oz pollo a la plancha\\n½ taza arroz\\n½ taza frijoles\\n1 taza ensalada"
- MAL (PROHIBIDO): "3 CARNES\\n2 CEREALES\\n1 VEGETAL" — nunca nombres de grupos.

8. Mantén las notas de domingo v1 y v2 sin cambios.${adaptFoodIdeasCtx ? `\n\nPREFERENCIAS DE COMIDAS (usar al agregar grupos faltantes):\n${adaptFoodIdeasCtx}` : ''}

RATIONALE: Explica brevemente (2-4 frases) qué ajustes realizaste y por qué son correctos.

Responde SOLO con JSON válido (sin markdown, sin texto extra). Cada meal: {"id":"...","title":"línea1\nlínea2\n..."}:
{
  "weeklyMenu": [
    {"dayKey":"lunes","meals":[
${mealExamples}
    ]},
    {"dayKey":"martes","meals":[...]},{"dayKey":"miercoles","meals":[...]},
    {"dayKey":"jueves","meals":[...]},{"dayKey":"viernes","meals":[...]},
    {"dayKey":"sabado","meals":[...]}
  ],
  "domingoV1":{"note":"${(currentMenu.weeklyMenu as any)?.domingo?.note || ''}","hydration":"${(currentMenu.weeklyMenu as any)?.domingo?.hydration || '2.5L Agua/Día'}"},
  "domingoV2":{"note":"${domV2?.note || ''}","hydration":"${domV2?.hydration || '2.5L Agua/Día'}","meals":[...]},
  "patient":{"name":"${patient.firstName} ${patient.lastName}","age":${vetData.age || patient.clinical?.age || 0},"weight":${vetData.weight || 0},"height":${vetData.height || 0},"fatPct":0},
  "kcal":${vetData.kcalToWork || 0},
  "recommendations":{"preparacion":[],"restricciones":[],"habitos":[],"organizacion":[]},
  "rationale":"..."
}`;

  const resp   = await aiService.invokeGemini(prompt, 'menu', MENU_SYSTEM_INSTRUCTION);
  const parsed = parseGeminiJson(resp.output);

  parsed.weeklyMenu = toArray(parsed.weeklyMenu).map((day: any) => {
    if (!day?.dayKey) return day;
    return {
      dayKey: day.dayKey,
      meals:  toArray(day.meals).map((meal: any) => {
        if (!meal?.id) return meal;
        return { id: meal.id, title: cleanTitle(meal.title || '') };
      }),
    };
  });

  if (parsed.domingoV2?.meals) {
    parsed.domingoV2.meals = toArray(parsed.domingoV2.meals).map((meal: any) => {
      if (!meal?.id) return meal;
      return { id: meal.id, title: cleanTitle(meal.title || '') };
    });
  }

  // Preservar recomendaciones existentes
  const planBase = transformToMenuPlanData(mealStructure, parsed as AIMenuResponse, nutritionist, patient, vetData, portions);
  const plan: MenuPlanData = {
    ...planBase,
    recommendations: currentMenu.recommendations || planBase.recommendations,
    sectionTitles:   currentMenu.sectionTitles   || planBase.sectionTitles,
  };

  return { plan, rationale: parsed.rationale || '' };
};

// ─── Extract key lab findings from long interpretation text ──────────────────

export function extractLabKeyFindings(text: string, maxLength = 350): string {
  if (!text?.trim()) return '';

  // Indicadores de anormalidad — si no hay ninguno, la línea se descarta
  const IS_ABNORMAL = /\b(ALTO|BAJO|ELEVADO|ANORMAL|DEFICIENCIA|ALTERADO|AUMENTADO|DISMINUIDO|CRÍTICO|LÍMITE|BORDERLINE|POSITIVO|INSUFICIENCIA|DÉFICIT|PREDIABETES|RESISTENCIA|alto|bajo|elevado|anormal|deficiencia|alterado|aumentado|disminuido|crítico|límite|insuficiencia|déficit|prediabetes|resistencia a la insulina|fuera de rango|por encima|por debajo)\b/i;

  // Frases que indican normalidad — descartar aunque contengan keywords
  const IS_NORMAL = /\b(normal|dentro de (rango|límites)|sin alteracion|sin cambio|adecuado|óptimo|en rango|dentro del rango|valores normales|resultado normal|no se observa|sin evidencia)\b/i;

  // Marcadores con impacto nutricional directo
  const NUTRITIONAL_RELEVANCE = /\b(glucosa|glicemia|HbA1c|hemoglobina glicosilada|insulina|colesterol|triglicérid|LDL|HDL|VLDL|hemoglobin|ferritin|hierro|vitamina|vitamina D|vitamina B|folato|ácido fólico|zinc|magnesio|calcio|proteína|albúmina|tiroides|TSH|T3|T4|ácido úrico|creatinin|urea|transaminasa|ALT|AST|bilirrubina|hígado|riñón|anemia|desnutrición|inflamación|PCR|proteína C reactiva)\b/i;

  const raw = text.replace(/\r/g, '').trim();
  const sentences = raw
    .split(/[.\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const important = sentences.filter(s => {
    if (IS_NORMAL.test(s)) return false;
    if (!IS_ABNORMAL.test(s)) return false;
    return true;
  }).filter(s => NUTRITIONAL_RELEVANCE.test(s) || IS_ABNORMAL.test(s));

  if (!important.length) return '';

  let result = '';
  for (const line of important.slice(0, 5)) {
    const candidate = result ? result + ' | ' + line : line;
    if (candidate.length > maxLength) break;
    result = candidate;
  }
  return result || important[0].substring(0, maxLength);
}

// ─── Compact patient restrictions string ─────────────────────────────────────

function buildPatientRestrictions(patient: Patient, vetData: any): string {
  const parts: string[] = [];
  if (patient.firstName) parts.push(`${patient.firstName} ${patient.lastName}`);
  if (vetData?.kcalToWork) parts.push(`${vetData.kcalToWork} kcal`);
  if (patient.clinical?.allergies) parts.push(`ALERGIAS: ${patient.clinical.allergies}`);
  if (patient.clinical?.diagnosis) parts.push(`Dx: ${patient.clinical.diagnosis}`);
  if (patient.clinical?.consultmotive) parts.push(`Meta: ${patient.clinical.consultmotive}`);
  if (patient.clinical?.medications) parts.push(`Med: ${patient.clinical.medications}`);
  const de = patient.dietaryEvaluations?.[0];
  if (de?.excludedFoods) parts.push(`Evita: ${de.excludedFoods}`);
  if (patient.dietary?.preferences) parts.push(`Pref: ${patient.dietary.preferences}`);
  return parts.join(' | ');
}

// ─── Regenerate a single day ──────────────────────────────────────────────────

export const regenerateSingleDay = async (
  currentMenu: MenuPlanData,
  dayKey: string,
  patient: Patient,
  vetData: any,
): Promise<MenuPlanData> => {

  const aiConfig = store.getUserProfile()?.menuAIConfig || {
    prompt: DEFAULT_MENU_PROMPT_SUFFIX,
    ideas: { desayuno: [], refaccion: [], almuerzo: [], merienda: [], cena: [] },
    fields: DEFAULT_PATIENT_FIELDS,
    recommendationIdeas: { preparacion: [], restricciones: [], habitos: [], organizacion: [] },
  };

  const portions = (currentMenu as any).portions;
  const mealStructure = extractMealStructure(portions, {});
  if (!mealStructure.length) throw new Error('No se encontró tabla de porciones en el menú actual.');

  const portionSummary = buildPortionSummary(mealStructure);
  const restrictions = buildPatientRestrictions(patient, vetData);

  // Compact style context: 2 other days at most
  const otherDays = ALL_DAYS.filter(d => d !== dayKey).slice(0, 2);
  const styleCtx = otherDays.map(d => {
    const dayData = (currentMenu.weeklyMenu as any)?.[d];
    if (!dayData) return null;
    const mealsOrder: string[] = dayData.mealsOrder || mealStructure.map(m => m.id);
    const lines = mealsOrder.map((id: string) => {
      const t = dayData[id]?.title?.trim();
      if (!t) return null;
      const label = dayData[id]?.label || id;
      return `  ${label}: ${t.split('\n')[0]}`;
    }).filter(Boolean).join('\n');
    return lines ? `${d.toUpperCase()}:\n${lines}` : null;
  }).filter(Boolean).join('\n\n');

  const mealExamples = mealStructure.map(m => buildMealJsonTemplate(m)).join(',\n');
  const foodIdeasCtx = buildFoodIdeasContext(aiConfig.ideas);

  const prompt = `Nutricionista experta. Regenera SOLO el día ${dayKey.toUpperCase()} con opciones variadas y apetitosas.

PACIENTE: ${restrictions}

METAS NUTRICIONALES POR TIEMPO (cuántas porciones de cada grupo):
${portionSummary}

ESTILO DE REFERENCIA (mantener consistencia con el resto del menú):
${styleCtx || 'Comida guatemalteca típica, medidas caseras.'}
${foodIdeasCtx ? `\nPREFERENCIAS: ${foodIdeasCtx}` : ''}

REGLAS: Escribe ALIMENTOS REALES con medidas caseras — nunca el nombre del grupo.
CORRECTO: "2 huevos revueltos\\n1 vaso leche\\n2 tortillas\\n1 naranja"
INCORRECTO (PROHIBIDO): "2 CARNES\\n1 LÁCTEO\\n2 CEREALES\\n1 FRUTA"
Cada grupo con porciones > 0 DEBE aparecer. Si tiene 0, NO incluirlo. Máx 4 líneas por tiempo.

Solo JSON (un solo día):
{"dayKey":"${dayKey}","meals":[
${mealExamples}
]}`;

  const resp = await aiService.invokeGemini(prompt, 'menu', MENU_SYSTEM_INSTRUCTION);
  const parsed = parseGeminiJson(resp.output);

  const dayResult = parsed?.dayKey ? parsed : parsed?.weeklyMenu?.[0] ?? parsed;
  const meals = toArray(dayResult?.meals || parsed?.meals || []);
  if (!meals.length) throw new Error(`La IA no generó el día ${dayKey}. Intenta de nuevo.`);

  const mealLabels: Record<string, string> = {};
  mealStructure.forEach(m => { mealLabels[m.id] = m.label; });

  const newDayObj: any = { mealsOrder: mealStructure.map(m => m.id) };
  meals.forEach((meal: any) => {
    if (!meal?.id) return;
    newDayObj[meal.id] = { title: cleanTitle(meal.title || ''), label: mealLabels[meal.id] || meal.id };
  });

  return {
    ...currentMenu,
    weeklyMenu: { ...(currentMenu.weeklyMenu as any), [dayKey]: newDayObj } as any,
  };
};

// ─── Regenerate one meal slot across all days ─────────────────────────────────

export const regenerateMealSlot = async (
  currentMenu: MenuPlanData,
  mealSlotId: string,
  mealLabel: string,
  patient: Patient,
  vetData: any,
): Promise<MenuPlanData> => {

  const aiConfig = store.getUserProfile()?.menuAIConfig || {
    prompt: DEFAULT_MENU_PROMPT_SUFFIX,
    ideas: { desayuno: [], refaccion: [], almuerzo: [], merienda: [], cena: [] },
    fields: DEFAULT_PATIENT_FIELDS,
    recommendationIdeas: { preparacion: [], restricciones: [], habitos: [], organizacion: [] },
  };

  const portions = (currentMenu as any).portions;
  const mealStructure = extractMealStructure(portions, {});
  const slotEntry = mealStructure.find(m => m.id === mealSlotId);
  if (!slotEntry) throw new Error(`Tiempo de comida "${mealSlotId}" no encontrado.`);

  const restrictions = buildPatientRestrictions(patient, vetData);

  const active = (['lacteos', 'vegetales', 'frutas', 'cereales', 'carnes', 'grasas'] as const)
    .filter(g => slotEntry.portions[g] > 0);

  const portionLines = active.map(g => {
    const n = slotEntry.portions[g];
    const ex = GROUP_EXAMPLES[g]?.[n] ?? `${n} porciones`;
    return `· ${GROUP_LABELS[g]}: ${n} porción${n > 1 ? 'es' : ''} (equivale a ${ex})`;
  }).join('\n');

  const currentValues = ALL_DAYS.map(d => {
    const t = (currentMenu.weeklyMenu as any)?.[d]?.[mealSlotId]?.title?.trim();
    return t ? `  ${d.toUpperCase()}: ${t.split('\n')[0]}` : null;
  }).filter(Boolean).join('\n');

  const foodIdeasCtx = buildFoodIdeasContext(aiConfig.ideas);

  const prompt = `Nutricionista experta. Cambia SOLO el tiempo "${mealLabel}" en los 6 días. Genera opciones variadas y apetitosas.

PACIENTE: ${restrictions}

METAS NUTRICIONALES PARA "${mealLabel}" (cuántas porciones de cada grupo):
${portionLines || 'Sin porciones definidas — omitir este tiempo.'}

VALORES ACTUALES (reemplazar con opciones nuevas variadas):
${currentValues || 'Sin datos previos.'}
${foodIdeasCtx ? `\nPREFERENCIAS: ${foodIdeasCtx}` : ''}

REGLAS: Escribe ALIMENTOS REALES con medidas caseras. NUNCA el nombre del grupo.
CORRECTO: "3 oz pechuga a la plancha\\n½ taza arroz\\n1 taza ensalada"
INCORRECTO (PROHIBIDO): "3 CARNES\\n2 CEREALES\\n1 VEGETAL"
Máx 4 líneas por tiempo. Cantidad siempre antes del alimento.

Solo JSON — array de 6 objetos:
[
  {"dayKey":"lunes","id":"${mealSlotId}","title":"línea1\\nlínea2"},
  {"dayKey":"martes","id":"${mealSlotId}","title":"..."},
  {"dayKey":"miercoles","id":"${mealSlotId}","title":"..."},
  {"dayKey":"jueves","id":"${mealSlotId}","title":"..."},
  {"dayKey":"viernes","id":"${mealSlotId}","title":"..."},
  {"dayKey":"sabado","id":"${mealSlotId}","title":"..."}
]`;

  const resp = await aiService.invokeGemini(prompt, 'menu', MENU_SYSTEM_INSTRUCTION);
  const parsed = parseGeminiJson(resp.output);
  const items = toArray(parsed);

  if (!items.length) throw new Error(`La IA no generó los ${mealLabel}. Intenta de nuevo.`);

  const newWeeklyMenu = { ...(currentMenu.weeklyMenu as any) };
  items.forEach((item: any) => {
    if (!item?.dayKey || !item?.id) return;
    const existing = newWeeklyMenu[item.dayKey] || {};
    newWeeklyMenu[item.dayKey] = {
      ...existing,
      [item.id]: { title: cleanTitle(item.title || ''), label: existing[item.id]?.label || mealLabel },
    };
  });

  return { ...currentMenu, weeklyMenu: newWeeklyMenu as any };
};

// ─── Other exports ────────────────────────────────────────────────────────────

export const generateDietaryAdvice = async (patient: Patient): Promise<string> => {
  const sports = (patient.sportsProfile || [])
    .map(s => `${s.sport} (${s.daysPerWeek} d/sem)`).join(' | ') || 'No especificado';
  const prompt = `
Actúa como un asistente nutricionista experto. 
Analiza el perfil del paciente y proporciona recomendaciones dietéticas con un plan de comidas de muestra para 1 día.
Nombre: ${patient.firstName} ${patient.lastName}
Objetivos: ${patient.clinical.consultmotive}
Deporte: ${sports}
Alergias: ${patient.clinical.allergies}
Preferencias: ${patient.dietary.preferences}
Diagnóstico: ${patient.clinical.diagnosis} | Historial familiar: ${patient.clinical.familyHistory} | Medicamentos: ${patient.clinical.medications}
Responde en Markdown limpio, tono alentador y profesional en Español.
  `;
  try {
    const response = await aiService.invokeGemini(prompt, 'general');
    return response.output?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el consejo.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Error al conectar con el servicio de IA.";
  }
};

export const generateMenuFromMeasurements = async (patient: Patient, measurement: Measurement): Promise<string> => {
  const sports = (patient.sportsProfile || [])
    .map(s => `${s.sport} (${s.daysPerWeek} d/sem)`).join(' | ') || 'No especificado';
  const stats = `Peso: ${measurement.weight}kg | Talla: ${measurement.height}cm | IMC: ${measurement.imc?.toFixed(1)} | % Grasa: ${measurement.bodyFat?.toFixed(1)}% | Músculo: ${measurement.muscleKg?.toFixed(1)}kg`;
  const prompt = `
Nutricionista deportivo experto. Crea un menú modelo para 1 día adaptado a las medidas del paciente.
Paciente: ${patient.firstName} ${patient.lastName} | ${patient.clinical.age} años | ${patient.clinical.sex}
Deporte: ${sports} | Meta: ${patient.clinical.consultmotive}
Alergias: ${patient.clinical.allergies} | Alimentos a evitar: ${patient.dietaryEvaluations?.[0]?.excludedFoods || 'Ninguno'}
Medidas: ${stats}
Reglas: español, tono motivador, medidas caseras (no gramos), bullets para alimentos, negritas para tiempos.
Estructura: Desayuno → Media Mañana → Almuerzo → Media Tarde → Cena → Tip del Coach.
Termina con 2 líneas sobre por qué este plan ayuda a su somatotipo.
  `;
  try {
    const response = await aiService.invokeGemini(prompt, 'general');
    return response.output?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el menú.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Error al conectar con el servicio de IA.";
  }
};