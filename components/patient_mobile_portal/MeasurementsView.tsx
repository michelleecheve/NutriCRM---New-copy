import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { MeasurementEntry, BioEntry } from './PortalShell';

interface Props {
  measurements: MeasurementEntry[];
  bioMeasurements: BioEntry[];
}

function formatDateLong(d?: string): string {
  if (!d) return 'Sin fecha';
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const [y, m, day] = d.split('-');
  return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`;
}

// ─── Range chart colors ────────────────────────────────────────────────────────

const C_LOW     = '#f97316';
const C_HEALTHY = '#14b8a6';
const C_HIGH    = '#f59e0b';
const C_OBESE   = '#ef4444';

interface Zone { label: string; end: number; color: string; }

function getBodyFatZones(sex: string, age: number): Zone[] {
  if (sex === 'Femenino') {
    if (age < 40) return [
      { label: 'Bajo', end: 21, color: C_LOW },
      { label: 'Saludable', end: 33, color: C_HEALTHY },
      { label: 'Alto', end: 39, color: C_HIGH },
      { label: 'Obesidad', end: 55, color: C_OBESE },
    ];
    if (age < 60) return [
      { label: 'Bajo', end: 23, color: C_LOW },
      { label: 'Saludable', end: 34, color: C_HEALTHY },
      { label: 'Alto', end: 40, color: C_HIGH },
      { label: 'Obesidad', end: 55, color: C_OBESE },
    ];
    return [
      { label: 'Bajo', end: 24, color: C_LOW },
      { label: 'Saludable', end: 36, color: C_HEALTHY },
      { label: 'Alto', end: 42, color: C_HIGH },
      { label: 'Obesidad', end: 55, color: C_OBESE },
    ];
  } else {
    if (age < 40) return [
      { label: 'Bajo', end: 8, color: C_LOW },
      { label: 'Saludable', end: 20, color: C_HEALTHY },
      { label: 'Alto', end: 25, color: C_HIGH },
      { label: 'Obesidad', end: 40, color: C_OBESE },
    ];
    if (age < 60) return [
      { label: 'Bajo', end: 11, color: C_LOW },
      { label: 'Saludable', end: 22, color: C_HEALTHY },
      { label: 'Alto', end: 28, color: C_HIGH },
      { label: 'Obesidad', end: 40, color: C_OBESE },
    ];
    return [
      { label: 'Bajo', end: 13, color: C_LOW },
      { label: 'Saludable', end: 25, color: C_HEALTHY },
      { label: 'Alto', end: 30, color: C_HIGH },
      { label: 'Obesidad', end: 40, color: C_OBESE },
    ];
  }
}

// ─── Range bar ────────────────────────────────────────────────────────────────

const MiniRangeBar: React.FC<{
  title: string;
  value: number;
  unit: string;
  minVal: number;
  maxVal: number;
  zones: Zone[];
  chartId: string;
}> = ({ title, value, unit, minVal, maxVal, zones, chartId }) => {
  const W = 500;
  const H = 26;
  const R = 7;
  const range = maxVal - minVal;
  const clampedV = Math.max(minVal, Math.min(maxVal, value));
  const indicatorX = ((clampedV - minVal) / range) * W;

  let prevEnd = minVal;
  const segments = zones.map(z => {
    const segX = ((prevEnd - minVal) / range) * W;
    const segW = ((z.end - prevEnd) / range) * W;
    prevEnd = z.end;
    return { ...z, x: segX, w: segW };
  });

  const currentSeg = segments.find(s => value < s.end) ?? segments[segments.length - 1];

  let idealText = '';
  let zoneStart = minVal;
  for (const z of zones) {
    if (z.label === 'Saludable' || z.label === 'Normal') {
      idealText = `ideal: ${zoneStart}–${z.end}${unit}`;
      break;
    }
    zoneStart = z.end;
  }

  return (
    <div className="mt-4" style={{ width: '100%', minWidth: 0 }}>
      <p className="font-bold uppercase mb-1" style={{ color: '#1A2E25', fontSize: '10px', letterSpacing: '0.08em' }}>
        {title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className="font-extrabold" style={{ color: currentSeg.color, fontSize: '13px' }}>
          {value}{unit}
        </span>
        <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span>
        <span className="font-semibold" style={{ color: currentSeg.color, fontSize: '11px' }}>
          {currentSeg.label}
        </span>
        {idealText && (
          <span style={{ color: '#9CA3AF', fontSize: '10px' }}>({idealText})</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%" style={{ display: 'block', width: '100%', overflow: 'visible' }}>
        <defs>
          <clipPath id={chartId}>
            <rect x={0} y={0} width={W} height={H} rx={R} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${chartId})`}>
          {segments.map(s => (
            <rect key={s.label} x={s.x} y={0} width={s.w} height={H} fill={s.color} opacity={0.85} />
          ))}
        </g>
        {segments.slice(0, -1).map(s => (
          <line key={`div-${s.label}`} x1={s.x + s.w} y1={0} x2={s.x + s.w} y2={H} stroke="white" strokeWidth={2} opacity={0.5} />
        ))}
        {segments.map(s => (
          <text key={`lbl-${s.label}`} x={s.x + s.w / 2} y={H / 2 + 4} textAnchor="middle" fontSize={9} fontWeight="bold" fill="white" opacity={0.9}>
            {s.label}
          </text>
        ))}
        <polygon points={`${indicatorX},${H + 1} ${indicatorX - 6},${H + 14} ${indicatorX + 6},${H + 14}`} fill={currentSeg.color} />
      </svg>
    </div>
  );
};

// ─── Charts section ───────────────────────────────────────────────────────────

const MeasurementCharts: React.FC<{
  imc?: number | null;
  bodyFatPct?: number | null;
  age?: number | null;
  gender?: string | null;
  chartPrefix: string;
}> = ({ imc, bodyFatPct, age, gender, chartPrefix }) => {
  const hasImc = imc != null && imc !== 0;
  const hasBodyFat = bodyFatPct != null && bodyFatPct !== 0 && age != null && age !== 0 && !!gender;
  if (!hasImc && !hasBodyFat) return null;

  const sex = gender ?? '';
  const ageVal = age ?? 0;
  const fatMax = sex === 'Masculino' ? 40 : 55;

  return (
    <div
      className="mt-4 px-3 pt-3 pb-4 rounded-2xl"
      style={{ backgroundColor: '#F9FAFB', border: '1px solid #F0F4F1' }}
    >
      {hasBodyFat && (
        <MiniRangeBar
          title="% Grasa Corporal"
          value={bodyFatPct!}
          unit="%"
          minVal={0}
          maxVal={fatMax}
          zones={getBodyFatZones(sex, ageVal)}
          chartId={`${chartPrefix}-fat`}
        />
      )}
      {hasImc && (
        <MiniRangeBar
          title="IMC"
          value={imc!}
          unit=""
          minVal={10}
          maxVal={45}
          zones={[
            { label: 'Bajo peso', end: 18.5, color: C_LOW },
            { label: 'Normal',    end: 25,   color: C_HEALTHY },
            { label: 'Sobrepeso', end: 30,   color: C_HIGH },
            { label: 'Obesidad',  end: 45,   color: C_OBESE },
          ]}
          chartId={`${chartPrefix}-imc`}
        />
      )}
    </div>
  );
};

// ─── Mini stat — sin icono, valor en color vibrante ───────────────────────────

const MiniStat: React.FC<{
  valueColor: string;
  label: string;
  value: string;
}> = ({ valueColor, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1 mb-0.5">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: valueColor, opacity: 0.7 }} />
      <span className="font-bold uppercase" style={{ color: '#9CA3AF', fontSize: '9px', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
    <span className="font-extrabold" style={{ color: valueColor, fontSize: '14px', lineHeight: 1.1 }}>
      {value}
    </span>
  </div>
);

// ─── Expanded row ─────────────────────────────────────────────────────────────

const ExpandedRow: React.FC<{
  label: string;
  value?: number | string | null;
  unit?: string;
  small?: boolean;
}> = ({ label, value, unit, small }) => {
  if (value == null || value === 0 || value === '') return null;
  const displayVal =
    typeof value === 'number'
      ? value % 1 === 0 ? String(value) : value.toFixed(1)
      : String(value);
  return (
    <div className="flex justify-between items-baseline py-1.5" style={{ borderBottom: '1px solid #F4F6F5' }}>
      <span style={{ color: '#8B9E95', fontSize: '12px' }}>{label}</span>
      <span style={{ color: '#1A2E25', fontSize: small ? '11px' : '13px', fontWeight: small ? 500 : 600, maxWidth: '60%', textAlign: 'right', lineHeight: 1.3 }}>
        {displayVal}
        {unit && <span style={{ color: '#B0BFBA', fontSize: '11px', marginLeft: '2px' }}>{unit}</span>}
      </span>
    </div>
  );
};

// ─── Expanded section ─────────────────────────────────────────────────────────

const ExpandedSection: React.FC<{
  title: string;
  accentColor: string;
  show: boolean;
  children: React.ReactNode;
}> = ({ title, accentColor, show, children }) => {
  if (!show) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
        <p className="font-bold uppercase" style={{ color: '#4B5E57', fontSize: '10px', letterSpacing: '0.08em' }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
};

// ─── Expanded: Antropometría ──────────────────────────────────────────────────

const AntroExpanded: React.FC<{ m: MeasurementEntry }> = ({ m }) => (
  <div className="mt-4">
    <MeasurementCharts
      imc={m.imc}
      bodyFatPct={m.bodyFatPct}
      age={m.age}
      gender={m.gender}
      chartPrefix={`antro-${m.date ?? 'x'}`}
    />

    <ExpandedSection
      title="Composición corporal"
      accentColor="#2D5A4B"
      show={[m.weight, m.height, m.imc, m.bodyFatPct, m.fatKg, m.leanMassKg, m.leanMassPct, m.muscleKg, m.boneMass, m.residualMass].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Peso"          value={m.weight}          unit="kg"  />
      <ExpandedRow label="Talla"         value={m.height}          unit="cm"  />
      <ExpandedRow label="IMC"           value={m.imc}             unit="kg/m²" />
      <ExpandedRow label="% Grasa"       value={m.bodyFatPct}      unit="%"   />
      <ExpandedRow label="Masa grasa"    value={m.fatKg}           unit="kg"  />
      <ExpandedRow label="Masa magra"    value={m.leanMassKg}      unit="kg"  />
      <ExpandedRow label="% Masa magra"  value={m.leanMassPct}     unit="%"   />
      <ExpandedRow label="Masa muscular" value={m.muscleKg}        unit="kg"  />
      <ExpandedRow label="Masa ósea"     value={m.boneMass}        unit="kg"  />
      <ExpandedRow label="Masa residual" value={m.residualMass}    unit="kg"  />
    </ExpandedSection>

    <ExpandedSection
      title="Pliegues cutáneos"
      accentColor="#F59E0B"
      show={[m.biceps, m.triceps, m.subscapular, m.supraspinal, m.abdomen, m.thigh, m.calf, m.iliacCrest, m.skinfoldSum].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Bíceps"        value={m.biceps}       unit="mm" />
      <ExpandedRow label="Tríceps"       value={m.triceps}      unit="mm" />
      <ExpandedRow label="Subescapular"  value={m.subscapular}  unit="mm" />
      <ExpandedRow label="Suprailíaco"   value={m.supraspinal}  unit="mm" />
      <ExpandedRow label="Abdominal"     value={m.abdomen}      unit="mm" />
      <ExpandedRow label="Muslo"         value={m.thigh}        unit="mm" />
      <ExpandedRow label="Pierna"        value={m.calf}         unit="mm" />
      <ExpandedRow label="Cresta ilíaca" value={m.iliacCrest}   unit="mm" />
      <ExpandedRow label="Suma pliegues" value={m.skinfoldSum}  unit="mm" />
    </ExpandedSection>

    <ExpandedSection
      title="Perímetros"
      accentColor="#6366F1"
      show={[m.armRelaxed, m.armContracted, m.waist, m.umbilical, m.hip, m.abdominalLow, m.thighRight, m.thighLeft, m.calfGirth].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Brazo relajado"   value={m.armRelaxed}    unit="cm" />
      <ExpandedRow label="Brazo contraído"  value={m.armContracted} unit="cm" />
      <ExpandedRow label="Cintura"          value={m.waist}         unit="cm" />
      <ExpandedRow label="Umbilical"        value={m.umbilical}     unit="cm" />
      <ExpandedRow label="Cadera"           value={m.hip}           unit="cm" />
      <ExpandedRow label="Abdominal bajo"   value={m.abdominalLow}  unit="cm" />
      <ExpandedRow label="Muslo derecho"    value={m.thighRight}    unit="cm" />
      <ExpandedRow label="Muslo izquierdo"  value={m.thighLeft}     unit="cm" />
      <ExpandedRow label="Pantorrilla"      value={m.calfGirth}     unit="cm" />
    </ExpandedSection>

    <ExpandedSection
      title="Diámetros"
      accentColor="#0EA5E9"
      show={[m.humerus, m.femur, m.wrist].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Húmero" value={m.humerus} unit="cm" />
      <ExpandedRow label="Fémur"  value={m.femur}   unit="cm" />
      <ExpandedRow label="Muñeca" value={m.wrist}   unit="cm" />
    </ExpandedSection>

    <ExpandedSection
      title="Somatotipo"
      accentColor="#A855F7"
      show={[m.endomorfo, m.mesomorfo, m.ectomorfo].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Endomorfo" value={m.endomorfo} />
      <ExpandedRow label="Mesomorfo" value={m.mesomorfo} />
      <ExpandedRow label="Ectomorfo" value={m.ectomorfo} />
    </ExpandedSection>

    <ExpandedSection
      title="Evaluación"
      accentColor="#64748B"
      show={!!(m.diagnosticN && m.diagnosticN !== 0) || !!(m.subjectiveValuation && m.subjectiveValuation !== 0)}
    >
      <ExpandedRow label="Diagnóstico"        value={m.diagnosticN}        small />
      <ExpandedRow label="Valoración subjetiva" value={m.subjectiveValuation} small />
    </ExpandedSection>
  </div>
);

// ─── Expanded: Bioimpedancia ──────────────────────────────────────────────────

const BioExpanded: React.FC<{ b: BioEntry }> = ({ b }) => (
  <div className="mt-4">
    <MeasurementCharts
      imc={b.imc}
      bodyFatPct={b.bodyFatPct}
      age={b.age}
      gender={b.gender}
      chartPrefix={`bio-${b.date ?? 'x'}`}
    />

    <ExpandedSection
      title="Composición corporal"
      accentColor="#6366F1"
      show={[b.weight, b.height, b.imc, b.bodyFatPct, b.muscleMass, b.boneMass, b.waterPct, b.visceralFat, b.bmr, b.metabolicAge, b.physiqueRating].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Peso"           value={b.weight}        unit="kg"   />
      <ExpandedRow label="Talla"          value={b.height}        unit="cm"   />
      <ExpandedRow label="IMC"            value={b.imc}           unit="kg/m²" />
      <ExpandedRow label="% Grasa"        value={b.bodyFatPct}    unit="%"    />
      <ExpandedRow label="Masa muscular"  value={b.muscleMass}    unit="kg"   />
      <ExpandedRow label="Masa ósea"      value={b.boneMass}      unit="kg"   />
      <ExpandedRow label="% Agua"         value={b.waterPct}      unit="%"    />
      <ExpandedRow label="Grasa visceral" value={b.visceralFat}               />
      <ExpandedRow label="TMB"            value={b.bmr}           unit="kcal" />
      <ExpandedRow label="Edad metabólica" value={b.metabolicAge} unit="años" />
      <ExpandedRow label="Rating físico"  value={b.physiqueRating}            />
    </ExpandedSection>

    <ExpandedSection
      title="Perímetros"
      accentColor="#0EA5E9"
      show={[b.waist, b.umbilical, b.hip, b.thighLeft, b.thighRight, b.abdominalLow, b.calfGirth, b.armRelaxed, b.armContracted].some(v => v != null && v !== 0 && v !== '')}
    >
      <ExpandedRow label="Cintura"         value={b.waist}         unit="cm" />
      <ExpandedRow label="Umbilical"       value={b.umbilical}     unit="cm" />
      <ExpandedRow label="Cadera"          value={b.hip}           unit="cm" />
      <ExpandedRow label="Muslo izquierdo" value={b.thighLeft}     unit="cm" />
      <ExpandedRow label="Muslo derecho"   value={b.thighRight}    unit="cm" />
      <ExpandedRow label="Abdominal bajo"  value={b.abdominalLow}  unit="cm" />
      <ExpandedRow label="Pantorrilla"     value={b.calfGirth}     unit="cm" />
      <ExpandedRow label="Brazo relajado"  value={b.armRelaxed}    unit="cm" />
      <ExpandedRow label="Brazo contraído" value={b.armContracted} unit="cm" />
    </ExpandedSection>
  </div>
);

// ─── Card types ───────────────────────────────────────────────────────────────

type AntroCard = { kind: 'antro'; entry: MeasurementEntry };
type BioCard   = { kind: 'bio';   entry: BioEntry };
type CardData  = AntroCard | BioCard;

// ─── Card ─────────────────────────────────────────────────────────────────────

const ANTRO_STYLE = { bg: '#ECFDF5', color: '#065F46', label: 'ANTROPOMETRÍA' };
const BIO_STYLE   = { bg: '#EEF2FF', color: '#3730A3', label: 'BIOIMPEDANCIA'  };

const MeasurementCard: React.FC<{
  card: CardData;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ card, isOpen, onToggle }) => {
  const isAntro = card.kind === 'antro';
  const style = isAntro ? ANTRO_STYLE : BIO_STYLE;

  const weight     = isAntro ? (card.entry as MeasurementEntry).weight     : (card.entry as BioEntry).weight;
  const imc        = isAntro ? (card.entry as MeasurementEntry).imc        : (card.entry as BioEntry).imc;
  const fatPct     = isAntro ? (card.entry as MeasurementEntry).bodyFatPct : (card.entry as BioEntry).bodyFatPct;
  const muscleMass = isAntro ? (card.entry as MeasurementEntry).muscleKg   : (card.entry as BioEntry).muscleMass;
  const metaRaw    = isAntro ? (card.entry as MeasurementEntry).metaComplied : (card.entry as BioEntry).metaComplied;
  const hasGoal    = metaRaw === true || metaRaw === 'true';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 14px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
        style={{ background: 'none', border: 'none', outline: 'none' }}
      >
        {/* Date + meta + chevron */}
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-bold leading-tight" style={{ color: '#1A2E25', fontSize: '13px' }}>
              {formatDateLong(card.entry.date)}
            </p>
            {hasGoal && (
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#ECFDF5' }}
              >
                <Star className="w-3 h-3" style={{ color: '#059669', fill: '#059669' }} />
                <span className="font-bold uppercase" style={{ color: '#065F46', fontSize: '9px', letterSpacing: '0.06em' }}>
                  Meta cumplida
                </span>
              </div>
            )}
          </div>
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F4F6F5' }}
          >
            {isOpen
              ? <ChevronUp   className="w-3.5 h-3.5" style={{ color: '#6B7C73' }} />
              : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6B7C73' }} />
            }
          </div>
        </div>

        {/* Badge */}
        <span
          className="inline-block font-bold uppercase px-2.5 py-0.5 rounded-md mb-3.5"
          style={{ color: style.color, backgroundColor: style.bg, fontSize: '8px', letterSpacing: '0.08em' }}
        >
          {style.label}
        </span>

        {/* 4 stats */}
        <div className="grid grid-cols-4 gap-2">
          <MiniStat valueColor="#1A2E25" label="Peso"       value={weight     != null ? `${weight} kg`     : '—'} />
          <MiniStat valueColor="#0369A1" label="IMC"        value={imc        != null ? imc.toFixed(1)     : '—'} />
          <MiniStat valueColor="#B45309" label="% Grasa"    value={fatPct     != null ? `${fatPct}%`       : '—'} />
          <MiniStat valueColor="#6D28D9" label="Masa musc." value={muscleMass != null ? `${muscleMass} kg` : '—'} />
        </div>

      </button>

      {isOpen && (
        <div className="px-4 pb-5" style={{ borderTop: '1px solid #F4F6F5' }}>
          {isAntro
            ? <AntroExpanded m={card.entry as MeasurementEntry} />
            : <BioExpanded   b={card.entry as BioEntry} />
          }
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const MeasurementsView: React.FC<Props> = ({ measurements, bioMeasurements }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const cards: CardData[] = [
    ...measurements.map((m): AntroCard => ({ kind: 'antro', entry: m })),
    ...bioMeasurements.map((b): BioCard => ({ kind: 'bio', entry: b })),
  ].sort((a, b) => (b.entry.date ?? '').localeCompare(a.entry.date ?? ''));

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: '#E8F0EC' }}
        >
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#2D5A4B', opacity: 0.4 }} />
        </div>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Sin datos de medidas registrados aún.
        </p>
      </div>
    );
  }

  const toggle = (key: string) => setOpenKey(prev => (prev === key ? null : key));

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="flex flex-col gap-3">
        {cards.map((card, i) => {
          const key = `${card.kind}-${card.entry.date ?? ''}-${i}`;
          return (
            <MeasurementCard
              key={key}
              card={card}
              isOpen={openKey === key}
              onToggle={() => toggle(key)}
            />
          );
        })}
      </div>
    </div>
  );
};
