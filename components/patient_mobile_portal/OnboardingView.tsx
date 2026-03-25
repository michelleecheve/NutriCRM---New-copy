import React, { useState } from 'react';
import { Calendar, Star, Rocket, Utensils } from 'lucide-react';
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
  lineColor: string;
  title: string;
  description?: string;
  descriptionNode?: React.ReactNode;
  badge?: string;
}

function buildTimeline(durationDays: number): TimelineItem[] {
  return [
    {
      icon: <Calendar className="w-5 h-5" />,
      iconBg: 'transparent',
      iconColor: '#2D8A6A',
      lineColor: '#2D8A6A',
      title: 'Tu Objetivo',
      descriptionNode: (
        <>
          Tu objetivo es completar tu plan nutricional en{' '}
          <strong style={{ color: '#1F2937' }}>{durationDays} días</strong>.
          {' '}Utiliza esta app cada día para visualizar las porciones por tiempo de comida y tu menú diario.
        </>
      ),
    },
    {
      icon: <Star className="w-5 h-5" />,
      iconBg: 'transparent',
      iconColor: '#3A7BC8',
      lineColor: '#3A7BC8',
      title: 'Tracking de Progreso',
      description:
        'Interactúa marcando tus comidas para sumar puntos y mantener tu racha, puedes obtener un premio al final del mes.',
      badge: 'SUMA PUNTOS Y ACUMULA RACHA',
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      iconBg: 'transparent',
      iconColor: '#C0813A',
      lineColor: '#C0813A',
      title: '¡Es hora de iniciar tu camino!',
      description:
        'Presiona el botón de abajo para confirmar que iniciarás tu plan hoy mismo. Al dar iniciar, el contador empezará a partir de hoy.',
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OnboardingView: React.FC<Props> = ({
  patient, nutritionist, activeTracking, onStart,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TIMELINE = buildTimeline(activeTracking?.durationDays ?? 30);

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F7F4', display: 'flex', flexDirection: 'column' }}>

      {/* ── Dark hero ── */}
      <div style={{
        backgroundColor: '#1A2E25',
        borderRadius: '0 0 28px 28px',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: '28px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}>
        {/* Greeting */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: '12px',
          backgroundColor: 'rgba(251,191,36,0.18)',
          color: '#FCD34D',
          marginBottom: '10px',
        }}>
          <Rocket size={18} />
        </div>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, lineHeight: 1.2 }}>
          ¡Hola, {patient.firstName}!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 400, marginTop: '8px', lineHeight: 1.6 }}>
          Tu nutricionista{' '}
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {nutritionist.professionalTitle ? `${nutritionist.professionalTitle} ` : ''}{nutritionist.name}
          </span>{' '}
          te preparó un{' '}
          <span style={{ color: '#6EE7B7', fontWeight: 600 }}>Plan Nutricional interactivo listo para comenzar.</span>
        </p>
      </div>

      {/* ── Timeline + button ── */}
      <div style={{ padding: '24px 20px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        {TIMELINE.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '14px' }}>

            {/* Icon + vertical line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 44, height: 44,
                color: item.iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              {(i < TIMELINE.length - 1 || i === TIMELINE.length - 1) && (
                <div style={{
                  width: 2, flex: 1, minHeight: 20,
                  marginTop: 6, marginBottom: 6,
                  background: i < TIMELINE.length - 1
                    ? `linear-gradient(to bottom, ${item.lineColor}, #E0E8E3)`
                    : `linear-gradient(to bottom, ${item.lineColor}, transparent)`,
                  borderRadius: 99,
                }} />
              )}
            </div>

            {/* Content card */}
            <div style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E8EEF0',
              padding: '14px 16px',
              marginBottom: i < TIMELINE.length - 1 ? '8px' : '0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: '4px' }}>{item.title}</h3>
              <p style={{ fontSize: '12px', lineHeight: 1.65, color: '#6B7280' }}>
                {item.descriptionNode ?? item.description}
              </p>
              {item.badge && (
                <span style={{
                  display: 'inline-block', marginTop: '8px',
                  padding: '4px 10px', borderRadius: '99px',
                  backgroundColor: '#ECFDF5', color: '#065F46',
                  border: '1px solid #A7F3D0',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* ── Inline start button ── */}
        {activeTracking && (
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {error && (
              <p style={{ color: '#DC2626', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>{error}</p>
            )}
            <button
              onClick={handleStart}
              disabled={loading}
              style={{
                minWidth: '260px',
                maxWidth: '340px',
                minHeight: '64px',
                borderRadius: '20px',
                background: loading
                  ? 'linear-gradient(135deg, #2D5A4B 0%, #1A2E25 100%)'
                  : 'linear-gradient(135deg, #1A4A35 0%, #2D5A4B 50%, #1A3D2E 100%)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 28px rgba(26,46,37,0.38), inset 0 1px 0 rgba(255,255,255,0.1)',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0 24px',
              }}
            >
              {loading ? (
                <>
                  <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.01em' }}>Iniciando...</span>
                </>
              ) : (
                <>
                  <div style={{
                    width: 38, height: 38, borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Utensils size={18} strokeWidth={2.2} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1.2 }}>
                      Iniciar Día 1 Hoy
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3, marginTop: '2px' }}>
                      Al dar click el contador empieza hoy
                    </span>
                  </div>
                </>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
};
