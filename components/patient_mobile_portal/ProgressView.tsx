import React, { useState } from 'react';
import { Star, Flame, CalendarDays, Flag, TrendingUp, Zap } from 'lucide-react';
import { GeneratedMenu, TrackingRow } from '../../types';
import { MeasurementsView } from './MeasurementsView';
import { HistoryView } from './HistoryView';
import { PortalPatient, MeasurementEntry, BioEntry } from './PortalShell';

interface Props {
  patient: PortalPatient;
  menus: GeneratedMenu[];
  activeTracking: TrackingRow | null;
  allTracking: TrackingRow[];
  activeMenu: GeneratedMenu | null;
  measurements?: MeasurementEntry[];
  bioMeasurements?: BioEntry[];
}

type Tab = 'medidas' | 'historial';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function calcDayNumber(startDate: string): number {
  const start = new Date(startDate + 'T12:00:00');
  const today = new Date(todayStr() + 'T12:00:00');
  return Math.max(1, Math.round((today.getTime() - start.getTime()) / 86400000) + 1);
}

function calcCompliance(trackingData: Record<string, any>): { completed: number } {
  let completed = 0;
  for (const day of Object.values(trackingData)) {
    if (!day || typeof day !== 'object') continue;
    for (const meal of Object.values(day)) {
      if (!meal || typeof meal !== 'object') continue;
      if ('completed' in (meal as any) && (meal as any).completed === true) completed++;
    }
  }
  return { completed };
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
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function formatShortDate(d: string): string {
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days - 1);
  return d.toISOString().slice(0, 10);
}

// ─── Ring SVG ─────────────────────────────────────────────────────────────────

const ProgressRing: React.FC<{ currentDay: number; totalDays: number }> = ({
  currentDay, totalDays,
}) => {
  const R = 52;
  const CX = 68;
  const CY = 68;
  const CIRC = 2 * Math.PI * R;
  const progress = Math.min(Math.max(currentDay / totalDays, 0), 1);
  const offset = CIRC * (1 - progress);

  return (
    <svg viewBox="0 0 136 136" width={160} height={160}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={10} />
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#6EE7B7"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '68px 68px', transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
};

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabBtn: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label, active, onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '9px 0',
      borderRadius: '12px',
      backgroundColor: active ? '#FFFFFF' : 'transparent',
      color: active ? '#1A2E25' : 'rgba(255,255,255,0.5)',
      fontWeight: 700,
      fontSize: '13px',
      border: 'none',
      outline: 'none',
      boxShadow: active ? '0 1px 6px rgba(0,0,0,0.14)' : 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      letterSpacing: '-0.01em',
    }}
  >
    {label}
  </button>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ProgressView: React.FC<Props> = ({
  patient, menus, activeTracking, allTracking,
  activeMenu, measurements, bioMeasurements,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('medidas');

  const isActive = !!activeTracking?.menuStartDate;
  const tracking = activeTracking;
  const trackingData = tracking?.trackingData ?? {};
  const durationDays = tracking?.durationDays ?? 28;

  const dayNumber = isActive ? calcDayNumber(tracking!.menuStartDate!) : 0;
  const diasTranscurridos = isActive
    ? Math.floor(
        (new Date(todayStr() + 'T12:00:00').getTime() -
          new Date(tracking!.menuStartDate! + 'T12:00:00').getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const compPct = isActive ? Math.min(Math.floor((diasTranscurridos / durationDays) * 100), 100) : 0;
  const endDateStr = isActive ? addDays(tracking!.menuStartDate!, durationDays) : null;

  const { completed } = calcCompliance(trackingData);
  const streak = isActive ? calcStreak(trackingData, tracking!.menuStartDate!) : 0;

  const badgeConfig = isActive && compPct >= 50
    ? compPct >= 80
      ? { text: 'Vas por muy buen camino', Icon: TrendingUp, color: '#6EE7B7', bg: 'rgba(110,231,183,0.16)' }
      : { text: 'Sigue adelante',          Icon: Zap,         color: '#FCD34D', bg: 'rgba(252,211,77,0.16)'  }
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F4F1' }}>

      {/* ════════ HERO VERDE ════════ */}
      <div style={{ backgroundColor: '#1A2E25', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
        <div style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>

          <div className="px-5 pb-2">

            {/* Badge */}
            {badgeConfig && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: badgeConfig.bg }}
              >
                <badgeConfig.Icon className="w-3 h-3" style={{ color: badgeConfig.color }} />
                <span className="font-semibold" style={{ color: badgeConfig.color, fontSize: '11px' }}>
                  {badgeConfig.text}
                </span>
              </div>
            )}
            {/* spacer when no badge */}
            {!badgeConfig && <div style={{ height: '8px' }} />}

            {/* Ring */}
            <div className="relative flex items-center justify-center mb-3">
              <ProgressRing currentDay={dayNumber} totalDays={durationDays} />
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="font-bold uppercase" style={{ color: '#6EE7B7', fontSize: '9px', letterSpacing: '0.14em' }}>
                  DÍA
                </span>
                <span className="font-black" style={{ color: '#FFFFFF', fontSize: '46px', lineHeight: 1 }}>
                  {isActive ? dayNumber : '—'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px' }}>
                  de {durationDays}
                </span>
              </div>
            </div>

            {/* Dates */}
            {isActive && tracking?.menuStartDate && endDateStr ? (
              <div className="flex items-center justify-center gap-5 mb-4">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                    {formatShortDate(tracking.menuStartDate)}
                  </span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
                <div className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                    {formatShortDate(endDateStr)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center mb-4" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                Inicia tu plan para ver tu progreso.
              </p>
            )}

            {/* Stats strip */}
            {isActive && (
              <div className="flex justify-center mb-5">
                <div
                  className="inline-flex items-center rounded-2xl overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-1.5 px-4 py-2.5">
                    <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6EE7B7', fill: '#6EE7B7' }} />
                    <span className="font-black" style={{ color: '#FFFFFF', fontSize: '16px', lineHeight: 1 }}>
                      {completed}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px' }}>
                      Puntos
                    </span>
                  </div>
                  <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
                  <div className="flex items-center gap-1.5 px-4 py-2.5">
                    <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FCA5A5', fill: '#FCA5A5' }} />
                    <span className="font-black" style={{ color: '#FFFFFF', fontSize: '16px', lineHeight: 1 }}>
                      {streak}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px' }}>
                      Días racha
                    </span>
                  </div>
                </div>
              </div>
            )}
            {!isActive && <div style={{ height: '8px' }} />}
          </div>

          {/* Tab selector */}
          <div className="px-4 pb-5">
            <div
              className="flex p-1 gap-1 rounded-2xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <TabBtn label="Medidas"         active={activeTab === 'medidas'}   onClick={() => setActiveTab('medidas')}   />
              <TabBtn label="Historial Menús" active={activeTab === 'historial'} onClick={() => setActiveTab('historial')} />
            </div>
          </div>

        </div>
      </div>

      {/* ════════ CONTENIDO ════════ */}
      <div>
        {activeTab === 'medidas' && (
          <MeasurementsView
            measurements={measurements ?? []}
            bioMeasurements={bioMeasurements ?? []}
          />
        )}
        {activeTab === 'historial' && (
          <HistoryView
            menus={menus}
            allTracking={allTracking}
            activeMenuId={activeTracking?.menuId}
          />
        )}
      </div>

    </div>
  );
};
