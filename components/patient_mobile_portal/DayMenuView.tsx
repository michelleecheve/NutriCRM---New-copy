import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { GeneratedMenu, TrackingRow } from '../../types';
import { MealCard, MealCardInfo, MealData, MealUpdate } from './MealCard';
import { PortalPatient, PortalNutritionist } from './PortalShell';

interface Props {
  patient: PortalPatient;
  menu: GeneratedMenu;
  tracking: TrackingRow;
  nutritionist: PortalNutritionist;
  onTrackingUpdate: (t: TrackingRow) => void;
}

// ─── Day definitions ──────────────────────────────────────────────────────────

const DAYS = [
  { short: 'Lun', key: 'lunes',     jsDay: 1 },
  { short: 'Mar', key: 'martes',    jsDay: 2 },
  { short: 'Mié', key: 'miercoles', jsDay: 3 },
  { short: 'Jue', key: 'jueves',    jsDay: 4 },
  { short: 'Vie', key: 'viernes',   jsDay: 5 },
  { short: 'Sáb', key: 'sabado',    jsDay: 6 },
  { short: 'Dom', key: 'domingo',   jsDay: 0 },
] as const;

const DEFAULT_MEAL_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];

const MEAL_LABELS: Record<string, string> = {
  desayuno:   'Desayuno',
  refaccion1: 'Refacción',
  refaccion2: 'Merienda',
  almuerzo:   'Almuerzo',
  cena:       'Cena',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function jsDayToDaysIdx(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** DAYS array reordered to start from the menu's start day of week */
function getOrderedDays(menuStartDate: string | null) {
  const startIdx = menuStartDate
    ? jsDayToDaysIdx(new Date(menuStartDate + 'T12:00:00').getDay())
    : 0;
  return [...DAYS.slice(startIdx), ...DAYS.slice(0, startIdx)];
}

/** Index of today within the ordered week (0 = first day of menu week) */
function getTodayPosIndex(menuStartDate: string | null): number {
  const startIdx = menuStartDate
    ? jsDayToDaysIdx(new Date(menuStartDate + 'T12:00:00').getDay())
    : 0;
  return (jsDayToDaysIdx(new Date().getDay()) - startIdx + 7) % 7;
}

/** Local date string for position i in the current ordered week */
function getDateForPos(i: number, menuStartDate: string | null): string {
  const todayPos = getTodayPosIndex(menuStartDate);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const target = new Date(today);
  target.setDate(today.getDate() + (i - todayPos));
  return toLocalDateStr(target);
}

function getWeekNumber(startDate: string): number {
  const start = new Date(startDate + 'T12:00:00');
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00');
  const diffDays = Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
  return Math.floor(diffDays / 7) + 1;
}

function getDayData(menu: GeneratedMenu, dayKey: string): any {
  const wm = menu.menuData?.weeklyMenu;
  if (!wm) return null;
  if (dayKey === 'domingo') {
    const v2 = wm.domingoV2;
    if (v2?.desayuno) return v2;
    const v1 = wm.domingo;
    if (v1?.desayuno) return v1;
    return null;
  }
  return wm[dayKey] ?? null;
}

function buildMeals(dayData: any): MealCardInfo[] {
  if (!dayData) return [];
  const order: string[] = dayData.mealsOrder?.length ? dayData.mealsOrder : DEFAULT_MEAL_ORDER;
  return order
    .filter((k) => dayData[k]?.title)
    .map((k) => ({
      key: k,
      label: MEAL_LABELS[k] ?? k,
      title: dayData[k]?.title ?? '',
    }));
}

function getMealData(trackingData: Record<string, any>, dateKey: string, mealKey: string): MealData {
  const d = trackingData[dateKey]?.[mealKey];
  return {
    completed: d?.completed ?? null,
    rating:    d?.rating    ?? null,
    note:      d?.note      ?? '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DayMenuView: React.FC<Props> = ({
  patient, menu, tracking, nutritionist, onTrackingUpdate,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(() => getTodayPosIndex(tracking.menuStartDate));
  // Local tracking data for optimistic updates
  const [localTracking, setLocalTracking] = useState<Record<string, any>>(tracking.trackingData);
  const savingRef = useRef<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  // Sync local tracking if parent updates (e.g., after onboarding start)
  useEffect(() => {
    setLocalTracking(tracking.trackingData);
  }, [tracking.id, tracking.menuId]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active day pill into view on mount
  useEffect(() => {
    const el = scrollRef.current?.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, []);

  const orderedDays = getOrderedDays(tracking.menuStartDate);
  const selectedDay = orderedDays[selectedIdx];
  const dateKey = getDateForPos(selectedIdx, tracking.menuStartDate);
  const dayData = getDayData(menu, selectedDay.key);
  const meals = buildMeals(dayData);
  const weekNumber = getWeekNumber(tracking.menuStartDate!);

  // ── Card stats ──
  const todayPos = getTodayPosIndex(tracking.menuStartDate);
  const weekProgressPct = Math.round(((todayPos + 1) / 7) * 100);

  let mealsDone = 0; let mealsTotal = 0;
  for (let i = 0; i < orderedDays.length; i++) {
    const dk = getDateForPos(i, tracking.menuStartDate);
    const dd = getDayData(menu, orderedDays[i].key);
    const mm = buildMeals(dd);
    mealsTotal += mm.length;
    for (const m of mm) {
      if (localTracking[dk]?.[m.key]?.completed === true) mealsDone++;
    }
  }
  const mealsPct = mealsTotal > 0 ? Math.round((mealsDone / mealsTotal) * 100) : 0;

  // ── Optimistic update + upsert ──
  const handleUpdate = useCallback(
    async (mealKey: string, update: MealUpdate) => {
      const prevData = localTracking[dateKey]?.[mealKey] ?? {};
      const newMealData = { ...prevData, ...update };

      // Remove null/undefined keys for cleanliness
      if (newMealData.completed === null) delete newMealData.completed;
      if (newMealData.rating    === null) delete newMealData.rating;
      if (newMealData.note      === '')  delete newMealData.note;

      const newDayData = { ...(localTracking[dateKey] ?? {}), [mealKey]: newMealData };
      // Clean up empty meal entries
      if (Object.keys(newMealData).length === 0) delete newDayData[mealKey];

      const newTracking = { ...localTracking, [dateKey]: newDayData };
      // Clean up empty day entries
      if (Object.keys(newDayData).length === 0) delete newTracking[dateKey];

      // Optimistic update
      setLocalTracking(newTracking);

      const saveKey = `${dateKey}_${mealKey}`;
      savingRef.current[saveKey] = true;
      setSavingKeys((s) => new Set(s).add(saveKey));

      try {
        const { data, error } = await supabase
          .from('patient_digital_tracking')
          .update({
            tracking_data: newTracking,
            updated_at: new Date().toISOString(),
          })
          .eq('patient_id', patient.id)
          .eq('menu_id', tracking.menuId)
          .select()
          .single();

        if (error) throw error;

        onTrackingUpdate({
          id:            data.id,
          patientId:     data.patient_id,
          menuId:        data.menu_id,
          durationDays:  data.duration_days  ?? 28,
          menuStartDate: data.menu_start_date ?? null,
          menuEndDate:   data.menu_end_date   ?? null,
          trackingData:  data.tracking_data   ?? {},
          updatedAt:     data.updated_at,
        });
      } catch (e) {
        // Rollback optimistic update on error
        setLocalTracking(tracking.trackingData);
        console.error('Error saving meal:', e);
      } finally {
        delete savingRef.current[saveKey];
        setSavingKeys((s) => { const next = new Set(s); next.delete(saveKey); return next; });
      }
    },
    [localTracking, dateKey, patient.id, tracking, onTrackingUpdate],
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Greeting card ── */}
      <div className="px-4 pb-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#2D5A4B' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {new Date().toLocaleDateString('es-GT', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-extrabold text-white">
            Hola {patient.firstName}
          </h1>

          {/* Week progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Semana {weekNumber}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {weekProgressPct}%
              </p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${weekProgressPct}%`, backgroundColor: 'rgba(255,255,255,0.7)' }}
              />
            </div>
          </div>

          {/* Meal compliance */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Tiempos de Comida Cumplidos
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {mealsDone}/{mealsTotal}
                {mealsTotal > 0 && mealsDone === mealsTotal && ' ✓'}
              </p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${mealsPct}%`, backgroundColor: 'rgba(255,255,255,0.7)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Day selector ── */}
      <div className="pb-4 px-5">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {orderedDays.map((day, i) => {
            const active = i === selectedIdx;
            const dayNumber = parseInt(getDateForPos(i, tracking.menuStartDate).slice(8), 10);
            return (
              <button
                key={day.key}
                onClick={() => setSelectedIdx(i)}
                className="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-full font-semibold transition-all"
                style={{
                  backgroundColor: active ? '#2D5A4B' : 'white',
                  color:            active ? 'white'   : '#374151',
                  border:           active ? '1.5px solid #2D5A4B' : '1.5px solid #E0E8E3',
                  minHeight: '48px',
                  gap: '1px',
                }}
              >
                <span style={{ fontSize: '12px' }}>{day.short}</span>
                <span style={{ fontSize: '11px', opacity: active ? 0.85 : 0.5, fontWeight: 700 }}>{dayNumber}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Meal list ── */}
      <div className="px-4 pb-6 space-y-3 flex-1">
        {meals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm text-gray-400">
              No hay menú para {selectedDay.short}.
            </p>
          </div>
        ) : (
          <>
            {meals.map((meal) => {
              const saveKey = `${dateKey}_${meal.key}`;
              return (
                <MealCard
                  key={meal.key}
                  meal={meal}
                  data={getMealData(localTracking, dateKey, meal.key)}
                  onUpdate={(u) => handleUpdate(meal.key, u)}
                  saving={savingKeys.has(saveKey)}
                />
              );
            })}

            {/* Domingo note (old format) */}
            {selectedDay.key === 'domingo' && !dayData && menu.menuData?.weeklyMenu?.domingo?.note && (
              <div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: '#F9FBF9', border: '1px solid #E0E8E3' }}
              >
                <p className="text-xs font-bold uppercase mb-1" style={{ color: '#6B7C73' }}>Nota del domingo</p>
                <p className="text-sm text-gray-700">{menu.menuData.weeklyMenu.domingo.note}</p>
                {menu.menuData.weeklyMenu.domingo.hydration && (
                  <>
                    <p className="text-xs font-bold uppercase mt-3 mb-1" style={{ color: '#6B7C73' }}>Hidratación</p>
                    <p className="text-sm text-gray-700">{menu.menuData.weeklyMenu.domingo.hydration}</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer nutricionista ── */}
      <div className="px-5 pb-6 pt-4" style={{ borderTop: '1px solid #E0E8E3' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>
          Plan Alimenticio Por:
        </p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#E8F0EC' }}
          >
            {nutritionist.avatar ? (
              <img src={nutritionist.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sm" style={{ color: '#2D5A4B' }}>
                {nutritionist.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            {nutritionist.professionalTitle && (
              <p className="text-xs" style={{ color: '#6B7C73' }}>{nutritionist.professionalTitle}</p>
            )}
            <p className="text-sm font-bold text-gray-900">{nutritionist.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
