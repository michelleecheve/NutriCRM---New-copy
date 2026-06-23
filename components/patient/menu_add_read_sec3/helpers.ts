import { Patient, VetCalculation } from '../../../types';
import { MenuPlanData, MealPortions } from '../../menus_components/MenuDesignTemplates';
import { MealLabel, MealSlot, WEEKDAY_KEYS, MenuReferenceData, emptyMealPortions, calcPortionsTotal } from '../../menus_components/Menu_References_Components/MenuReferencesStorage';
import { store } from '../../../services/store';

export function buildBlankMenuPlanData(
  patient: Patient,
  vetData: VetCalculation,
  nutritionistData: any,
  evaluationId: string | null = null
): MenuPlanData {
  const mealOrder = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
  const mealLabels: Record<string, string> = {
    desayuno: 'Desayuno',
    refaccion1: 'Refacción 1',
    almuerzo: 'Almuerzo',
    refaccion2: 'Refacción 2',
    cena: 'Cena',
  };

  const emptyByMeal: Record<string, MealPortions> = {};
  mealOrder.forEach(id => {
    emptyByMeal[id] = { lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0 };
  });

  const emptyDay = () => {
    const day: any = { mealsOrder: mealOrder };
    mealOrder.forEach(id => {
      day[id] = { title: '', label: mealLabels[id] };
    });
    return day;
  };

  let fat = 0;
  if (evaluationId) {
    const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
    if (bio) {
      fat = bio.body_fat_pct;
    } else {
      const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
      if (meas) fat = meas.bodyFat || 0;
    }
  }

  return {
    patient: {
      name: `${patient.firstName} ${patient.lastName}`,
      age: vetData.age || patient.clinical?.age || 0,
      weight: vetData.weight || 0,
      height: vetData.height || 0,
      fatPct: fat,
    },
    kcal: vetData.kcalToWork || 0,
    portions: {
      lacteos: 0,
      vegetales: 0,
      frutas: 0,
      cereales: 0,
      carnes: 0,
      grasas: 0,
      byMeal: emptyByMeal,
    },
    weeklyMenu: {
      lunes: emptyDay(),
      martes: emptyDay(),
      miercoles: emptyDay(),
      jueves: emptyDay(),
      viernes: emptyDay(),
      sabado: emptyDay(),
      domingo: { note: '', hydration: '2.5L Agua/Día' },
      domingoV2: emptyDay(),
    },
    nutritionist: nutritionistData,
    recommendations: {
      preparacion: [],
      restricciones: [],
      habitos: [],
      organizacion: []
    }
  };
}

export function withTemplateTitles(plan: MenuPlanData): MenuPlanData {
  const st = store.getMenuTemplate()?.sectionTitles;
  if (!st) return plan;
  return { ...plan, sectionTitles: plan.sectionTitles ?? st };
}

export function getNutritionistData() {
  const profile = store.getUserProfile();
  const template = store.getMenuTemplate();
  const logoUrl = template?.headerMode === 'logo' ? template.logoUrl : undefined;

  return {
    name: profile.name,
    professionalTitle: profile.professionalTitle || '',
    title: profile.specialty,
    licenseNumber: profile.licenseNumber || '',
    whatsapp: profile.phone,
    personalPhone: profile.personalPhone || '',
    email: profile.contactEmail || profile.email,
    instagram: profile.instagramHandle ? `@${profile.instagramHandle}` : '',
    website: profile.website || '',
    address: profile.address || '',
    avatar: profile.avatar,
    logoUrl,
    footerConfig: template?.footerConfig,
  };
}

export function mapToMealLabel(raw: string): MealLabel {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('desayuno')) return 'Desayuno';
  if (lower.includes('almuerzo')) return 'Almuerzo';
  if (lower.includes('cena')) return 'Cena';
  return 'Refacción';
}

export function menuPlanDataToReferenceData(plan: MenuPlanData): MenuReferenceData {
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

  return {
    kcal:        plan.kcal || 0,
    type:        'SEMANAL',
    meals,
    weeklyMenu:  refWeeklyMenu,
    hydration:   (plan.weeklyMenu as any)?.domingo?.hydration || '2.5L Agua/Día',
    patientName: plan.patient?.name   || undefined,
    age:         plan.patient?.age    || undefined,
    weightKg:    plan.patient?.weight || undefined,
    heightCm:    plan.patient?.height || undefined,
    fatPct:      plan.patient?.fatPct || undefined,
  };
}
