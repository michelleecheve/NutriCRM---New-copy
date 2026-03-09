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
  weeklyMenu: Record<WeekDayKey, DayMenu> & { domingo: { note: string } };
  hydration:  string;
  notes?:     string[];
}

export function emptyReferenceData(): MenuReferenceData {
  const meals = defaultMealSlots();
  const weeklyMenu: any = {};
  WEEKDAY_KEYS.forEach(dk => { weeklyMenu[dk] = emptyDayMenuFromSlots(meals); });
  weeklyMenu.domingo = { note: '' };
  return { kcal: 0, type: 'SEMANAL', meals, weeklyMenu, hydration: '2.5L Agua/Día', notes: [] };
}

// ─── Record wrapper ────────────────────────────────────────────────────────────

export interface MenuReferenceRecord {
  id:        string;
  createdAt: string;
  data:      MenuReferenceData;
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "nutriflow_menu_references_v3";

function safeParse<T>(raw: string | null, fallback: T): T {
  try { return raw ? (JSON.parse(raw) as T) : fallback; }
  catch { return fallback; }
}

function newId(): string {
  return (globalThis as any)?.crypto?.randomUUID?.() ?? String(Date.now());
}

export const MenuReferencesStorage = {
  list(): MenuReferenceRecord[] {
    const data = safeParse<MenuReferenceRecord[]>(localStorage.getItem(STORAGE_KEY), []);
    return Array.isArray(data) ? data : [];
  },
  saveAll(items: MenuReferenceRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },
  add(data: MenuReferenceData): MenuReferenceRecord {
    const current = this.list();
    const record: MenuReferenceRecord = { id: newId(), createdAt: new Date().toISOString(), data };
    current.unshift(record);
    this.saveAll(current);
    return record;
  },
  remove(id: string) { this.saveAll(this.list().filter(x => x.id !== id)); },
  update(id: string, patch: Partial<MenuReferenceData>) {
    this.saveAll(this.list().map(x => x.id === id ? { ...x, data: { ...x.data, ...patch } } : x));
  },
  getById(id: string): MenuReferenceRecord | undefined {
    return this.list().find(x => x.id === id);
  },
};