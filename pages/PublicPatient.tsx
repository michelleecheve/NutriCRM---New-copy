import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { GeneratedMenu, TrackingRow } from '../types';
import { PortalShell, PortalNutritionist } from '../components/patient_mobile_portal/PortalShell';

// ─── Session helpers ─────────────────────────────────────────────────────────

interface PortalSession {
  token: string;
  patientId: string;
  firstName: string;
  lastName: string;
  accessCode: string;
  validatedAt: number;
}

function sessionKey(token: string): string {
  return `nutriflow_portal_${token}`;
}

function loadSession(token: string): PortalSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(token));
    if (!raw) return null;
    return JSON.parse(raw) as PortalSession;
  } catch {
    return null;
  }
}

function saveSession(session: PortalSession): void {
  localStorage.setItem(sessionKey(session.token), JSON.stringify(session));
}

// ─── AccessGate ──────────────────────────────────────────────────────────────

interface AccessGateProps {
  token: string;
  onSuccess: (session: PortalSession) => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ token, onSuccess }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalDisabled, setPortalDisabled] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);
    if (digit && index < 3) inputRefs[index + 1].current?.focus();
    if (digit && index === 3) {
      const pin = [...next].join('');
      if (pin.length === 4) submitPin(pin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  async function submitPin(pin: string) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, portal_active')
        .eq('access_token', token)
        .eq('access_code', pin)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('PIN incorrecto. Intenta de nuevo.');
        setDigits(['', '', '', '']);
        inputRefs[0].current?.focus();
        return;
      }

      if (!data.portal_active) {
        setPortalDisabled(true);
        return;
      }

      const session: PortalSession = {
        token,
        patientId: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        accessCode: pin,
        validatedAt: Date.now(),
      };
      saveSession(session);
      onSuccess(session);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
      setDigits(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pin = digits.join('');
    if (pin.length === 4) submitPin(pin);
  }

  if (portalDisabled) return <PortalDisabledScreen />;

  const pinReady = digits.join('').length === 4 && !loading;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #E8F5EE 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Powered by (above card) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '22px',
        zIndex: 1,
      }}>
        <img
          src="/logo_nutrifollow.png"
          alt="NutriFollow"
          style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.9 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.04em' }}>
          Powered by NutriFollow
        </span>
      </div>

      {/* ── Central card ── */}
      <div style={{
        width: '100%',
        maxWidth: 390,
        backgroundColor: 'white',
        borderRadius: '28px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 32px 64px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        zIndex: 1,
      }}>

        {/* Card header band */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #10B981 60%, #34D399 100%)',
          padding: '28px 32px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle inner glow */}
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '10%',
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }} />

          <h1 style={{
            color: 'white',
            fontSize: '26px',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '4px',
            textShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
            ¡Hola!
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.90)',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '6px',
          }}>
            Tu plan te espera
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.70)',
            fontSize: '13px',
            fontWeight: 500,
            lineHeight: 1.5,
          }}>
            Accede a tu plan alimenticio personalizado
          </p>
        </div>

        {/* Card body */}
        <div style={{ padding: '32px 32px 36px' }}>

          <p style={{
            textAlign: 'center',
            fontSize: '13.5px',
            color: '#6B7280',
            lineHeight: 1.65,
            marginBottom: '28px',
          }}>
            Ingresa el <strong style={{ color: '#065F46', fontWeight: 700 }}>PIN de 4 dígitos</strong> que tu nutricionista te envió junto con este link.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  autoFocus={i === 0}
                  style={{
                    width: 64, height: 72,
                    textAlign: 'center',
                    fontSize: '30px',
                    fontWeight: 800,
                    borderRadius: '18px',
                    border: d ? '2.5px solid #059669' : '2px solid #E5E7EB',
                    backgroundColor: d ? '#ECFDF5' : '#F9FAFB',
                    color: d ? '#064E3B' : '#374151',
                    outline: 'none',
                    boxShadow: d
                      ? '0 0 0 4px rgba(5,150,105,0.12), 0 4px 14px rgba(5,150,105,0.18)'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'all 0.18s ease',
                    opacity: loading ? 0.5 : 1,
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{
                background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)',
                border: '1.5px solid #FECACA',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '20px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!pinReady}
              style={{
                width: '100%',
                minHeight: '56px',
                borderRadius: '18px',
                background: pinReady
                  ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                  : undefined,
                backgroundColor: pinReady ? undefined : '#F3F4F6',
                color: pinReady ? 'white' : '#9CA3AF',
                fontWeight: 800,
                fontSize: '16px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: pinReady
                  ? '0 6px 24px rgba(5,150,105,0.40), 0 2px 8px rgba(5,150,105,0.20)'
                  : 'none',
                transition: 'all 0.2s ease',
                cursor: pinReady ? 'pointer' : 'not-allowed',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? (
                <>
                  <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Entrar a mi plan
                  <span style={{ fontSize: '18px' }}>→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Static screens ──────────────────────────────────────────────────────────

const PortalDisabledScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
    <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-6">
      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </div>
    <h1 className="text-xl font-bold text-slate-700 mb-2">Portal no disponible</h1>
    <p className="text-slate-400 text-sm max-w-xs">
      Tu portal está temporalmente desactivado. Contacta a tu nutricionista para más información.
    </p>
  </div>
);

const InvalidTokenScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h1 className="text-xl font-bold text-slate-700 mb-2">Link inválido</h1>
    <p className="text-slate-400 text-sm max-w-xs">
      Este link no es válido o ha expirado. Solicita uno nuevo a tu nutricionista.
    </p>
  </div>
);

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

// ─── Portal data ──────────────────────────────────────────────────────────────

import { MeasurementEntry, BioEntry } from '../components/patient_mobile_portal/PortalShell';

interface PortalData {
  nutritionist: PortalNutritionist;
  patient: { portalGoal?: string; showMeasurementsDetail: boolean };
  menus: GeneratedMenu[];
  activeTracking: TrackingRow | null;
  allTracking: TrackingRow[];
  measurements: MeasurementEntry[];
  bioMeasurements: BioEntry[];
}

function mapMenuFromRaw(row: any): GeneratedMenu {
  return {
    id:                  row.id,
    linkedEvaluationId:  row.evaluation_id,
    patientId:           row.patient_id,
    date:                row.date,
    age:                 row.age,
    weightKg:            row.weight_kg,
    heightCm:            row.height_cm,
    gender:              row.gender,
    vetDetails:          row.vet_details,
    kcalToWork:          row.kcal_to_work,
    macros:              row.macros,
    portions:            row.portions,
    templatesReferences: row.templates_references,
    templateId:          row.template_id ?? null,
    menuData:            row.menu_data,
    name:                row.name,
    content:             row.content,
    aiRationale:         row.ai_rationale,
    createdAt:           row.created_at,
  };
}

function mapTrackingFromRaw(row: any): TrackingRow {
  return {
    id:            row.id,
    patientId:     row.patient_id,
    menuId:        row.menu_id,
    durationDays:  row.duration_days  ?? 28,
    menuStartDate: row.menu_start_date ?? null,
    menuEndDate:   row.menu_end_date   ?? null,
    trackingData:  row.tracking_data   ?? {},
    updatedAt:     row.updated_at,
  };
}

async function loadPortalData(patientId: string): Promise<PortalData> {
  // 1. Get patient owner_id + portal_goal + measurements visibility
  const { data: patientRow } = await supabase
    .from('patients')
    .select('owner_id, portal_goal, portal_show_measurements_detail')
    .eq('id', patientId)
    .maybeSingle();

  const ownerId: string | null = patientRow?.owner_id ?? null;

  // 2+. Parallel fetch
  const [
    profileResult,
    menusResult,
    trackingAllResult,
    measurementResult,
    bioResult,
  ] = await Promise.all([
    ownerId
      ? supabase
          .from('profiles')
          .select('name, specialty, professional_title, avatar, email, contact_email, phone, personal_phone, instagram_handle, website, address, patient_portal_config')
          .eq('id', ownerId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    supabase
      .from('menus')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),

    supabase
      .from('patient_digital_tracking')
      .select('*')
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false }),

    // measurements: no tiene patient_id, se accede vía evaluation_id → evaluations.patient_id
    (async () => {
      try {
        const { data: evals } = await supabase
          .from('evaluations')
          .select('id')
          .eq('patient_id', patientId);
        const evalIds = (evals ?? []).map((e: any) => e.id as string);
        if (evalIds.length === 0) return { data: [] };
        return await supabase
          .from('measurements')
          .select('date, weight, height, imc, age, gender, body_fat_pct, lean_mass_pct, lean_mass_kg, fat_kg, muscle_mass_kg, bone_mass, residual_mass, biceps, triceps, subscapular, supraspinal, abdomen, thigh, calf, iliac_crest, skinfold_sum, humerus, femur, wrist, arm_relaxed, arm_contracted, waist, umbilical, hip, abdominal_low, thigh_right, thigh_left, calf_girth, endomorfo, mesomorfo, ectomorfo, diagnostic_n, subjective_valuation, meta_complied')
          .in('evaluation_id', evalIds)
          .order('date', { ascending: false });
      } catch { return { data: [] }; }
    })(),

    (async () => {
      try {
        const { data: evals } = await supabase
          .from('evaluations')
          .select('id')
          .eq('patient_id', patientId);
        const evalIds = (evals ?? []).map((e: any) => e.id as string);
        if (evalIds.length === 0) return { data: [] };
        return await supabase
          .from('bioimpedancia_measurements')
          .select('date, weight, height, imc, age, gender, body_fat_pct, water_pct, muscle_mass, bone_mass, visceral_fat, bmr, metabolic_age, physique_rating, waist, umbilical, hip, "thighLeft", "thighRight", "abdominalLow", "calfGirth", "armRelaxed", "armContracted", meta_complied')
          .in('evaluation_id', evalIds)
          .order('date', { ascending: false });
      } catch { return { data: [] }; }
    })(),
  ]);

  const profile = profileResult.data;
  const nutritionist: PortalNutritionist = {
    name:              profile?.name              ?? 'Tu nutricionista',
    specialty:         profile?.specialty         ?? 'Nutrición',
    professionalTitle: profile?.professional_title ?? undefined,
    avatar:            profile?.avatar            ?? undefined,
    email:             profile?.contact_email     ?? profile?.email ?? undefined,
    phone:             profile?.phone             ?? undefined,
    personalPhone:     profile?.personal_phone    ?? undefined,
    instagram:         profile?.instagram_handle  ?? undefined,
    website:           profile?.website           ?? undefined,
    address:           profile?.address           ?? undefined,
  };

  const menus: GeneratedMenu[] = (menusResult.data ?? []).map(mapMenuFromRaw);
  const allTracking: TrackingRow[] = ((trackingAllResult as any).data ?? []).map(mapTrackingFromRaw);
  const activeTracking = allTracking.length > 0 ? allTracking[0] : null;

  const mRows: any[] = (measurementResult as any).data ?? [];
  const measurements: MeasurementEntry[] = mRows.map(r => ({
    date:               r.date,
    weight:             r.weight,
    height:             r.height,
    imc:                r.imc,
    age:                r.age,
    gender:             r.gender,
    bodyFatPct:         r.body_fat_pct,
    leanMassPct:        r.lean_mass_pct,
    leanMassKg:         r.lean_mass_kg,
    fatKg:              r.fat_kg,
    muscleKg:           r.muscle_mass_kg,
    boneMass:           r.bone_mass,
    residualMass:       r.residual_mass,
    biceps:             r.biceps,
    triceps:            r.triceps,
    subscapular:        r.subscapular,
    supraspinal:        r.supraspinal,
    abdomen:            r.abdomen,
    thigh:              r.thigh,
    calf:               r.calf,
    iliacCrest:         r.iliac_crest,
    skinfoldSum:        r.skinfold_sum,
    humerus:            r.humerus,
    femur:              r.femur,
    wrist:              r.wrist,
    armRelaxed:         r.arm_relaxed,
    armContracted:      r.arm_contracted,
    waist:              r.waist,
    umbilical:          r.umbilical,
    hip:                r.hip,
    abdominalLow:       r.abdominal_low,
    thighRight:         r.thigh_right,
    thighLeft:          r.thigh_left,
    calfGirth:          r.calf_girth,
    endomorfo:          r.endomorfo,
    mesomorfo:          r.mesomorfo,
    ectomorfo:          r.ectomorfo,
    diagnosticN:        r.diagnostic_n,
    subjectiveValuation: r.subjective_valuation,
    metaComplied:       r.meta_complied,
  }));

  const bRows: any[] = (bioResult as any).data ?? [];
  const bioMeasurements: BioEntry[] = bRows.map(r => ({
    date:           r.date,
    weight:         r.weight,
    height:         r.height,
    imc:            r.imc,
    age:            r.age,
    gender:         r.gender,
    bodyFatPct:     r.body_fat_pct,
    waterPct:       r.water_pct,
    muscleMass:     r.muscle_mass,
    boneMass:       r.bone_mass,
    visceralFat:    r.visceral_fat,
    bmr:            r.bmr,
    metabolicAge:   r.metabolic_age,
    physiqueRating: r.physique_rating,
    waist:          r.waist,
    umbilical:      r.umbilical,
    hip:            r.hip,
    thighLeft:      r.thighLeft,
    thighRight:     r.thighRight,
    abdominalLow:   r.abdominalLow,
    calfGirth:      r.calfGirth,
    armRelaxed:     r.armRelaxed,
    armContracted:  r.armContracted,
    metaComplied:   r.meta_complied,
  }));

  return {
    nutritionist,
    patient: {
      portalGoal: patientRow?.portal_goal ?? undefined,
      showMeasurementsDetail: patientRow?.portal_show_measurements_detail
        ?? (profile?.patient_portal_config?.measurementsDetailDefault ?? true),
    },
    menus,
    activeTracking,
    allTracking,
    measurements,
    bioMeasurements,
  };
}

// ─── Portal view (after auth) ─────────────────────────────────────────────────

const PortalLoader: React.FC<{ session: PortalSession }> = ({ session: initialSession }) => {
  const [session, setSession] = useState(initialSession);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [activeTracking, setActiveTracking] = useState<TrackingRow | null>(null);

  useEffect(() => {
    loadPortalData(session.patientId)
      .then((data) => {
        setPortalData(data);
        setActiveTracking(data.activeTracking);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [session.patientId]);

  function handlePatientUpdate(updates: Partial<{ id: string; firstName: string; lastName: string; accessCode?: string; portalGoal?: string }>) {
    if (updates.accessCode !== undefined) {
      setSession(prev => ({ ...prev, accessCode: updates.accessCode! }));
    }
    if (updates.portalGoal !== undefined && portalData) {
      setPortalData(prev => prev ? { ...prev, patient: { ...prev.patient, portalGoal: updates.portalGoal } } : prev);
    }
  }



  if (state === 'loading') return <LoadingScreen />;

  if (state === 'error' || !portalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-slate-700 mb-2">Error al cargar</h1>
        <p className="text-slate-400 text-sm max-w-xs mb-6">
          No se pudo cargar tu portal. Comprueba tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <PortalShell
      token={session.token}
      patient={{
        id:         session.patientId,
        firstName:  session.firstName,
        lastName:   session.lastName,
        accessCode: session.accessCode,
        portalGoal: portalData.patient.portalGoal,
      }}
      menus={portalData.menus}
      activeTracking={activeTracking}
      allTracking={portalData.allTracking}
      nutritionist={portalData.nutritionist}
      measurements={portalData.measurements}
      bioMeasurements={portalData.bioMeasurements}
      showMeasurementsDetail={portalData.patient.showMeasurementsDetail}
      onTrackingUpdate={setActiveTracking}
      onPatientUpdate={handlePatientUpdate}
    />
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  token: string;
}

type PageState = 'checking' | 'gate' | 'portal' | 'invalid';

export const PublicPatient: React.FC<Props> = ({ token }) => {
  const [state, setState] = useState<PageState>('checking');
  const [session, setSession] = useState<PortalSession | null>(null);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    const stored = loadSession(token);
    if (stored) {
      setSession(stored);
      setState('portal');
      return;
    }

    void (async () => {
      try {
        const { data } = await supabase
          .from('patients')
          .select('id, portal_active')
          .eq('access_token', token)
          .maybeSingle();
        if (!data) setState('invalid');
        else setState('gate');
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  function handleAccessGranted(s: PortalSession) {
    setSession(s);
    setState('portal');
  }

  if (state === 'checking') return <LoadingScreen />;
  if (state === 'invalid')  return <InvalidTokenScreen />;
  if (state === 'portal' && session) return <PortalLoader session={session} />;
  return <AccessGate token={token} onSuccess={handleAccessGranted} />;
};
