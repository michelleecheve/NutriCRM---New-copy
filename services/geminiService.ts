import { GoogleGenAI, Type } from "@google/genai";
import { Patient, Measurement } from "../types";
import { MenuPlanData } from "../components/menus_components/MenuDesignTemplates";
import type { MenuReferenceData } from "../components/menus_components/Menu_References_Components/MenuReferencesStorage";
import { WEEKDAY_KEYS, calcPortionsTotal } from "../components/menus_components/Menu_References_Components/MenuReferencesStorage";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// ─── Internal AI response shape ───────────────────────────────────────────────

interface AIMealEntry {
  id:    string;   // e.g. "desayuno", "refaccion_1"
  label: string;   // e.g. "Desayuno", "Refacción"
  portions: {
    lacteos: number; vegetales: number; frutas: number;
    cereales: number; carnes: number; grasas: number;
  };
}

interface AIDayEntry {
  dayKey: string;
  meals:  { id: string; title: string }[];
}

interface AIResponse {
  rationale:     string;
  mealStructure: AIMealEntry[];
  weeklyMenu:    AIDayEntry[];
  domingo:       { note: string; hydration: string };
  patient:       { name: string; age: number; weight: number; height: number; fatPct: number };
  kcal:          number;
}

// ─── Transform AI response → MenuPlanData ────────────────────────────────────

function transformToMenuPlanData(ai: AIResponse, nutritionist: any): MenuPlanData {
  const groups = ['lacteos','vegetales','frutas','cereales','carnes','grasas'] as const;

  const byMeal: Record<string, any> = {};
  const totals: Record<string, number> = { lacteos:0, vegetales:0, frutas:0, cereales:0, carnes:0, grasas:0 };

  ai.mealStructure.forEach(m => {
    byMeal[m.id] = { ...m.portions };
    groups.forEach(g => { totals[g] = (totals[g] || 0) + (m.portions[g] || 0); });
  });

  const mealOrder  = ai.mealStructure.map(m => m.id);
  const mealLabels: Record<string, string> = {};
  ai.mealStructure.forEach(m => { mealLabels[m.id] = m.label; });

  const weeklyMenu: any = {
    domingo: { note: ai.domingo.note, hydration: ai.domingo.hydration },
  };

  ai.weeklyMenu.forEach(dayEntry => {
    const dayObj: any = { mealsOrder: mealOrder };
    dayEntry.meals.forEach(meal => {
      dayObj[meal.id] = { title: meal.title, label: mealLabels[meal.id] || meal.id };
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

  return {
    patient: ai.patient,
    kcal:    ai.kcal,
    portions: {
      lacteos:   totals.lacteos,
      vegetales: totals.vegetales,
      frutas:    totals.frutas,
      cereales:  totals.cereales,
      carnes:    totals.carnes,
      grasas:    totals.grasas,
      byMeal,
    },
    weeklyMenu,
    nutritionist,
  };
}

// ─── Build reference context from MenuReferenceData ───────────────────────────

function buildRefContext(references: { title: string; data: MenuReferenceData }[]): string {
  if (references.length === 0) {
    return "Sin referencias. Usa comida guatemalteca típica con 5 tiempos: Desayuno, Refacción, Almuerzo, Refacción, Cena.";
  }

  return references.map(ref => {
    const { data } = ref;
    const totals = calcPortionsTotal(data.meals);

    // Portions table — each row shows slot label + semantic type
    const portionsLines = data.meals.map((slot, i) => {
      const p = slot.portions;
      const labelWithIndex = `${slot.label} ${i + 1 > 1 && data.meals.filter(s => s.label === slot.label).length > 1 ? `(#${data.meals.filter((s, si) => s.label === slot.label && si <= i).length})` : ''}`.trim();
      return `  ${labelWithIndex}: lácteos ${p.lacteos} | vegetales ${p.vegetales} | frutas ${p.frutas} | cereales ${p.cereales} | carnes ${p.carnes} | grasas ${p.grasas}`;
    }).join("\n");

    const totalsLine = `  TOTAL: lácteos ${totals.lacteos} | vegetales ${totals.vegetales} | frutas ${totals.frutas} | cereales ${totals.cereales} | carnes ${totals.carnes} | grasas ${totals.grasas}`;

    // Weekly menu — look up text by slotId
    const weekLines = WEEKDAY_KEYS.map(dayKey => {
      const day = data.weeklyMenu[dayKey];
      const meals = data.meals.map((slot, i) => {
        const text = day?.[slot.id]?.trim();
        if (!text) return null;
        const labelWithIndex = `${slot.label} ${data.meals.filter((s, si) => s.label === slot.label && si <= i).length > 1 ? `(#${data.meals.filter((s, si) => s.label === slot.label && si <= i).length})` : ''}`.trim();
        return `    ${labelWithIndex}:\n      ${text.split("\n").join("\n      ")}`;
      }).filter(Boolean).join("\n");
      return meals ? `  ${dayKey.toUpperCase()}:\n${meals}` : null;
    }).filter(Boolean).join("\n");

    const domingoNote = data.weeklyMenu.domingo?.note?.trim()
      ? `  DOMINGO (nota): ${data.weeklyMenu.domingo.note}`
      : "";

    const notesText = data.notes?.length
      ? `NOTAS:\n${data.notes.map(n => `  - ${n}`).join("\n")}`
      : "";

    // Slot structure summary — tells Gemini what time structure this reference uses
    const slotSummary = data.meals.map((s, i) => `${i + 1}. ${s.label}`).join(" → ");

    return `REFERENCIA [${ref.title}]:
KCAL: ${data.kcal}
ESTRUCTURA DE TIEMPOS: ${slotSummary}
HIDRATACIÓN: ${data.hydration}
PORCIONES POR TIEMPO:
${portionsLines}
${totalsLine}
MENÚ SEMANAL:
${weekLines}
${domingoNote}
${notesText}`.trim();
  }).join("\n\n---\n\n");
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

const portionFields = {
  lacteos:   { type: Type.NUMBER },
  vegetales: { type: Type.NUMBER },
  frutas:    { type: Type.NUMBER },
  cereales:  { type: Type.NUMBER },
  carnes:    { type: Type.NUMBER },
  grasas:    { type: Type.NUMBER },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateStructuredMenu = async (
  patient:      Patient,
  vetData:      any,
  portions:     any,
  references:   { title: string; data: MenuReferenceData }[],
  nutritionist: any
): Promise<{ plan: MenuPlanData; rationale: string }> => {
  if (!apiKey) throw new Error("API Key not found.");

  const refContext  = buildRefContext(references);
  const totalLac    = (portions.lec || 0) + (portions.lecDesc || 0);
  const totalCarnes = (portions.carMagra || 0) + (portions.carSemi || 0) + (portions.carAlta || 0);

  const prompt = `
Eres un nutricionista deportivo experto. Genera un plan de alimentación semanal estructurado.

═══ DATOS DEL PACIENTE ═══
- Nombre: ${patient.firstName} ${patient.lastName}
- Edad: ${patient.clinical.age} años | Peso: ${patient.clinical.initialWeight} kg | Talla: ${patient.clinical.initialHeight} cm
- Sexo: ${patient.clinical.sex} | Deporte: ${patient.clinical.sport} (${patient.clinical.daysPerWeek} días/semana)
- Meta: ${patient.clinical.goals}
- Alergias: ${patient.clinical.allergies || 'Ninguna'}

═══ METAS NUTRICIONALES DIARIAS ═══
- Calorías objetivo: ${vetData.kcalToWork} kcal
- Porciones totales: Lácteos ${totalLac} | Vegetales ${portions.veg || 0} | Frutas ${portions.fru || 0} | Cereales ${portions.cer || 0} | Carnes ${totalCarnes} | Grasas ${portions.gra || 0}

═══ REFERENCIAS DE MENÚS (MUY IMPORTANTE) ═══
${refContext}

═══ INSTRUCCIONES ═══

1. TIEMPOS DE COMIDA (mealStructure):
   - Usa la ESTRUCTURA DE TIEMPOS de las referencias como guía principal.
   - Cada tiempo tiene un "id" en snake_case (ej: "desayuno", "refaccion_1", "almuerzo", "refaccion_2", "cena").
   - El "label" debe ser el tipo semántico: "Desayuno", "Refacción", "Almuerzo" o "Cena".
   - Si hay 2 refacciones, usa ids "refaccion_1" y "refaccion_2" con label "Refacción" ambos.
   - Distribuye porciones coherentemente. La SUMA debe igualar los totales diarios.

2. MENÚ SEMANAL (weeklyMenu):
   - Genera 6 días: lunes, martes, miercoles, jueves, viernes, sabado.
   - Cada día usa exactamente los mismos ids de tiempos que definiste en mealStructure.
   - Descripción detallada con cantidades en medidas caseras, usando \\n para separar items.
   - Inspírate en el estilo y alimentos de las REFERENCIAS.

3. DOMINGO: nota motivacional breve + meta de hidratación "X.XL Agua/Día".

4. RATIONALE: 2-3 oraciones sobre el criterio nutricional en español.

Devuelve SOLO JSON válido, sin texto adicional.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rationale: { type: Type.STRING },
          patient: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING }, age: { type: Type.NUMBER },
              weight: { type: Type.NUMBER }, height: { type: Type.NUMBER }, fatPct: { type: Type.NUMBER },
            },
            required: ["name","age","weight","height","fatPct"],
          },
          kcal: { type: Type.NUMBER },
          mealStructure: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id:    { type: Type.STRING },
                label: { type: Type.STRING },
                portions: { type: Type.OBJECT, properties: portionFields, required: Object.keys(portionFields) },
              },
              required: ["id","label","portions"],
            },
          },
          weeklyMenu: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayKey: { type: Type.STRING },
                meals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { id: { type: Type.STRING }, title: { type: Type.STRING } },
                    required: ["id","title"],
                  },
                },
              },
              required: ["dayKey","meals"],
            },
          },
          domingo: {
            type: Type.OBJECT,
            properties: { note: { type: Type.STRING }, hydration: { type: Type.STRING } },
            required: ["note","hydration"],
          },
        },
        required: ["rationale","patient","kcal","mealStructure","weeklyMenu","domingo"],
      },
    },
  });

  try {
    const aiResult: AIResponse = JSON.parse(response.text || "{}");
    const plan = transformToMenuPlanData(aiResult, nutritionist);
    return { plan, rationale: aiResult.rationale };
  } catch (error) {
    console.error("Gemini parse error:", error);
    throw error;
  }
};

// ─── generateDietaryAdvice (sin cambios) ─────────────────────────────────────

export const generateDietaryAdvice = async (patient: Patient): Promise<string> => {
  if (!apiKey) return "API Key not found.";
  const prompt = `
    Actúa como un asistente nutricionista experto. 
    Analiza el perfil del paciente y proporciona recomendaciones dietéticas con un plan de comidas de muestra para 1 día.
    Nombre: ${patient.firstName} ${patient.lastName}
    Objetivos: ${patient.clinical.goals}
    Deporte: ${patient.clinical.sport} (${patient.clinical.trainingFrequency})
    Alergias: ${patient.clinical.allergies}
    Dieta actual: ${patient.dietary.currentDiet}
    Preferencias: ${patient.dietary.preferences}
    Calorías objetivo: ${patient.dietary.dailyCaloriesTarget}
    Diagnóstico: ${patient.clinical.diagnosis} | Historial familiar: ${patient.clinical.familyHistory} | Medicamentos: ${patient.clinical.medications}
    Responde en Markdown limpio, tono alentador y profesional en Español.
  `;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate advice. Please try again later.";
  }
};

// ─── generateMenuFromMeasurements (sin cambios) ───────────────────────────────

export const generateMenuFromMeasurements = async (patient: Patient, measurement: Measurement): Promise<string> => {
  if (!apiKey) return "API Key no encontrada.";
  const stats = `Peso: ${measurement.weight}kg | Talla: ${measurement.height}cm | IMC: ${measurement.imc?.toFixed(1)} | % Grasa: ${measurement.bodyFat?.toFixed(1)}% | Músculo: ${measurement.muscleKg?.toFixed(1)}kg`;
  const prompt = `
    Nutricionista deportivo experto. Crea un menú modelo para 1 día adaptado a las medidas del paciente.
    Paciente: ${patient.firstName} ${patient.lastName} | ${patient.clinical.age} años | ${patient.clinical.sex}
    Deporte: ${patient.clinical.sport} (${patient.clinical.trainingFrequency}) | Meta: ${patient.clinical.goals}
    Alergias: ${patient.clinical.allergies} | Alimentos a evitar: ${patient.dietaryEvaluations?.[0]?.excludedFoods || 'Ninguno'}
    Medidas: ${stats}
    Reglas: español, tono motivador, medidas caseras (no gramos), bullets para alimentos, negritas para tiempos.
    Estructura: Desayuno → Media Mañana → Almuerzo → Media Tarde → Cena → Tip del Coach.
    Termina con 2 líneas sobre por qué este plan ayuda a su somatotipo.
  `;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    return response.text || "No se pudo generar el menú.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el servicio de IA.";
  }
};