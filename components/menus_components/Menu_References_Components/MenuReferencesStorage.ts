// ─── Core Types ────────────────────────────────────────────────────────────────

export type ReferenceType = "SEMANAL";

export interface MealPortions {
  lacteos:   number;
  vegetales: number;
  frutas:    number;
  cereales:  number;
  carnes:    number;
  grasas:    number;
}

export const emptyMealPortions = (): MealPortions => ({
  lacteos: 0, vegetales: 0, frutas: 0, cereales: 0, carnes: 0, grasas: 0,
});

// ─── Meal Label (semantic — Gemini reads this) ────────────────────────────────

export type MealLabel = 'Desayuno' | 'Refacción' | 'Almuerzo' | 'Cena';

export const MEAL_LABEL_OPTIONS: MealLabel[] = ['Desayuno', 'Refacción', 'Almuerzo', 'Cena'];

// ─── MealSlot: one editable row in the table ──────────────────────────────────

export interface MealSlot {
  id:       string;      // unique stable key, e.g. "slot_1714000000_ab3f"
  label:    MealLabel;   // semantic label the user picks from dropdown
  portions: MealPortions;
}

export function newMealSlot(label: MealLabel = 'Refacción'): MealSlot {
  return {
    id:       `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label,
    portions: emptyMealPortions(),
  };
}

export function defaultMealSlots(): MealSlot[] {
  return [
    { id: 'slot_desayuno',   label: 'Desayuno',  portions: emptyMealPortions() },
    { id: 'slot_refaccion1', label: 'Refacción', portions: emptyMealPortions() },
    { id: 'slot_almuerzo',   label: 'Almuerzo',  portions: emptyMealPortions() },
    { id: 'slot_refaccion2', label: 'Refacción', portions: emptyMealPortions() },
    { id: 'slot_cena',       label: 'Cena',      portions: emptyMealPortions() },
  ];
}

/** Derives total portions at runtime — never stored. */
export function calcPortionsTotal(meals: MealSlot[]): MealPortions {
  const total = emptyMealPortions();
  meals.forEach(m => {
    (Object.keys(total) as (keyof MealPortions)[]).forEach(g => {
      total[g] += m.portions[g] ?? 0;
    });
  });
  return total;
}

// ─── Days ──────────────────────────────────────────────────────────────────────

export type WeekDayKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export const WEEKDAY_KEYS: WeekDayKey[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const WEEKDAY_LABELS: Record<WeekDayKey, string> = {
  lunes:     'Lunes',
  martes:    'Martes',
  miercoles: 'Miércoles',
  jueves:    'Jueves',
  viernes:   'Viernes',
  sabado:    'Sábado',
};

/**
 * DayMenu: slotId → meal text.
 * When a slot is added/removed the weeklyMenu entries update accordingly.
 */
export type DayMenu = Record<string, string>;

export function emptyDayMenuFromSlots(slots: MealSlot[]): DayMenu {
  const d: DayMenu = {};
  slots.forEach(s => { d[s.id] = ''; });
  return d;
}

// ─── Main Data Type ────────────────────────────────────────────────────────────

export interface MenuReferenceData {
  kcal:       number;
  type:       ReferenceType;
  meals:      MealSlot[];        // ordered array — defines table rows
  weeklyMenu: Record<WeekDayKey, DayMenu> & { 
    domingo: { note: string };
    domingoV2?: DayMenu;
  };
  hydration:  string;
}

export function emptyReferenceData(): MenuReferenceData {
  const meals = defaultMealSlots();
  const weeklyMenu: any = {};
  WEEKDAY_KEYS.forEach(dk => { weeklyMenu[dk] = emptyDayMenuFromSlots(meals); });
  weeklyMenu.domingo = { note: '' };
  weeklyMenu.domingoV2 = emptyDayMenuFromSlots(meals);
  return { kcal: 0, type: 'SEMANAL', meals, weeklyMenu, hydration: '2.5L Agua/Día' };
}

// ─── Record wrapper ────────────────────────────────────────────────────────────

export interface MenuReferenceRecord {
  id:        string;
  createdAt: string;
  data:      MenuReferenceData;
}
