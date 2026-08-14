import type { MenuFooterConfig, MenuSectionTitles } from '../../../types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface MealPortions {
  label?: string;
  lacteos: number;
  vegetales: number;
  frutas: number;
  cereales: number;
  carnes: number;
  grasas: number;
}

export interface DayMeal {
  title: string;
  label?: string;
}

export interface MenuDay {
  desayuno: DayMeal;
  refaccion1: DayMeal;
  almuerzo: DayMeal;
  refaccion2: DayMeal;
  cena: DayMeal;
  mealsOrder?: string[];
}

export interface DomingoData {
  note: string;
  hydration: string;
}

export interface DomingoV2 extends MenuDay {
  note?: string;
  hydration?: string;
}

// ─── Intercambio de alimentos ─────────────────────────────────────────────────
export interface ExchangeMeal {
  id: string;
  label: string;
  examples: string[];
}

export interface ExchangeMenuData {
  meals: ExchangeMeal[];
  columnLabels?: string[];
  note?: string;
  hydration?: string;
  /** Si es false, la sección Nota e Hidratación se oculta en Vista Previa/PDF. Default true. */
  notesVisible?: boolean;
}

export interface MenuRecommendations {
  preparacion: string[];
  restricciones: string[];
  habitos: string[];
  organizacion: string[];
}

export function isDomingoV2(
  domingo: DomingoData | DomingoV2,
): domingo is DomingoV2 {
  return (
    "mealsOrder" in domingo ||
    Object.keys(domingo).some((k) => !["note", "hydration"].includes(k))
  );
}

// ─── Eating Out Page ──────────────────────────────────────────────────────────
export interface EatingOutColumn {
  id: string;
  label: string;
}

export interface EatingOutPageData {
  visible: boolean;
  title: string;
  freeText: string;
  columns: EatingOutColumn[];
  rows: Record<string, string>[];
}

export const DEFAULT_EATING_OUT_PAGE: EatingOutPageData = {
  visible: true,
  title: 'RECOMENDACIONES AL COMER FUERA DE CASA',
  freeText: '',
  columns: [
    { id: 'restaurante', label: 'Restaurante' },
    { id: 'opciones', label: 'Opciones Saludables' },
    { id: 'recomendaciones', label: 'Recomendaciones' },
  ],
  rows: [],
};

export interface MenuPlanData {
  patient: {
    name: string;
    age: number;
    weight: number;
    height: number;
    fatPct: number;
  };
  kcal: number;
  hiddenFields?: {
    age?: boolean;
    weight?: boolean;
    fatPct?: boolean;
    kcal?: boolean;
  };
  portions: {
    lacteos: number;
    vegetales: number;
    frutas: number;
    cereales: number;
    carnes: number;
    grasas: number;
    byMeal: Record<string, MealPortions>;
  };
  weeklyMenu: {
    lunes: MenuDay;
    martes: MenuDay;
    miercoles: MenuDay;
    jueves: MenuDay;
    viernes: MenuDay;
    sabado: MenuDay;
    domingo: DomingoData;
    domingoV2?: DomingoV2;
    domingoMode?: "libre" | "completo";
    /** Si es false, la sección Nota e Hidratación del domingo se oculta en Vista Previa/PDF. Default true. */
    notesVisible?: boolean;
  };
  recommendations?: MenuRecommendations;
  sectionTitles?: MenuSectionTitles;
  menuType?: 'semanal' | 'intercambio';
  exchangeMenu?: ExchangeMenuData;
  eatingOutPage?: EatingOutPageData;
  isVegetarian?: boolean;
  nutritionist: {
    name: string;
    professionalTitle: string;
    title: string;
    licenseNumber: string;
    whatsapp: string;
    personalPhone?: string;
    email: string;
    instagram: string;
    website: string;
    address?: string;
    avatar: string;
    logoUrl?: string;
    footerConfig?: MenuFooterConfig;
  };
}

// ─── Constants ─────────────────────────────────────────────────────────────────
export type MealKey = "desayuno" | "refaccion1" | "almuerzo" | "refaccion2" | "cena";
export type WeekDayKey = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado";

export const MEAL_KEYS: MealKey[] = [
  "desayuno",
  "refaccion1",
  "almuerzo",
  "refaccion2",
  "cena",
];

export const MEAL_LABELS: Record<MealKey, string> = {
  desayuno: "DESAYUNO",
  refaccion1: "REFACCIÓN 1",
  almuerzo: "ALMUERZO",
  refaccion2: "REFACCIÓN 2",
  cena: "CENA",
};

export const WEEKDAY_KEYS: WeekDayKey[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

export const WEEKDAY_LABELS: Record<WeekDayKey, string> = {
  lunes: "LUNES",
  martes: "MARTES",
  miercoles: "MIÉRCOLES",
  jueves: "JUEVES",
  viernes: "VIERNES",
  sabado: "SÁBADO",
};

export const PORTION_GROUPS: {
  key: keyof MealPortions;
  label: string;
  emoji: string;
}[] = [
  { key: "lacteos", label: "LÁCTEOS", emoji: "🥛" },
  { key: "vegetales", label: "VEGETALES", emoji: "🥦" },
  { key: "frutas", label: "FRUTAS", emoji: "🍎" },
  { key: "cereales", label: "CEREALES", emoji: "🌾" },
  { key: "carnes", label: "PROTEÍNA", emoji: "🥚" },
  { key: "grasas", label: "GRASAS", emoji: "🫒" },
];

export const PRINT_STYLES = `
  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; }
    body > * { display: none !important; }
    #menu-print-area {
      display: block !important;
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 210mm !important; height: 296mm !important;
      overflow: hidden !important;
    }
  }
`;

export const TEMPLATE_STYLES = `
  .menu-template-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  @media print {
    .menu-template-container {
      gap: 0 !important;
    }
  }
  .html2pdf__container .menu-template-container,
  .html2pdf__page-break .menu-template-container {
    gap: 0 !important;
  }
`;
