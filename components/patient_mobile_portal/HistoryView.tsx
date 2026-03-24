import React, { useState } from 'react';
import { ChevronDown, ChevronUp, UtensilsCrossed, Eye } from 'lucide-react';
import { GeneratedMenu, TrackingRow } from '../../types';

interface Props {
  menus: GeneratedMenu[];
  allTracking: TrackingRow[];
  activeMenuId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function calcMenuCompliance(
  tracking: TrackingRow | undefined,
): { completed: number; total: number; pct: number } {
  if (!tracking) return { completed: 0, total: 0, pct: 0 };
  let completed = 0; let total = 0;
  for (const day of Object.values(tracking.trackingData)) {
    if (!day || typeof day !== 'object') continue;
    for (const meal of Object.values(day)) {
      if (!meal || typeof meal !== 'object') continue;
      if ('completed' in (meal as any)) {
        total++;
        if ((meal as any).completed === true) completed++;
      }
    }
  }
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
}

const DAYS_ORDERED = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
];

const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno', refaccion1: 'Refacción', almuerzo: 'Almuerzo',
  refaccion2: 'Merienda', cena: 'Cena',
};

// ─── Expanded day row ─────────────────────────────────────────────────────────

const ExpandedMenu: React.FC<{ menu: GeneratedMenu }> = ({ menu }) => {
  const wm = menu.menuData?.weeklyMenu;
  if (!wm) return <p className="text-xs text-gray-400 px-2 py-2">Sin datos de menú.</p>;

  return (
    <div className="mt-3 space-y-3">
      {DAYS_ORDERED.map(({ key, label }) => {
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
            <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#6B7C73' }}>
              {label}
            </p>
            <div className="space-y-1">
              {meals.map((mealKey: string) => (
                <div
                  key={mealKey}
                  className="flex items-start gap-2 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: '#F9FAFB' }}
                >
                  <span className="text-xs font-semibold w-20 flex-shrink-0 pt-0.5" style={{ color: '#9CA3AF' }}>
                    {MEAL_LABELS[mealKey] ?? mealKey}
                  </span>
                  <span className="text-xs text-gray-700 leading-relaxed">
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
      <div className="text-center py-10 px-6">
        <p className="text-3xl mb-3">📚</p>
        <p className="text-sm text-gray-400">Sin historial de planes aún.</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-4 pt-1 pb-2">
        <p className="text-xs text-gray-400">
          {menus.length} plan{menus.length !== 1 ? 'es' : ''} registrado{menus.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-4 space-y-3">
        {menus.map((menu, i) => {
          const tracking = allTracking.find(t => t.menuId === menu.id);
          const { completed, total, pct } = calcMenuCompliance(tracking);
          const isActive = menu.id === activeMenuId;
          const isExpanded = expandedId === menu.id;

          return (
            <div
              key={menu.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: `1.5px solid ${isActive ? '#A7D4BE' : '#E0E8E3'}`,
              }}
            >
              {/* ── Header row ── */}
              <div className="flex items-center gap-3 p-4">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isActive ? '#2D5A4B' : '#F3F4F6' }}
                >
                  <UtensilsCrossed className="w-4 h-4" style={{ color: isActive ? 'white' : '#6B7280' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {menu.name || `Plan #${menus.length - i}`}
                    </p>
                    {isActive && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#2D5A4B', color: 'white' }}
                      >
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {formatDate(menu.date)}
                    {menu.kcalToWork ? ` · ${menu.kcalToWork} kcal` : ''}
                  </p>
                </div>

                {/* Eye/expand button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : menu.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ backgroundColor: isExpanded ? '#E8F0EC' : '#F3F4F6' }}
                  aria-label="Ver menú"
                >
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" style={{ color: '#2D5A4B' }} />
                    : <Eye className="w-4 h-4" style={{ color: '#6B7280' }} />
                  }
                </button>
              </div>

              {/* ── Compliance bar (only if has tracking) ── */}
              {total > 0 && (
                <div className="px-4 pb-3">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#6B7C73' }}>
                    <span>Cumplimiento</span>
                    <span className="font-semibold" style={{ color: '#2D5A4B' }}>
                      {pct}% · {completed}/{total} comidas
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8F0EC' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: '#2D5A4B', transition: 'width 0.4s' }}
                    />
                  </div>
                </div>
              )}

              {/* ── Expanded menu ── */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: '#F0F4F1' }}>
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
