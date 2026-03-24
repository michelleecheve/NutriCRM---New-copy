import React, { useState } from 'react';
import { Calendar, Star, Rocket } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { TrackingRow } from '../../types';
import { PortalPatient, PortalNutritionist } from './PortalShell';

interface Props {
  patient: PortalPatient;
  nutritionist: PortalNutritionist;
  activeTracking: TrackingRow | null;
  onStart: (t: TrackingRow) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Timeline item ─────────────────────────────────────────────────────────────

interface TimelineItem {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  badge?: string;
}

const TIMELINE: TimelineItem[] = [
  {
    icon: <Calendar className="w-5 h-5" />,
    iconBg: '#E8F0EC',
    iconColor: '#2D5A4B',
    title: 'Tu Objetivo',
    description:
      'Tu objetivo es completar tu plan nutricional en un mes. Utiliza esta app cada día para visualizar las porciones por tiempo de comida y tu menú diario.',
  },
  {
    icon: <Star className="w-5 h-5" />,
    iconBg: '#EBF5FF',
    iconColor: '#3B82F6',
    title: 'Tracking de Progreso',
    description:
      'Cuanto más interactúes marcando tus comidas, sumarás puntos para obtener una insignia o premio al final del mes.',
    badge: '+ GANA PUNTOS EXTRA POR CONSISTENCIA',
  },
  {
    icon: <Rocket className="w-5 h-5" />,
    iconBg: '#F3F4F6',
    iconColor: '#6B7280',
    title: '¡Es hora de iniciar tu camino!',
    description:
      'Estás a un paso de comenzar. Presiona el botón de abajo para activar tu plan hoy mismo.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const OnboardingView: React.FC<Props> = ({
  patient, nutritionist, activeTracking, onStart,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!activeTracking) return;
    setLoading(true);
    setError(null);
    try {
      const today = todayStr();
      const endDate = addDays(today, activeTracking.durationDays);

      const { data, error: dbError } = await supabase
        .from('patient_digital_tracking')
        .update({
          menu_start_date: today,
          menu_end_date: endDate,
          updated_at: new Date().toISOString(),
        })
        .eq('patient_id', patient.id)
        .eq('menu_id', activeTracking.menuId)
        .select()
        .single();

      if (dbError) throw dbError;

      onStart({
        id:            data.id,
        patientId:     data.patient_id,
        menuId:        data.menu_id,
        durationDays:  data.duration_days  ?? 28,
        menuStartDate: data.menu_start_date ?? null,
        menuEndDate:   data.menu_end_date   ?? null,
        trackingData:  data.tracking_data   ?? {},
        updatedAt:     data.updated_at,
      });
    } catch {
      setError('No se pudo iniciar el plan. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Nutri top bar ── */}
      <div
        className="flex items-center justify-between px-5 pb-4 bg-white"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <div>
          <p className="font-semibold text-gray-900 text-sm">{nutritionist.name}</p>
          <p className="text-xs" style={{ color: '#6B7C73' }}>{nutritionist.specialty}</p>
        </div>
        <div
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#E8F0EC' }}
        >
          {nutritionist.avatar ? (
            <img
              src={nutritionist.avatar}
              alt={nutritionist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-sm" style={{ color: '#2D5A4B' }}>
              {nutritionist.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="px-5 pb-6" style={{ backgroundColor: '#F9FBF9' }}>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
          ¡Hola {patient.firstName}!
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#6B7C73' }}>
          Para empezar hoy el Día 1 de tu menú desliza hacia abajo
        </p>
        <button
          onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
          className="mt-4 px-6 rounded-2xl text-white font-bold text-sm flex items-center gap-2"
          style={{ backgroundColor: '#2D5A4B', minHeight: '48px' }}
        >
          ¡Empecemos! ↓
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="h-px mx-5" style={{ backgroundColor: '#E8F0EC' }} />

      {/* ── Timeline ── */}
      <div className="px-5 pt-6" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {TIMELINE.map((item, i) => (
          <div key={i} className="flex gap-4 mb-2">

            {/* Icon + vertical line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: item.iconBg, color: item.iconColor }}
              >
                {item.icon}
              </div>
              {i < TIMELINE.length - 1 && (
                <div
                  className="w-0.5 my-2 flex-1"
                  style={{ backgroundColor: '#E8F0EC', minHeight: '32px' }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7C73' }}>
                {item.description}
              </p>
              {item.badge && (
                <span
                  className="inline-block mt-2 px-3 py-1 rounded-full text-white font-bold"
                  style={{ backgroundColor: '#2D5A4B', fontSize: '10px', letterSpacing: '0.04em' }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Fixed start button (above tab bar) ── */}
      {activeTracking && (
        <div
          className="fixed left-0 right-0 bg-white px-5"
          style={{
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            paddingTop: '12px',
            paddingBottom: '12px',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
            zIndex: 20,
          }}
        >
          {error && (
            <p className="text-red-500 text-xs text-center mb-2">{error}</p>
          )}
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#2D5A4B', minHeight: '56px', fontSize: '16px' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Iniciando...
              </>
            ) : (
              'Iniciar Día 1 Hoy →'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
