import type { MenuPlanData } from "../MenuDesignTemplates";
import type { MenuReferenceData } from "./MenuReferencesStorage";
import { WEEKDAY_KEYS, calcPortionsTotal } from "./MenuReferencesStorage";
import { store } from "../../../services/store";

export function MenuReferenceDataToMenuPlanData(data: MenuReferenceData): MenuPlanData {
  const profile = store.getUserProfile();

  const template = store.getMenuTemplate();
  const nutritionist: MenuPlanData["nutritionist"] = {
    name:              profile.name,
    professionalTitle: profile.professionalTitle || "",
    title:             profile.specialty,
    licenseNumber:     profile.licenseNumber || "",
    whatsapp:          profile.phone,
    personalPhone:     profile.personalPhone || "",
    email:             profile.contactEmail || profile.email,
    instagram:         profile.instagramHandle ? `@${profile.instagramHandle}` : "",
    website:           profile.website || "",
    address:           profile.address || "",
    avatar:            profile.avatar,
    logoUrl:           undefined,
    footerConfig:      template?.footerConfig,
  };

  // ── Portions ────────────────────────────────────────────────────────────────
  const totals = calcPortionsTotal(data.meals);

  const byMeal: Record<string, any> = {};
  data.meals.forEach(slot => {
    byMeal[slot.id] = { ...slot.portions };
  });

  const mealOrder = data.meals.map(s => s.id);

  // ── Weekly Menu ─────────────────────────────────────────────────────────────
  const weeklyMenu: any = {};

  WEEKDAY_KEYS.forEach(dayKey => {
    const dayData = data.weeklyMenu[dayKey];
    const dayObj: any = { mealsOrder: mealOrder };

    data.meals.forEach(slot => {
      dayObj[slot.id] = {
        title: dayData?.[slot.id] ?? "",
        label: slot.label,   // semantic label: "Desayuno", "Refacción", etc.
      };
    });

    weeklyMenu[dayKey] = dayObj;
  });

  // Domingo: note from data.weeklyMenu.domingo, hydration from data.hydration
  weeklyMenu.domingo = {
    note:      data.weeklyMenu.domingo?.note ?? "",
    hydration: data.hydration ?? "",
  };

  // Domingo V2: full day structure
  if (data.weeklyMenu.domingoV2) {
    const domV2Data = data.weeklyMenu.domingoV2;
    const domV2Obj: any = { 
      mealsOrder: mealOrder,
      note: data.weeklyMenu.domingo?.note ?? "",
      hydration: data.hydration ?? "",
    };

    data.meals.forEach(slot => {
      domV2Obj[slot.id] = {
        title: domV2Data?.[slot.id] ?? "",
        label: slot.label,
      };
    });
    weeklyMenu.domingoV2 = domV2Obj;
  }

  return {
    patient: {
      name:   "Referencia (sin paciente)",
      age:    0,
      weight: 0,
      height: 0,
      fatPct: 0,
    },
    kcal: data.kcal,
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
    recommendations: {
      preparacion: [],
      restricciones: [],
      habitos: [],
      organizacion: []
    }
  };
}

// Alias for backward compatibility
export const MenuReferenceParsertoMenuData = MenuReferenceDataToMenuPlanData;