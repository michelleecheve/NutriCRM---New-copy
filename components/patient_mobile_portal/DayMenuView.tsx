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

/** Days elapsed from menuStartDate to today (local time) */
function getDiffDays(menuStartDate: string | null): number {
  if (!menuStartDate) return 0;
  const start = new Date(menuStartDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
}

/** 0-based week index today falls in relative to menuStartDate */
function getTodayWeekIndex(menuStartDate: string | null): number {
  return Math.floor(getDiffDays(menuStartDate) / 7);
}

/** Position of today within its week (0 = same weekday as menu start) */
function getTodayPosIndex(menuStartDate: string | null): number {
  return getDiffDays(menuStartDate) % 7;
}

/** Local date string for day position dayPos in week weekIdx (both 0-based) */
function getDateForPos(dayPos: number, menuStartDate: string | null, weekIdx: number = 0): string {
  if (!menuStartDate) return toLocalDateStr(new Date());
  const start = new Date(menuStartDate + 'T12:00:00');
  const target = new Date(start);
  target.setDate(start.getDate() + weekIdx * 7 + dayPos);
  return toLocalDateStr(target);
}

/** Meal compliance stats for a given week, respecting menu durationDays */
function getWeekStats(
  weekIdx: number,
  menuStartDate: string | null,
  menu: GeneratedMenu,
  orderedDays: ReturnType<typeof getOrderedDays>,
  trackingData: Record<string, any>,
  durationDays: number,
): { done: number; total: number } {
  let done = 0, total = 0;
  for (let i = 0; i < 7; i++) {
    if (weekIdx * 7 + i >= durationDays) break; // stop at menu end
    const date = getDateForPos(i, menuStartDate, weekIdx);
    const dd = getDayData(menu, orderedDays[i].key);
    const mm = buildMeals(dd);
    total += mm.length;
    for (const m of mm) {
      if (trackingData[date]?.[m.key]?.completed === true) done++;
    }
  }
  return { done, total };
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
  const [weekIndex, setWeekIndex] = useState(() => getTodayWeekIndex(tracking.menuStartDate));
  const [expanded, setExpanded] = useState(false);
  const [showCompletion, setShowCompletion] = useState(
    () => getDiffDays(tracking.menuStartDate) >= (tracking.durationDays ?? 28)
  );
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
  const totalWeeks = Math.max(1, Math.ceil((tracking.durationDays ?? 28) / 7));
  const daysInCurrentWeek = Math.min(7, (tracking.durationDays ?? 28) - weekIndex * 7);
  const selectedDay = orderedDays[Math.min(selectedIdx, daysInCurrentWeek - 1)];
  const clampedIdx = Math.min(selectedIdx, daysInCurrentWeek - 1);
  const dateKey = getDateForPos(clampedIdx, tracking.menuStartDate, weekIndex);
  const dayData = getDayData(menu, selectedDay.key);
  const meals = buildMeals(dayData);

  // ── Card stats (for currently viewed week) ──
  const todayWeekIdx = getTodayWeekIndex(tracking.menuStartDate);
  const todayPos = getTodayPosIndex(tracking.menuStartDate);
  const weekProgressPct = weekIndex < todayWeekIdx ? 100
    : weekIndex > todayWeekIdx ? 0
    : Math.round(((todayPos + 1) / 7) * 100);
  const { done: mealsDone, total: mealsTotal } = getWeekStats(weekIndex, tracking.menuStartDate, menu, orderedDays, localTracking, tracking.durationDays ?? 28);
  const mealsPct = mealsTotal > 0 ? Math.round((mealsDone / mealsTotal) * 100) : 0;

  // Total meals completed across entire plan (for completion screen)
  const totalPointsEarned = Object.values(localTracking).reduce((acc, dayData) => {
    if (!dayData || typeof dayData !== 'object') return acc;
    return acc + Object.values(dayData as Record<string, any>).filter((m: any) => m?.completed === true).length;
  }, 0);

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
        <div
          className="rounded-2xl p-4 cursor-pointer select-none"
          style={{ backgroundColor: '#2D5A4B' }}
          onClick={() => setExpanded(e => !e)}
        >
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {new Date().toLocaleDateString('es-GT', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h1 className="text-2xl font-extrabold text-white">
                Hola {patient.firstName}
              </h1>
            </div>
            <span className="text-xs font-semibold mt-1 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {expanded ? 'Ver menos ▲' : 'Ver más ▼'}
            </span>
          </div>

          {/* Week progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Semana {weekIndex + 1}
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

          {/* Expandable week selector */}
          {expanded && (
            <div
              className="mt-3 pt-3 flex gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
              {Array.from({ length: totalWeeks }, (_, wi) => {
                const stats = getWeekStats(wi, tracking.menuStartDate, menu, orderedDays, localTracking, tracking.durationDays ?? 28);
                const isActive = wi === weekIndex;
                return (
                  <button
                    key={wi}
                    onClick={() => { setWeekIndex(wi); setExpanded(false); setShowCompletion(false); }}
                    className="flex-1 rounded-xl py-2.5 px-1 flex flex-col items-center transition-all"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                      border: isActive ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid transparent',
                      gap: '3px',
                    }}
                  >
                    <span className="text-xs font-bold text-white">Sem {wi + 1}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                      {stats.done}/{stats.total}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Day selector ── */}
      <div className="pb-4 px-5">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {orderedDays.slice(0, daysInCurrentWeek).map((day, i) => {
            const active = i === clampedIdx;
            const dayNumber = parseInt(getDateForPos(i, tracking.menuStartDate, weekIndex).slice(8), 10);
            return (
              <button
                key={day.key}
                onClick={() => { setSelectedIdx(i); setShowCompletion(false); }}
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

          {/* Menú completado badge — solo aparece en la última semana parcial */}
          {daysInCurrentWeek < 7 && (
            <button
              onClick={() => setShowCompletion(true)}
              className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all active:scale-95"
              style={{
                backgroundColor: showCompletion ? '#2D5A4B' : '#E8F0EC',
                border: '1.5px solid #2D5A4B',
                minHeight: '48px',
                gap: '1px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: showCompletion ? 'white' : '#2D5A4B', whiteSpace: 'nowrap' }}>Menú</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: showCompletion ? 'white' : '#2D5A4B', whiteSpace: 'nowrap' }}>completado</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Completion screen ── */}
      {showCompletion && (
        <div className="px-4 pb-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-6xl">🎉</div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">¡Felicidades, lo lograste!</h2>
            <p className="text-sm text-gray-500">Completaste tu plan alimenticio</p>
          </div>

          {/* Points */}
          <div
            className="w-full rounded-2xl p-4 flex flex-col items-center"
            style={{ backgroundColor: '#E8F0EC', border: '1px solid #C6D9CF' }}
          >
            <p className="text-4xl font-extrabold" style={{ color: '#2D5A4B' }}>
              {totalPointsEarned}
            </p>
            <p className="text-xs mt-1 text-center" style={{ color: '#6B7C73' }}>tiempos de comida completados 🏆</p>
          </div>

          {/* Next step message */}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Es hora de tu siguiente Evaluación
            </p>
            <p className="text-xs text-gray-500">
              Mide tu progreso con tu nutricionista y celebra tus resultados juntos.
            </p>
          </div>

          {/* WhatsApp button */}
          {(nutritionist.personalPhone ?? nutritionist.phone) && (() => {
            const waPhone = (nutritionist.personalPhone ?? nutritionist.phone ?? '').replace(/\D/g, '');
            const waMsg = `¡Hola! Completé mi plan alimenticio 🎉 Acumulé ${totalPointsEarned} tiempos de comida cumplidos. ¡Quiero agendar mi siguiente evaluación!`;
            return (
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.535a.75.75 0 00.921.921l5.676-1.476A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.964-1.362l-.355-.212-3.686.958.977-3.566-.232-.368A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                Compartir con mi nutricionista
              </a>
            );
          })()}
        </div>
      )}

      {/* ── Meal list ── */}
      {!showCompletion && <div className="px-4 pb-6 space-y-3 flex-1">
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
      </div>}

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
