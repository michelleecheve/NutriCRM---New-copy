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

const MENU_SYSTEM_INSTRUCTION = `Eres nutricionista deportivo experto. Generas menús semanales personalizados en español usando comida guatemalteca típica.

${PORTION_EQUIVALENTS}

ESTILO: Natural, compacto, medidas caseras, máx 4 líneas por tiempo. Sin corchetes, sin "porción de".
REGLA: SIEMPRE escribir la cantidad antes del alimento. NUNCA escribir solo el nombre del alimento sin medida. Correcto: "1 taza de brócoli al vapor", "½ taza de espinaca cocida". Incorrecto: "Brócoli al vapor", "Espinaca cocida".

Responde SOLO con JSON válido, sin texto adicional ni markdown.`;

// ─── Grupos de porciones ──────────────────────────────────────────────────────

const GROUPS = ['lacteos', 'vegetales', 'frutas', 'cereales', 'carnes', 'grasas'] as const;

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
  desayuno:    'Desayuno',
  refaccion1:  'Refacción 1',
  refaccion_1: 'Refacción 1',
  almuerzo:    'Almuerzo',
  refaccion2:  'Refacción 2',
  refaccion_2: 'Refacción 2',
  cena:        'Cena',
};

const DEFAULT_MEALS_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];

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
  const fields: string[] = [`        "id": "${meal.id}"`];
  for (const g of GROUPS) {
    const n = meal.portions[g];
    if (n > 0) fields.push(`        "${g}_${n}": "..."`);
  }
  return `      {\n${fields.join(',\n')}\n      }`;
}

// ─── Build compact portion summary ───────────────────────────────────────────

function buildPortionSummary(meals: AIMealEntry[]): string {
  return meals.map(m => {
    const active = GROUPS.filter(g => m.portions[g] > 0).map(g => `${g}_${m.portions[g]}`);
    return `${m.label} (${m.id}): ${active.length ? active.join(', ') : 'sin porciones'}`;
  }).join('\n');
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
    const labs = (patient.labs || []).filter((l: any) => l?.date === linkedDate && l?.labInterpretation?.trim());
    if (labs.length)
      lines.push(`Labs: ${labs.map((l: any) => `${l.name}: ${l.labInterpretation.trim().substring(0, 200)}`).join(' | ')}`);
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

  const prompt = `Nutricionista deportivo. Genera menú semanal personalizado.
${scopeInstr}

PACIENTE:
${patientCtx}
${bioCtx}
Kcal: ${kcal}

PORCIONES POR TIEMPO (definidas por la nutricionista — NO MODIFICAR):
${portionSummary}

El número en cada campo indica cuántas porciones incluir.
carnes_3 = 3 oz de proteína. lacteos_2 = 2 porciones de lácteo. Etc.
Si un grupo no aparece, NO incluir alimentos de ese grupo.

REFERENCIAS — COPIA ESTE ESTILO de escritura e ideas de comidas:
${refContext}

JSON — cada meal tiene "id" + solo campos activos (nombre = grupo_cantidad):
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

Mismos campos por meal todos los días. Varía alimentos. Solo JSON.
${promptSuffix}`;

  const resp = await aiService.invokeGemini(prompt, 'menu', MENU_SYSTEM_INSTRUCTION);
  const parsed = parseGeminiJson(resp.output);

  parsed.weeklyMenu = toArray(parsed.weeklyMenu).map((day: any) => {
    if (!day?.dayKey) return day;
    return {
      dayKey: day.dayKey,
      meals: toArray(day.meals).map((meal: any) => {
        if (!meal?.id) return meal;
        const title = meal.title ? meal.title : structuredMealToTitle(meal);
        return { id: meal.id, title: cleanTitle(title) };
      }),
    };
  });

  if (parsed.domingoV2?.meals) {
    parsed.domingoV2.meals = toArray(parsed.domingoV2.meals).map((meal: any) => {
      if (!meal?.id) return meal;
      const title = meal.title ? meal.title : structuredMealToTitle(meal);
      return { id: meal.id, title: cleanTitle(title) };
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