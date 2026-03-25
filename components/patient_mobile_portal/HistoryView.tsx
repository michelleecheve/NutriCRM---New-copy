import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Flame } from 'lucide-react';
import { GeneratedMenu, TrackingRow } from '../../types';

interface Props {
  menus: GeneratedMenu[];
  allTracking: TrackingRow[];
  activeMenuId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLong(d: string): string {
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

function calcDayProgress(
  tracking: TrackingRow | undefined,
): { currentDay: number; totalDays: number; pct: number } {
  if (!tracking?.menuStartDate) return { currentDay: 0, totalDays: 0, pct: 0 };
  const totalDays = tracking.durationDays ?? 28;
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00');
  const start = new Date(tracking.menuStartDate + 'T12:00:00');
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86400000);
  const currentDay = Math.min(Math.max(elapsed + 1, 1), totalDays);
  const pct = Math.min(Math.floor((elapsed / totalDays) * 100), 100);
  return { currentDay, totalDays, pct };
}

const DAYS_ORDERED = [
  { key: 'lunes',     label: 'Lunes',      color: '#2D5A4B' },
  { key: 'martes',    label: 'Martes',     color: '#0369A1' },
  { key: 'miercoles', label: 'Miércoles',  color: '#7C3AED' },
  { key: 'jueves',    label: 'Jueves',     color: '#B45309' },
  { key: 'viernes',   label: 'Viernes',    color: '#0E7490' },
  { key: 'sabado',    label: 'Sábado',     color: '#9D174D' },
  { key: 'domingo',   label: 'Domingo',    color: '#1E40AF' },
];

const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno', refaccion1: 'Refacción', almuerzo: 'Almuerzo',
  refaccion2: 'Merienda', cena: 'Cena',
};

// ─── Expanded menu ────────────────────────────────────────────────────────────

const ExpandedMenu: React.FC<{ menu: GeneratedMenu }> = ({ menu }) => {
  const wm = menu.menuData?.weeklyMenu;
  if (!wm) {
    return (
      <p className="text-xs py-3 text-center" style={{ color: '#9CA3AF' }}>
        Sin datos de menú.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      {DAYS_ORDERED.map(({ key, label, color }) => {
        const dayData = key === 'domingo'
          ? (wm.domingoV2?.desayuno ? wm.domingoV2 : (wm.domingo?.desayuno ? wm.domingo : null))
          : wm[key];
        if (!dayData) return null;

        const order: string[] = dayData.mealsOrder?.length
          ? dayData.mealsOrder
          : ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];

        const meals = order.filter((k: string) => dayData[k]?.title);
        if (meals.length === 0) return null;

        return (
          <div key={key}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <p
                className="font-bold uppercase"
                style={{ color: '#4B5E57', fontSize: '10px', letterSpacing: '0.08em' }}
              >
                {label}
              </p>
            </div>

            {/* Meal rows — dot + label use day color, food title stays dark */}
            <div className="space-y-1.5">
              {meals.map((mealKey: string) => (
                <div
                  key={mealKey}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#F9FAFB' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="font-bold flex-shrink-0 w-20"
                    style={{ color: color, fontSize: '11px' }}
                  >
                    {dayData[mealKey]?.label ?? MEAL_LABELS[mealKey] ?? mealKey}
                  </span>
                  <span
                    className="leading-relaxed"
                    style={{ color: '#1A2E25', fontSize: '12px' }}
                  >
                    {dayData[mealKey]?.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const HistoryView: React.FC<Props> = ({ menus, allTracking, activeMenuId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (menus.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: '#EEF2FF' }}
        >
          <BookOpen className="w-5 h-5" style={{ color: '#4338CA' }} />
        </div>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Sin historial de planes aún.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">

      {/* Count label */}
      <p
        className="font-bold uppercase mb-3"
        style={{ color: '#9CA3AF', fontSize: '10px', letterSpacing: '0.08em' }}
      >
        {menus.length} plan{menus.length !== 1 ? 'es' : ''} registrado{menus.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {menus.map((menu, i) => {
          const tracking = allTracking.find(t => t.menuId === menu.id);
          const { currentDay, totalDays, pct } = calcDayProgress(tracking);
          const isActive = menu.id === activeMenuId;
          const isExpanded = expandedId === menu.id;

          return (
            <div
              key={menu.id}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 14px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedId(isExpanded ? null : menu.id)}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  {/* Title + badge */}
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold" style={{ color: '#1A2E25', fontSize: '13px' }}>
                        {menu.name || `Plan #${menus.length - i}`}
                      </p>
                      {isActive && (
                        <span
                          className="font-bold uppercase px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: '#ECFDF5', color: '#065F46', fontSize: '8px', letterSpacing: '0.08em' }}
                        >
                          ACTIVO
                        </span>
                      )}
                    </div>

                    {/* Date + kcal stats */}
                    <div className="flex items-center gap-3">
                      <span style={{ color: '#9CA3AF', fontSize: '11px' }}>
                        {formatDateLong(menu.date)}
                      </span>
                      {menu.kcalToWork != null && (
                        <>
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3" style={{ color: '#F59E0B' }} />
                            <span className="font-semibold" style={{ color: '#B45309', fontSize: '11px' }}>
                              {menu.kcalToWork} kcal
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chevron indicator (visual only) */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isExpanded ? '#ECFDF5' : '#F4F6F5' }}
                  >
                    {isExpanded
                      ? <ChevronUp   className="w-3.5 h-3.5" style={{ color: '#2D5A4B' }} />
                      : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6B7C73' }} />
                    }
                  </div>
                </div>

                {/* Day progress bar */}
                {totalDays > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold" style={{ color: '#2D5A4B', fontSize: '11px' }}>
                        Día {currentDay}
                      </span>
                      <span style={{ color: '#9CA3AF', fontSize: '11px' }}>
                        de {totalDays}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0F4F1' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: '#2D5A4B', transition: 'width 0.4s ease' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 pb-5" style={{ borderTop: '1px solid #F4F6F5' }}>
                  <ExpandedMenu menu={menu} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
