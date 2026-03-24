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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
          <img
            src="/logo_nutrifollow.png"
            alt="NutriFollow"
            className="w-10 h-10 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <p className="text-slate-500 text-sm font-medium">NutriFollow</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8">
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-1">Bienvenido</h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            Ingresa tu PIN de 4 dígitos para acceder a tu plan nutricional.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 justify-center mb-6">
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
                  className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all
                    ${d ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-800'}
                    focus:border-emerald-500 focus:bg-emerald-50
                    disabled:opacity-50`}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5 text-center">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={digits.join('').length < 4 || loading}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400
                text-white font-bold rounded-2xl transition-all text-base shadow-lg shadow-emerald-600/20
                disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verificando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-5">
            Tu nutricionista te compartió este PIN junto con el link.
          </p>
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

import { LatestMeasurement, LatestBio } from '../components/patient_mobile_portal/PortalShell';

interface PortalData {
  nutritionist: PortalNutritionist;
  patient: { consultmotive?: string };
  menus: GeneratedMenu[];
  activeTracking: TrackingRow | null;
  allTracking: TrackingRow[];
  latestMeasurement: LatestMeasurement | null;
  latestBio: LatestBio | null;
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
  // 1. Get patient owner_id + consultmotive
  const { data: patientRow } = await supabase
    .from('patients')
    .select('owner_id, consultmotive')
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
          .select('name, specialty, avatar, email, contact_email, phone, personal_phone, instagram_handle, website, address')
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

    (async () => {
      try {
        return await supabase
          .from('measurements')
          .select('date, weight, height, imc, body_fat_pct, lean_mass_kg, lean_mass_pct, muscle_mass_kg, bone_mass')
          .eq('patient_id', patientId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
      } catch { return { data: null }; }
    })(),

    (async () => {
      try {
        return await supabase
          .from('bioimpedancia_measurements')
          .select('date, weight, body_fat_pct, muscle_mass, metabolic_age, bmr, visceral_fat, water_pct')
          .eq('patient_id', patientId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
      } catch { return { data: null }; }
    })(),
  ]);

  const profile = profileResult.data;
  const nutritionist: PortalNutritionist = {
    name:          profile?.name             ?? 'Tu nutricionista',
    specialty:     profile?.specialty        ?? 'Nutrición',
    avatar:        profile?.avatar           ?? undefined,
    email:         profile?.contact_email    ?? profile?.email ?? undefined,
    phone:         profile?.phone            ?? undefined,
    personalPhone: profile?.personal_phone   ?? undefined,
    instagram:     profile?.instagram_handle ?? undefined,
    website:       profile?.website          ?? undefined,
    address:       profile?.address          ?? undefined,
  };

  const menus: GeneratedMenu[] = (menusResult.data ?? []).map(mapMenuFromRaw);
  const allTracking: TrackingRow[] = ((trackingAllResult as any).data ?? []).map(mapTrackingFromRaw);
  const activeTracking = allTracking.length > 0 ? allTracking[0] : null;

  const mRow = (measurementResult as any).data;
  const latestMeasurement: LatestMeasurement | null = mRow ? {
    date:        mRow.date,
    weight:      mRow.weight,
    height:      mRow.height,
    imc:         mRow.imc,
    bodyFatPct:  mRow.body_fat_pct,
    leanMassKg:  mRow.lean_mass_kg,
    leanMassPct: mRow.lean_mass_pct,
    muscleKg:    mRow.muscle_mass_kg,
    boneMass:    mRow.bone_mass,
  } : null;

  const bRow = (bioResult as any).data;
  const latestBio: LatestBio | null = bRow ? {
    date:          bRow.date,
    weight:        bRow.weight,
    bodyFatPct:    bRow.body_fat_pct,
    muscleMass:    bRow.muscle_mass,
    metabolicAge:  bRow.metabolic_age,
    bmr:           bRow.bmr,
    visceralFat:   bRow.visceral_fat,
    waterPct:      bRow.water_pct,
  } : null;

  return {
    nutritionist,
    patient: { consultmotive: patientRow?.consultmotive ?? undefined },
    menus,
    activeTracking,
    allTracking,
    latestMeasurement,
    latestBio,
  };
}

// ─── Portal view (after auth) ─────────────────────────────────────────────────

const PortalLoader: React.FC<{ session: PortalSession }> = ({ session }) => {
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
        id:             session.patientId,
        firstName:      session.firstName,
        lastName:       session.lastName,
        consultmotive:  portalData.patient.consultmotive,
      }}
      menus={portalData.menus}
      activeTracking={activeTracking}
      allTracking={portalData.allTracking}
      nutritionist={portalData.nutritionist}
      latestMeasurement={portalData.latestMeasurement}
      latestBio={portalData.latestBio}
      onTrackingUpdate={setActiveTracking}
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
