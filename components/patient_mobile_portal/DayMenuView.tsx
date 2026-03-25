import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sun, UtensilsCrossed, Moon, Star, Flame, Smile, ClipboardList, LayoutGrid } from 'lucide-react';
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

const DAY_FULL_NAMES: Record<string, string> = {
  lunes:     'Lunes',
  martes:    'Martes',
  miercoles: 'Miércoles',
  jueves:    'Jueves',
  viernes:   'Viernes',
  sabado:    'Sábado',
  domingo:   'Domingo',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function jsDayToDaysIdx(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getOrderedDays(menuStartDate: string | null) {
  const startIdx = menuStartDate
    ? jsDayToDaysIdx(new Date(menuStartDate + 'T12:00:00').getDay())
    : 0;
  return [...DAYS.slice(startIdx), ...DAYS.slice(0, startIdx)];
}

function getDiffDays(menuStartDate: string | null): number {
  if (!menuStartDate) return 0;
  const start = new Date(menuStartDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
}

function getTodayWeekIndex(menuStartDate: string | null): number {
  return Math.floor(getDiffDays(menuStartDate) / 7);
}

function getTodayPosIndex(menuStartDate: string | null): number {
  return getDiffDays(menuStartDate) % 7;
}

function getDateForPos(dayPos: number, menuStartDate: string | null, weekIdx: number = 0): string {
  if (!menuStartDate) return toLocalDateStr(new Date());
  const start = new Date(menuStartDate + 'T12:00:00');
  const target = new Date(start);
  target.setDate(start.getDate() + weekIdx * 7 + dayPos);
  return toLocalDateStr(target);
}

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
    if (weekIdx * 7 + i >= durationDays) break;
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

function calcStreak(trackingData: Record<string, any>, startDate: string | null): number {
  if (!startDate) return 0;
  let streak = 0;
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const key = toLocalDateStr(d);
    if (key < startDate) break;
    const dayData = trackingData[key];
    const hasCompleted = dayData && typeof dayData === 'object' &&
      Object.values(dayData as Record<string, any>).some(
        (m): m is { completed: boolean } => typeof m === 'object' && m !== null && (m as any).completed === true,
      );
    if (hasCompleted) {
      streak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
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
      label: dayData[k]?.label ?? MEAL_LABELS[k] ?? k,
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
  const [selectedIdx, setSelectedIdx]   = useState(() => getTodayPosIndex(tracking.menuStartDate));
  const [weekIndex, setWeekIndex]       = useState(() => getTodayWeekIndex(tracking.menuStartDate));
  const [expanded, setExpanded]         = useState(false);
  const [showCompletion, setShowCompletion] = useState(
    () => getDiffDays(tracking.menuStartDate) >= (tracking.durationDays ?? 28)
  );
  const [localTracking, setLocalTracking] = useState<Record<string, any>>(tracking.trackingData);
  const savingRef = useRef<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [showRecs, setShowRecs] = useState(false);
  const [showPortions, setShowPortions] = useState(false);

  useEffect(() => {
    setLocalTracking(tracking.trackingData);
  }, [tracking.id, tracking.menuId]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, []);

  const orderedDays     = getOrderedDays(tracking.menuStartDate);
  const totalWeeks      = Math.max(1, Math.ceil((tracking.durationDays ?? 28) / 7));
  const daysInCurrentWeek = Math.min(7, (tracking.durationDays ?? 28) - weekIndex * 7);
  const selectedDay     = orderedDays[Math.min(selectedIdx, daysInCurrentWeek - 1)];
  const clampedIdx      = Math.min(selectedIdx, daysInCurrentWeek - 1);
  const dateKey         = getDateForPos(clampedIdx, tracking.menuStartDate, weekIndex);
  const dayData         = getDayData(menu, selectedDay.key);
  const meals           = buildMeals(dayData);

  const todayWeekIdx    = getTodayWeekIndex(tracking.menuStartDate);
  const todayPos        = getTodayPosIndex(tracking.menuStartDate);
  const weekProgressPct = weekIndex < todayWeekIdx ? 100
    : weekIndex > todayWeekIdx ? 0
    : Math.round(((todayPos + 1) / 7) * 100);

  const { done: mealsDone, total: mealsTotal } = getWeekStats(
    weekIndex, tracking.menuStartDate, menu, orderedDays, localTracking, tracking.durationDays ?? 28
  );
  const mealsPct = mealsTotal > 0 ? Math.round((mealsDone / mealsTotal) * 100) : 0;

  const streak = calcStreak(localTracking, tracking.menuStartDate);

  const totalPointsEarned = Object.values(localTracking).reduce((acc, dayData) => {
    if (!dayData || typeof dayData !== 'object') return acc;
    return acc + Object.values(dayData as Record<string, any>).filter((m: any) => m?.completed === true).length;
  }, 0);

  const isToday = (weekIdx: number, pos: number) =>
    weekIdx === todayWeekIdx && pos === todayPos;

  // ── Optimistic update + upsert ──
  const handleUpdate = useCallback(
    async (mealKey: string, update: MealUpdate) => {
      const prevData   = localTracking[dateKey]?.[mealKey] ?? {};
      const newMealData = { ...prevData, ...update };

      if (newMealData.completed === null) delete newMealData.completed;
      if (newMealData.rating    === null) delete newMealData.rating;
      if (newMealData.note      === '')  delete newMealData.note;

      const newDayData = { ...(localTracking[dateKey] ?? {}), [mealKey]: newMealData };
      if (Object.keys(newMealData).length === 0) delete newDayData[mealKey];

      const newTracking = { ...localTracking, [dateKey]: newDayData };
      if (Object.keys(newDayData).length === 0) delete newTracking[dateKey];

      setLocalTracking(newTracking);

      const saveKey = `${dateKey}_${mealKey}`;
      savingRef.current[saveKey] = true;
      setSavingKeys((s) => new Set(s).add(saveKey));

      try {
        const { data, error } = await supabase
          .from('patient_digital_tracking')
          .update({ tracking_data: newTracking, updated_at: new Date().toISOString() })
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F7F4', display: 'flex', flexDirection: 'column' }}>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#1A2E25',
          borderRadius: '0 0 28px 28px',
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Greeting + expand toggle */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            {/* Time-of-day icon */}
            {(() => {
              const h = new Date().getHours();
              const isMorning   = h >= 5  && h < 12;
              const isAfternoon = h >= 12 && h < 19;
              const Icon = isMorning ? Sun : isAfternoon ? UtensilsCrossed : Moon;
              const iconBg    = isMorning ? 'rgba(251,191,36,0.18)'  : isAfternoon ? 'rgba(96,165,250,0.18)'  : 'rgba(167,139,250,0.18)';
              const iconColor = isMorning ? '#FCD34D'                : isAfternoon ? '#93C5FD'                : '#C4B5FD';
              return (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 38, height: 38, borderRadius: '12px',
                  backgroundColor: iconBg,
                  color: iconColor,
                  marginBottom: '10px',
                }}>
                  <Icon size={20} />
                </div>
              );
            })()}
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, lineHeight: 1.2 }}>
              {(() => {
                const h = new Date().getHours();
                if (h >= 5  && h < 12) return `¡Buenos días, ${patient.firstName}!`;
                if (h >= 12 && h < 19) return `¡Buenas tardes, ${patient.firstName}!`;
                return `¡Buenas noches, ${patient.firstName}!`;
              })()}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
              Tu menú de hoy está listo
            </p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0, marginTop: '4px' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>

        {/* Progress stats row */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Week progress */}
          <div style={{
            flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontWeight: 600 }}>
                Semana {weekIndex + 1}
              </span>
              <span style={{ color: '#6EE7B7', fontSize: '11px', fontWeight: 700 }}>
                {weekProgressPct}%
              </span>
            </div>
            <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${weekProgressPct}%`,
                background: 'linear-gradient(90deg, #6EE7B7, #34D399)',
                borderRadius: '99px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Meals progress */}
          <div style={{
            flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontWeight: 600 }}>
                Comidas
              </span>
              <span style={{ color: '#6EE7B7', fontSize: '11px', fontWeight: 700 }}>
                {mealsDone}/{mealsTotal}
              </span>
            </div>
            <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${mealsPct}%`,
                background: 'linear-gradient(90deg, #6EE7B7, #34D399)',
                borderRadius: '99px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>

        {/* ── Expandable week selector ── */}
        {expanded && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              gap: '8px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {Array.from({ length: totalWeeks }, (_, wi) => {
              const stats = getWeekStats(wi, tracking.menuStartDate, menu, orderedDays, localTracking, tracking.durationDays ?? 28);
              const isActive = wi === weekIndex;
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              return (
                <button
                  key={wi}
                  onClick={() => { setWeekIndex(wi); setExpanded(false); setShowCompletion(false); }}
                  style={{
                    flex: 1,
                    borderRadius: '12px',
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                    border: isActive ? '1.5px solid rgba(255,255,255,0.45)' : '1.5px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>Sem {wi + 1}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>{stats.done}/{stats.total}</span>
                  {/* Mini progress */}
                  <div style={{ width: '80%', height: '3px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#6EE7B7', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Day selector ─────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div
          ref={scrollRef}
          style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {orderedDays.slice(0, daysInCurrentWeek).map((day, i) => {
            const active     = i === clampedIdx;
            const todayMark  = isToday(weekIndex, i);
            const dayNumber  = parseInt(getDateForPos(i, tracking.menuStartDate, weekIndex).slice(8), 10);
            return (
              <button
                key={day.key}
                onClick={() => { setSelectedIdx(i); setShowCompletion(false); }}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 14px 6px',
                  borderRadius: '14px',
                  minWidth: '52px',
                  backgroundColor: active ? '#2D5A4B' : 'white',
                  border: active ? '1.5px solid #2D5A4B' : '1.5px solid #E0E8E3',
                  boxShadow: active ? '0 4px 14px rgba(45,90,75,0.28)' : '0 1px 4px rgba(0,0,0,0.05)',
                  color: active ? 'white' : '#374151',
                  gap: '2px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 600, opacity: active ? 0.75 : 0.55, letterSpacing: '0.02em' }}>
                  {day.short}
                </span>
                <span style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1 }}>
                  {dayNumber}
                </span>
                {/* Today dot */}
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%', marginTop: '2px',
                  backgroundColor: todayMark
                    ? (active ? 'rgba(110,231,183,0.9)' : '#2D5A4B')
                    : 'transparent',
                  transition: 'background-color 0.15s',
                }} />
              </button>
            );
          })}

          {/* Menú completado badge */}
          {daysInCurrentWeek < 7 && (
            <button
              onClick={() => setShowCompletion(true)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '14px',
                minWidth: '52px',
                minHeight: '64px',
                backgroundColor: showCompletion ? '#2D5A4B' : 'white',
                border: showCompletion ? '1.5px solid #2D5A4B' : '1.5px solid #E0E8E3',
                boxShadow: showCompletion ? '0 4px 14px rgba(45,90,75,0.28)' : '0 1px 4px rgba(0,0,0,0.05)',
                gap: '1px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: showCompletion ? 'white' : '#374151', whiteSpace: 'nowrap' }}>Menú</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: showCompletion ? 'white' : '#374151', whiteSpace: 'nowrap' }}>completado</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Selected day header ──────────────────────────────────────────── */}
      {!showCompletion && (
        <div style={{ padding: '6px 20px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>
            {DAY_FULL_NAMES[selectedDay.key] ?? selectedDay.short}, {parseInt(dateKey.slice(8), 10)} de{' '}
            {new Date(dateKey + 'T12:00:00').toLocaleDateString('es-GT', { month: 'long' })}
          </span>
          {isToday(weekIndex, clampedIdx) && (
            <span style={{
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.07em',
              padding: '3px 8px',
              borderRadius: '99px',
              border: '1px solid #D1FAE5',
              textTransform: 'uppercase',
            }}>Hoy</span>
          )}
        </div>
      )}

      {/* ─── Completion screen ────────────────────────────────────────────── */}
      {showCompletion && (
        <div style={{
          padding: '16px 20px 32px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '20px',
        }}>
          <div style={{ fontSize: '72px', lineHeight: 1 }}>🎉</div>

          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
              ¡Felicidades, lo lograste!
            </h2>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Completaste tu plan alimenticio</p>
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1A2E25 0%, #2D5A4B 100%)',
              boxShadow: '0 6px 24px rgba(26,46,37,0.28)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '14px 20px' }}>
              <Star style={{ width: 15, height: 15, flexShrink: 0, color: '#6EE7B7', fill: '#6EE7B7' }} />
              <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>
                {totalPointsEarned}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', maxWidth: '120px', lineHeight: 1.3 }}>
                tiempos de comida completados
              </span>
            </div>
            <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '14px 20px' }}>
              <Flame style={{ width: 15, height: 15, flexShrink: 0, color: '#FCA5A5', fill: '#FCA5A5' }} />
              <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>
                {streak}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: 1.3 }}>
                días racha
              </span>
            </div>
          </div>

          {/* Next step message */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', marginBottom: '6px' }}>
              Es hora de tu siguiente Evaluación
            </p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5 }}>
              Mide tu progreso con tu nutricionista y celebra tus resultados juntos.
            </p>
          </div>

          {/* WhatsApp button */}
          {(nutritionist.personalPhone ?? nutritionist.phone) && (() => {
            const waPhone = (nutritionist.personalPhone ?? nutritionist.phone ?? '').replace(/\D/g, '');
            const waMsg   = `¡Hola! Completé mi plan alimenticio 🎉 Acumulé ${totalPointsEarned} tiempos de comida cumplidos. ¡Quiero agendar mi siguiente evaluación!`;
            return (
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#25D366',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                  transition: 'transform 0.15s',
                }}
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

      {/* ─── Meal list ────────────────────────────────────────────────────── */}
      {!showCompletion && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Domingo día libre — plantilla v1 */}
          {selectedDay.key === 'domingo' && menu.templateId === 'plantilla_v1' ? (
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: 'white',
              border: '1px solid #E0E8E3',
              borderLeft: '4px solid #6EE7B7',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Smile size={18} color="#2D5A4B" />
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', margin: 0 }}>Día Libre</p>
              </div>
              {menu.menuData?.weeklyMenu?.domingo?.note ? (
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
                  {menu.menuData.weeklyMenu.domingo.note}
                </p>
              ) : (
                <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                  Disfruta tu día de descanso.
                </p>
              )}
            </div>
          ) : meals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</p>
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                No hay menú para {selectedDay.short}.
              </p>
            </div>
          ) : (
            meals.map((meal) => {
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
            })
          )}
        </div>

        {/* ─── Recomendaciones y Hábitos ──────────────────────────────────── */}
        {(() => {
          const recs = menu.menuData?.recommendations;
          const hasRecs = recs && (
            (recs.preparacion?.length > 0) ||
            (recs.restricciones?.length > 0) ||
            (recs.habitos?.length > 0) ||
            (recs.organizacion?.length > 0)
          );
          if (!hasRecs) return null;

          const sections = [
            {
              key: 'preparacion' as const,
              title: 'Preparación de Alimentos',
              accent: '#F59E0B',
              border: '#FDE68A',
            },
            {
              key: 'restricciones' as const,
              title: 'Restricciones Específicas',
              accent: '#F43F5E',
              border: '#FECDD3',
            },
            {
              key: 'habitos' as const,
              title: 'Hábitos Saludables',
              accent: '#10B981',
              border: '#A7F3D0',
            },
            {
              key: 'organizacion' as const,
              title: 'Organización y Horarios',
              accent: '#6366F1',
              border: '#C7D2FE',
            },
          ];

          return (
            <div style={{ padding: '0 16px 36px' }}>
              {/* Accordion header */}
              <button
                onClick={() => setShowRecs(r => !r)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: showRecs
                    ? 'linear-gradient(135deg, #1A2E25 0%, #2D5A4B 100%)'
                    : 'white',
                  border: 'none',
                  boxShadow: showRecs
                    ? '0 6px 20px rgba(45,90,75,0.30)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  marginBottom: showRecs ? '14px' : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: showRecs ? 'rgba(255,255,255,0.15)' : '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ClipboardList size={20} color={showRecs ? 'white' : '#2D5A4B'} strokeWidth={1.8} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: showRecs ? 'white' : '#111827',
                      margin: 0,
                      lineHeight: 1.2,
                    }}>Recomendaciones y Hábitos</p>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: showRecs ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                      margin: 0,
                      marginTop: '3px',
                    }}>Guía personalizada de tu nutricionista</p>
                  </div>
                </div>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: showRecs ? 'rgba(255,255,255,0.15)' : '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.25s ease',
                  transform: showRecs ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  <ChevronDown size={15} color={showRecs ? 'white' : '#6B7280'} />
                </div>
              </button>

              {/* Expanded content */}
              {showRecs && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sections.map(({ key, title, accent, border }) => {
                    const items: string[] = recs[key] ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={key} style={{
                        borderRadius: '16px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                      }}>
                        {/* Section header */}
                        <div style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderBottom: `1px solid ${border}`,
                        }}>
                          <div style={{
                            width: '4px',
                            height: '16px',
                            borderRadius: '999px',
                            backgroundColor: accent,
                            flexShrink: 0,
                          }} />
                          <p style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: accent,
                            margin: 0,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}>{title}</p>
                        </div>

                        {/* Bullet list */}
                        <div style={{
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}>
                          {items.map((item, i) => {
                            const lines = item.split('\n').filter(l => l.trim() !== '');
                            return (
                              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: accent,
                                  flexShrink: 0,
                                  marginTop: '6px',
                                  opacity: 0.8,
                                }} />
                                <div style={{ flex: 1 }}>
                                  {lines.map((line, li) => (
                                    <p key={li} style={{
                                      fontSize: '13px',
                                      color: '#374151',
                                      lineHeight: 1.6,
                                      margin: 0,
                                      marginBottom: li < lines.length - 1 ? '4px' : 0,
                                    }}>{line}</p>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── Tabla de Porciones ─────────────────────────────────────────── */}
        {(() => {
          const portions = menu.menuData?.portions;
          const weeklyMenu = menu.menuData?.weeklyMenu;
          if (!portions?.byMeal || !weeklyMenu) return null;

          const mealOrder: string[] = weeklyMenu.lunes?.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
          const mealRows = mealOrder.filter(k => portions.byMeal[k]);

          const GROUPS: { key: string; short: string; label: string; color: string; border: string }[] = [
            { key: 'lacteos',   short: 'Lác',  label: 'Lácteos',   color: '#0EA5E9', border: '#BAE6FD' },
            { key: 'vegetales', short: 'Veg',  label: 'Vegetales', color: '#22C55E', border: '#BBF7D0' },
            { key: 'frutas',    short: 'Fru',  label: 'Frutas',    color: '#F97316', border: '#FED7AA' },
            { key: 'cereales',  short: 'Cer',  label: 'Cereales',  color: '#EAB308', border: '#FEF08A' },
            { key: 'carnes',    short: 'Car',  label: 'Carnes',    color: '#EF4444', border: '#FECACA' },
            { key: 'grasas',    short: 'Gra',  label: 'Grasas',    color: '#A855F7', border: '#E9D5FF' },
          ];

          const totals: Record<string, number> = {
            lacteos: portions.lacteos ?? 0,
            vegetales: portions.vegetales ?? 0,
            frutas: portions.frutas ?? 0,
            cereales: portions.cereales ?? 0,
            carnes: portions.carnes ?? 0,
            grasas: portions.grasas ?? 0,
          };

          return (
            <div style={{ padding: '0 16px 36px' }}>
              {/* Accordion header */}
              <button
                onClick={() => setShowPortions(p => !p)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: showPortions
                    ? 'linear-gradient(135deg, #1A2E25 0%, #2D5A4B 100%)'
                    : 'white',
                  border: 'none',
                  boxShadow: showPortions
                    ? '0 6px 20px rgba(45,90,75,0.30)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  marginBottom: showPortions ? '14px' : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: showPortions ? 'rgba(255,255,255,0.15)' : '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <LayoutGrid size={20} color={showPortions ? 'white' : '#2D5A4B'} strokeWidth={1.8} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: showPortions ? 'white' : '#111827',
                      margin: 0,
                      lineHeight: 1.2,
                    }}>Tabla de Porciones</p>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: showPortions ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                      margin: 0,
                      marginTop: '3px',
                    }}>Guía para contar porciones por tiempo de comida</p>
                  </div>
                </div>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: showPortions ? 'rgba(255,255,255,0.15)' : '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.25s ease',
                  transform: showPortions ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  <ChevronDown size={15} color={showPortions ? 'white' : '#6B7280'} />
                </div>
              </button>

              {/* Expanded table */}
              {showPortions && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                }}>
                  {/* Color legend row */}
                  <div style={{
                    padding: '12px 16px 10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    backgroundColor: '#1A2E25',
                  }}>
                    {GROUPS.map(g => (
                      <div key={g.key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        border: `1.5px solid ${g.border}`,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: g.border }}>{g.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Scrollable table */}
                  <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                    <table style={{ width: '100%', minWidth: '420px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.7)',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            minWidth: '90px',
                            backgroundColor: '#1A2E25',
                          }}>Tiempo</th>
                          {GROUPS.map(g => (
                            <th key={g.key} style={{
                              padding: '10px 8px',
                              textAlign: 'center',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: g.border,
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                              backgroundColor: '#1A2E25',
                            }}>{g.short}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mealRows.map((mealKey, i) => {
                          const row = portions.byMeal[mealKey];
                          const labelFromMenu = (weeklyMenu.lunes as any)?.[mealKey]?.label;
                          const FALLBACK: Record<string, string> = {
                            desayuno: 'Desayuno', refaccion1: 'Refacción', almuerzo: 'Almuerzo',
                            refaccion2: 'Merienda', cena: 'Cena',
                          };
                          const label = labelFromMenu || FALLBACK[mealKey] || mealKey;
                          const isEven = i % 2 === 0;
                          return (
                            <tr key={mealKey} style={{ backgroundColor: isEven ? 'white' : '#F8FAFC' }}>
                              <td style={{
                                padding: '10px 14px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#1F2937',
                                borderBottom: '1px solid #F1F5F9',
                                whiteSpace: 'nowrap',
                              }}>{label}</td>
                              {GROUPS.map(g => {
                                const val = row[g.key] ?? 0;
                                return (
                                  <td key={g.key} style={{
                                    padding: '10px 8px',
                                    textAlign: 'center',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: val > 0 ? g.color : '#D1D5DB',
                                    borderBottom: '1px solid #F1F5F9',
                                  }}>{val > 0 ? val : '—'}</td>
                                );
                              })}
                            </tr>
                          );
                        })}
                        {/* Totals row */}
                        <tr style={{ backgroundColor: '#F0FDF4', borderTop: '2px solid #A7F3D0' }}>
                          <td style={{
                            padding: '10px 14px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#2D5A4B',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}>Total</td>
                          {GROUPS.map(g => (
                            <td key={g.key} style={{
                              padding: '10px 8px',
                              textAlign: 'center',
                              fontSize: '13px',
                              fontWeight: 900,
                              color: g.color,
                            }}>{totals[g.key]}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        </div>
      )}


    </div>
  );
};
