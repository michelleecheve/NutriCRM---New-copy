import React from 'react';
import { GeneratedMenu, TrackingRow } from '../../types';
import { MeasurementsView } from './MeasurementsView';
import { HistoryView } from './HistoryView';
import { PortalPatient, LatestMeasurement, LatestBio } from './PortalShell';

interface Props {
  patient: PortalPatient;
  menus: GeneratedMenu[];
  activeTracking: TrackingRow | null;
  allTracking: TrackingRow[];
  activeMenu: GeneratedMenu | null;
  latestMeasurement?: LatestMeasurement | null;
  latestBio?: LatestBio | null;
}

// ─── Metric helpers ───────────────────────────────────────────────────────────

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function calcDayNumber(startDate: string): number {
  const start = new Date(startDate + 'T12:00:00');
  const today = new Date(todayStr() + 'T12:00:00');
  return Math.max(1, Math.round((today.getTime() - start.getTime()) / 86400000) + 1);
}

function calcCompliance(trackingData: Record<string, any>): { completed: number; total: number } {
  let completed = 0; let total = 0;
  for (const day of Object.values(trackingData)) {
    if (!day || typeof day !== 'object') continue;
    for (const meal of Object.values(day)) {
      if (!meal || typeof meal !== 'object') continue;
      if ('completed' in (meal as any)) {
        total++;
        if ((meal as any).completed === true) completed++;
      }
    }
  }
  return { completed, total };
}

function calcStreak(trackingData: Record<string, any>, startDate: string): number {
  let streak = 0;
  const d = new Date(todayStr() + 'T12:00:00');
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (key < startDate) break;
    const dayData = trackingData[key] ?? {};
    const hasCompleted = Object.values(dayData).some(
      (m): m is { completed: boolean } =>
        typeof m === 'object' && m !== null && (m as any).completed === true,
    );
    if (hasCompleted) {
      streak++;
    } else if (i > 0) {
      break; // allow today to be empty
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calcDaysFullyCompleted(
  trackingData: Record<string, any>,
  weeklyMenu: any,
  startDate: string,
): number {
  const JS_DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  let count = 0;
  const d = new Date(startDate + 'T12:00:00');
  const todayD = new Date(todayStr() + 'T12:00:00');
  while (d <= todayD) {
    const key = d.toISOString().slice(0, 10);
    const dayData = trackingData[key];
    if (dayData) {
      const jsDay = d.getDay();
      const dayKey = JS_DAY_KEYS[jsDay];
      const menuDay = dayKey === 'domingo'
        ? (weeklyMenu?.domingoV2?.desayuno ? weeklyMenu.domingoV2 : weeklyMenu?.domingo)
        : weeklyMenu?.[dayKey];
      const expectedMeals: string[] = menuDay?.mealsOrder?.length
        ? menuDay.mealsOrder
        : ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'].filter(
            (k: string) => menuDay?.[k]?.title,
          );
      if (expectedMeals.length > 0) {
        const allDone = expectedMeals.every(
          (mk) => dayData[mk]?.completed === true,
        );
        if (allDone) count++;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function calcTotalPossibleMeals(weeklyMenu: any, startDate: string, durationDays: number): number {
  const JS_DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const today = todayStr();
  let total = 0;
  const d = new Date(startDate + 'T12:00:00');
  const endDate = new Date(
    new Date(startDate + 'T12:00:00').getTime() + durationDays * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  const end = endDate < today ? endDate : today;
  const endD = new Date(end + 'T12:00:00');
  while (d <= endD) {
    const jsDay = d.getDay();
    const dayKey = JS_DAY_KEYS[jsDay];
    const menuDay = dayKey === 'domingo'
      ? (weeklyMenu?.domingoV2?.desayuno ? weeklyMenu.domingoV2 : weeklyMenu?.domingo)
      : weeklyMenu?.[dayKey];
    if (menuDay?.mealsOrder?.length) {
      total += menuDay.mealsOrder.length;
    } else if (menuDay) {
      const keys = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
      total += keys.filter((k) => menuDay[k]?.title).length;
    }
    d.setDate(d.getDate() + 1);
  }
  return Math.max(total, 1);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  emoji: string;
  value: string | number;
  label: string;
  highlight?: boolean;
}> = ({ emoji, value, label, highlight }) => (
  <div
    className="flex-1 p-3 rounded-2xl text-center"
    style={{
      backgroundColor: highlight ? '#E8F0EC' : '#F9FAFB',
      border: `1.5px solid ${highlight ? '#A7D4BE' : '#E0E8E3'}`,
    }}
  >
    <span className="text-xl">{emoji}</span>
    <p
      className="text-xl font-extrabold leading-none mt-1"
      style={{ color: highlight ? '#2D5A4B' : '#111827' }}
    >
      {value}
    </p>
    <p className="text-xs mt-1 leading-tight" style={{ color: '#6B7C73' }}>{label}</p>
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 pt-6 pb-3">
    <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
    <div className="mt-1 h-0.5 w-8 rounded-full" style={{ backgroundColor: '#2D5A4B' }} />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ProgressView: React.FC<Props> = ({
  patient, menus, activeTracking, allTracking,
  activeMenu, latestMeasurement, latestBio,
}) => {
  const isActive = !!activeTracking?.menuStartDate;
  const tracking = activeTracking;
  const trackingData = tracking?.trackingData ?? {};
  const weeklyMenu = activeMenu?.menuData?.weeklyMenu;

  const dayNumber   = isActive ? calcDayNumber(tracking!.menuStartDate!)  : 0;
  const durationDays = tracking?.durationDays ?? 28;
  const totalWeeks  = Math.ceil(durationDays / 7);
  const currentWeek = isActive ? Math.min(Math.ceil(dayNumber / 7), totalWeeks) : 0;

  const { completed, total } = calcCompliance(trackingData);
  const compPct    = total > 0 ? Math.round((completed / total) * 100) : 0;
  const streak     = isActive ? calcStreak(trackingData, tracking!.menuStartDate!)   : 0;
  const daysDone   = isActive ? calcDaysFullyCompleted(trackingData, weeklyMenu, tracking!.menuStartDate!) : 0;
  const totalPossible = isActive && weeklyMenu
    ? calcTotalPossibleMeals(weeklyMenu, tracking!.menuStartDate!, durationDays)
    : 0;
  const remaining  = Math.max(0, totalPossible - completed);

  // Badge
  const badge =
    compPct >= 80 ? { text: '¡Vas por muy buen camino! 🌟', color: '#2D5A4B', bg: '#E8F0EC' } :
    compPct >= 50 ? { text: '¡Sigue adelante! 💪', color: '#B45309', bg: '#FEF9C3' } :
                    { text: '¡Tú puedes mejorar! 🔥', color: '#C2410C', bg: '#FFEDD5' };

  return (
    <div
      className="min-h-screen bg-white"
      style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
    >
      {/* ── Page title ── */}
      <div className="px-4 pt-5 pb-2">
        <h2 className="text-2xl font-extrabold text-gray-900">Mi Progreso</h2>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 1 — Cumplimiento mensual
          ════════════════════════════════════════ */}
      <div className="px-4 pb-2">
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: 'white', border: '1.5px solid #E0E8E3' }}
        >
          {/* Label */}
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: '#6B7C73', fontSize: '10px' }}
          >
            Cumplimiento mensual
          </p>

          {/* Big % */}
          <div className="flex items-end gap-3 mb-3">
            <p className="text-5xl font-extrabold leading-none" style={{ color: '#2D5A4B' }}>
              {compPct}
              <span className="text-2xl">%</span>
            </p>
            {isActive && (
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full mb-1"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.text}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#E8F0EC' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${compPct}%`, backgroundColor: '#2D5A4B' }}
            />
          </div>

          {/* Remaining points */}
          {isActive && totalPossible > 0 && (
            <p className="text-xs" style={{ color: '#6B7C73' }}>
              {remaining > 0
                ? `Faltan ${remaining} punto${remaining !== 1 ? 's' : ''} para alcanzar tu meta`
                : '¡Has alcanzado tu meta de cumplimiento! 🎉'}
            </p>
          )}
          {!isActive && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Inicia tu plan para ver tu progreso aquí.
            </p>
          )}
        </div>
      </div>

      {/* 2x2 stats grid */}
      {isActive && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 mb-2">
            <StatCard emoji="⭐" value={completed} label="Puntos acumulados" highlight />
            <StatCard emoji="🔥" value={streak}    label="Racha actual (días)" highlight />
          </div>
          <div className="flex gap-2">
            <StatCard emoji="✅" value={daysDone}     label="Días completados" />
            <StatCard emoji="📅" value={`S${currentWeek}`} label={`de ${totalWeeks} semanas`} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          SECCIÓN 2 — Medidas
          ════════════════════════════════════════ */}
      <div className="border-t" style={{ borderColor: '#F0F4F1' }}>
        <SectionHeader title="Medidas" />
        <MeasurementsView
          latestMeasurement={latestMeasurement}
          latestBio={latestBio}
        />
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 3 — Historial de menús
          ════════════════════════════════════════ */}
      <div className="border-t" style={{ borderColor: '#F0F4F1' }}>
        <SectionHeader title="Menús Historial" />
        <HistoryView
          menus={menus}
          allTracking={allTracking}
          activeMenuId={activeTracking?.menuId}
        />
      </div>
    </div>
  );
};
