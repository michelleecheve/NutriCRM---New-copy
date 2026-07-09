import { store } from './store';
import { prefsService } from './prefsService';
import { DietaryEvaluation, Measurement } from '../types';

const EXAMPLE_FIRST_NAME = 'María';
const EXAMPLE_LAST_NAME = 'López (Ejemplo)';

// Crea, una sola vez por cuenta nueva, un paciente ficticio con historial ya avanzado
// (clínica, evaluación, medidas antropométricas, bioimpedancia, somatocarta, evaluación
// dietética) para que el usuario vea cómo luce un caso real antes de crear el suyo propio.
// No incluye un menú generado: eso es justo lo que el tour le enseña a construir.
export async function seedExamplePatientIfNeeded(): Promise<void> {
  if (prefsService.get('onboarding.examplePatientSeeded', false)) return;
  // Marca el flag primero para evitar una siembra doble si esta función se dispara
  // dos veces en rápida sucesión (ej. React StrictMode en desarrollo).
  prefsService.set('onboarding.examplePatientSeeded', true);

  try {
    const patient = await store.addPatient({
      firstName: EXAMPLE_FIRST_NAME,
      lastName: EXAMPLE_LAST_NAME,
      email: 'maria.ejemplo@nutriflow.demo',
      phone: '+502 5555 1234',
      status: 'Menú Pendiente',
      birthdate: '1994-03-15',
    });

    prefsService.set('onboarding.examplePatientId', patient.id);

    await store.updatePatient({
      ...patient,
      clinical: {
        ...patient.clinical,
        sex: 'Femenino',
        occupation: 'Diseñadora gráfica',
        study: 'Licenciatura',
        consultmotive: 'Bajar de peso y mejorar hábitos alimenticios',
        clinicalbackground: 'Hipotiroidismo controlado con levotiroxina',
        diagnosis: 'Sobrepeso grado I',
        familyHistory: 'Madre con diabetes tipo 2, padre hipertenso',
        medications: 'Levotiroxina 50mcg',
        supplements: 'Vitamina D3, Omega 3',
        allergies: 'Ninguna conocida',
        regularPeriod: 'Sí',
        sleep_hours: '6-7 horas',
        othersNotes: 'Le interesa el ciclismo como actividad física; entrena 2 veces por semana.',
      },
      dietary: { preferences: 'Prefiere comidas altas en proteína; evita lácteos por intolerancia leve' },
    });

    const evaluationDate = daysAgo(21);
    const evaluation = await store.addEvaluation(patient.id, evaluationDate);

    const measurement: Measurement = {
      id: crypto.randomUUID(),
      linkedEvaluationId: evaluation.id,
      date: evaluationDate,
      metaComplied: true,
      age: 30,
      gender: 'Femenino',
      weight: 68.4,
      height: 162,
      imc: 26.1,
      bodyFat: 29.8,
      fatKg: 20.4,
      leanMassKg: 48,
      leanMassPct: 70.2,
      muscleKg: 24.1,
      biceps: 12,
      triceps: 18,
      subscapular: 16,
      supraspinal: 11,
      abdomen: 24,
      thigh: 26,
      calf: 15,
      iliacCrest: 20,
      skinfoldSum: 142,
      wrist: 15.5,
      humerus: 6.2,
      femur: 9.1,
      armRelaxed: 29,
      armContracted: 31,
      calfGirth: 36,
      waist: 84,
      umbilical: 88,
      hip: 102,
      abdominalLow: 90,
      thighRight: 56,
      thighLeft: 56,
      boneMass: 8.9,
      residualMass: 10.5,
      endomorfo: 5.2,
      mesomorfo: 3.8,
      ectomorfo: 1.9,
      x: -1.4,
      y: 5.7,
      notes: 'Primera evaluación antropométrica — paciente en ayunas, buena hidratación.',
    };
    await store.saveMeasurement(evaluation.id, { ...measurement, patientId: patient.id });

    const somatotypeRecord = {
      id: crypto.randomUUID(),
      linkedEvaluationId: evaluation.id,
      date: evaluationDate,
      x: -1.4,
      y: 5.7,
      patientId: patient.id,
    };
    await store.saveSomatotype(evaluation.id, somatotypeRecord as any);

    const bioimpedanciaRecord = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      date: evaluationDate,
      gender: 'Femenino',
      age: '30',
      weight: '68.4',
      height: '162',
      imc: '26.1',
      bodyFat: '29.8',
      totalBodyWater: '48.2',
      muscleMass: '24.1',
      physiqueRating: 'Sobrepeso leve',
      visceralFat: '8',
      boneMass: '2.4',
      bmr: '1420',
      metabolicAge: '34',
      meta_complied: 'true',
      armRelaxed: '29',
      armContracted: '31',
      calfGirth: '36',
      waist: '84',
      umbilical: '88',
      hip: '102',
      abdominalLow: '90',
      thighRight: '56',
      thighLeft: '56',
      notes: 'Medición con equipo de bioimpedancia tetrapolar.',
    };
    await store.saveBioimpedancia(evaluation.id, bioimpedanciaRecord);

    const dietaryEvaluation: DietaryEvaluation = {
      id: crypto.randomUUID(),
      linkedEvaluationId: evaluation.id,
      patientId: patient.id,
      date: evaluationDate,
      mealsPerDay: 4,
      excludedFoods: 'Lácteos (intolerancia leve), mariscos',
      notes: 'Paciente cocina en casa la mayoría de días; almuerza fuera 2 veces por semana.',
      recall: [
        { mealTime: 'Desayuno', time: '07:00', place: 'Casa', description: 'Avena con fruta y claras de huevo revueltas' },
        { mealTime: 'Almuerzo', time: '13:00', place: 'Trabajo', description: 'Pechuga de pollo a la plancha, arroz, ensalada' },
        { mealTime: 'Merienda', time: '17:00', place: 'Casa', description: 'Yogurt de almendra con nueces' },
        { mealTime: 'Cena', time: '20:00', place: 'Casa', description: 'Pescado al horno con vegetales salteados' },
      ],
      foodFrequency: [
        { id: crypto.randomUUID(), dietaryEvaluationId: '', category: 'Frutas', frequency: 'Diario' },
        { id: crypto.randomUUID(), dietaryEvaluationId: '', category: 'Verduras', frequency: 'Diario' },
        { id: crypto.randomUUID(), dietaryEvaluationId: '', category: 'Lácteos', frequency: 'Nunca' },
        { id: crypto.randomUUID(), dietaryEvaluationId: '', category: 'Comida rápida', frequency: '1-2 veces/semana' },
      ],
      foodFrequencyOthers: '',
    };
    await store.saveDietaryEvaluation(evaluation.id, dietaryEvaluation);
  } catch (error) {
    console.error('Error sembrando paciente de ejemplo:', error);
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
