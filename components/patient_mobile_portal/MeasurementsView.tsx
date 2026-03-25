import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Scale, Activity, Droplets, Dumbbell, Star,
} from 'lucide-react';
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

// ─── Mini stat (2×2 preview grid) ────────────────────────────────────────────

const MiniStat: React.FC<{
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
}> = ({ Icon, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1 mb-0.5">
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#E8F0EC' }}
      >
        <Icon className="w-3 h-3" style={{ color: '#2D5A4B' }} />
      </div>
      <span
        className="font-bold uppercase"
        style={{ color: '#6B7C73', fontSize: '9px', letterSpacing: '0.06em' }}
      >
        {label}
      </span>
    </div>
    <span
      className="font-extrabold"
      style={{ color: '#1A2E25', fontSize: '14px', lineHeight: 1.1 }}
    >
      {value}
    </span>
  </div>
);

// ─── Expanded row ─────────────────────────────────────────────────────────────

const ExpandedRow: React.FC<{
  label: string;
  value?: number | string | null;
  unit?: string;
}> = ({ label, value, unit }) => {
  if (value == null) return null;
  const displayVal =
    typeof value === 'number'
      ? value % 1 === 0
        ? String(value)
        : value.toFixed(1)
      : String(value);
  return (
    <div
      className="flex justify-between items-baseline py-1.5"
      style={{ borderBottom: '1px solid #F0F4F1' }}
    >
      <span style={{ color: '#6B7C73', fontSize: '12px' }}>{label}</span>
      <span style={{ color: '#1A2E25', fontSize: '13px', fontWeight: 600 }}>
        {displayVal}
        {unit && (
          <span style={{ color: '#9CA3AF', fontSize: '11px', marginLeft: '2px' }}>
            {unit}
          </span>
        )}
      </span>
    </div>
  );
};

const ExpandedSection: React.FC<{ title: string; show: boolean; children: React.ReactNode }> = ({
  title, show, children,
}) => {
  if (!show) return null;
  return (
    <div className="mt-3">
      <p
        className="font-bold uppercase mb-1"
        style={{ color: '#6B7C73', fontSize: '9px', letterSpacing: '0.08em' }}
      >
        {title}
      </p>
      {children}
    </div>
  );
};

// ─── Expanded: Antropometría ──────────────────────────────────────────────────

const AntroExpanded: React.FC<{ m: MeasurementEntry }> = ({ m }) => (
  <div className="mt-4">
    <ExpandedSection
      title="Composición corporal"
      show={[m.weight, m.height, m.imc, m.bodyFatPct, m.fatKg, m.leanMassKg, m.leanMassPct, m.muscleKg, m.boneMass, m.residualMass].some(v => v != null)}
    >
      <ExpandedRow label="Peso" value={m.weight} unit="kg" />
      <ExpandedRow label="Talla" value={m.height} unit="cm" />
      <ExpandedRow label="IMC" value={m.imc} unit="kg/m²" />
      <ExpandedRow label="% Grasa" value={m.bodyFatPct} unit="%" />
      <ExpandedRow label="Masa grasa" value={m.fatKg} unit="kg" />
      <ExpandedRow label="Masa magra" value={m.leanMassKg} unit="kg" />
      <ExpandedRow label="% Masa magra" value={m.leanMassPct} unit="%" />
      <ExpandedRow label="Masa muscular" value={m.muscleKg} unit="kg" />
      <ExpandedRow label="Masa ósea" value={m.boneMass} unit="kg" />
      <ExpandedRow label="Masa residual" value={m.residualMass} unit="kg" />
    </ExpandedSection>

    <ExpandedSection
      title="Pliegues cutáneos"
      show={[m.biceps, m.triceps, m.subscapular, m.supraspinal, m.abdomen, m.thigh, m.calf, m.iliacCrest, m.skinfoldSum].some(v => v != null)}
    >
      <ExpandedRow label="Bíceps" value={m.biceps} unit="mm" />
      <ExpandedRow label="Tríceps" value={m.triceps} unit="mm" />
      <ExpandedRow label="Subescapular" value={m.subscapular} unit="mm" />
      <ExpandedRow label="Suprailíaco" value={m.supraspinal} unit="mm" />
      <ExpandedRow label="Abdominal" value={m.abdomen} unit="mm" />
      <ExpandedRow label="Muslo" value={m.thigh} unit="mm" />
      <ExpandedRow label="Pierna" value={m.calf} unit="mm" />
      <ExpandedRow label="Cresta ilíaca" value={m.iliacCrest} unit="mm" />
      <ExpandedRow label="Suma pliegues" value={m.skinfoldSum} unit="mm" />
    </ExpandedSection>

    <ExpandedSection
      title="Perímetros"
      show={[m.armRelaxed, m.armContracted, m.waist, m.umbilical, m.hip, m.abdominalLow, m.thighRight, m.thighLeft, m.calfGirth].some(v => v != null)}
    >
      <ExpandedRow label="Brazo relajado" value={m.armRelaxed} unit="cm" />
      <ExpandedRow label="Brazo contraído" value={m.armContracted} unit="cm" />
      <ExpandedRow label="Cintura" value={m.waist} unit="cm" />
      <ExpandedRow label="Umbilical" value={m.umbilical} unit="cm" />
      <ExpandedRow label="Cadera" value={m.hip} unit="cm" />
      <ExpandedRow label="Abdominal bajo" value={m.abdominalLow} unit="cm" />
      <ExpandedRow label="Muslo derecho" value={m.thighRight} unit="cm" />
      <ExpandedRow label="Muslo izquierdo" value={m.thighLeft} unit="cm" />
      <ExpandedRow label="Pantorrilla" value={m.calfGirth} unit="cm" />
    </ExpandedSection>

    <ExpandedSection
      title="Diámetros"
      show={[m.humerus, m.femur, m.wrist].some(v => v != null)}
    >
      <ExpandedRow label="Húmero" value={m.humerus} unit="cm" />
      <ExpandedRow label="Fémur" value={m.femur} unit="cm" />
      <ExpandedRow label="Muñeca" value={m.wrist} unit="cm" />
    </ExpandedSection>

    <ExpandedSection
      title="Somatotipo"
      show={[m.endomorfo, m.mesomorfo, m.ectomorfo].some(v => v != null)}
    >
      <ExpandedRow label="Endomorfo" value={m.endomorfo} />
      <ExpandedRow label="Mesomorfo" value={m.mesomorfo} />
      <ExpandedRow label="Ectomorfo" value={m.ectomorfo} />
    </ExpandedSection>

    <ExpandedSection
      title="Evaluación"
      show={m.diagnosticN != null || m.subjectiveValuation != null}
    >
      <ExpandedRow label="Diagnóstico" value={m.diagnosticN} />
      <ExpandedRow label="Valoración subjetiva" value={m.subjectiveValuation} />
    </ExpandedSection>
  </div>
);

// ─── Expanded: Bioimpedancia ──────────────────────────────────────────────────

const BioExpanded: React.FC<{ b: BioEntry }> = ({ b }) => (
  <div className="mt-4">
    <ExpandedSection
      title="Composición corporal"
      show={[b.weight, b.height, b.imc, b.bodyFatPct, b.muscleMass, b.boneMass, b.waterPct, b.visceralFat, b.bmr, b.metabolicAge, b.physiqueRating].some(v => v != null)}
    >
      <ExpandedRow label="Peso" value={b.weight} unit="kg" />
      <ExpandedRow label="Talla" value={b.height} unit="cm" />
      <ExpandedRow label="IMC" value={b.imc} unit="kg/m²" />
      <ExpandedRow label="% Grasa" value={b.bodyFatPct} unit="%" />
      <ExpandedRow label="Masa muscular" value={b.muscleMass} unit="kg" />
      <ExpandedRow label="Masa ósea" value={b.boneMass} unit="kg" />
      <ExpandedRow label="% Agua" value={b.waterPct} unit="%" />
      <ExpandedRow label="Grasa visceral" value={b.visceralFat} />
      <ExpandedRow label="TMB" value={b.bmr} unit="kcal" />
      <ExpandedRow label="Edad metabólica" value={b.metabolicAge} unit="años" />
      <ExpandedRow label="Rating físico" value={b.physiqueRating} />
    </ExpandedSection>

    <ExpandedSection
      title="Perímetros"
      show={[b.waist, b.umbilical, b.hip, b.thighLeft, b.thighRight, b.abdominalLow, b.calfGirth, b.armRelaxed, b.armContracted].some(v => v != null)}
    >
      <ExpandedRow label="Cintura" value={b.waist} unit="cm" />
      <ExpandedRow label="Umbilical" value={b.umbilical} unit="cm" />
      <ExpandedRow label="Cadera" value={b.hip} unit="cm" />
      <ExpandedRow label="Muslo izquierdo" value={b.thighLeft} unit="cm" />
      <ExpandedRow label="Muslo derecho" value={b.thighRight} unit="cm" />
      <ExpandedRow label="Abdominal bajo" value={b.abdominalLow} unit="cm" />
      <ExpandedRow label="Pantorrilla" value={b.calfGirth} unit="cm" />
      <ExpandedRow label="Brazo relajado" value={b.armRelaxed} unit="cm" />
      <ExpandedRow label="Brazo contraído" value={b.armContracted} unit="cm" />
    </ExpandedSection>
  </div>
);

// ─── Card types ───────────────────────────────────────────────────────────────

type AntroCard = { kind: 'antro'; entry: MeasurementEntry };
type BioCard   = { kind: 'bio';   entry: BioEntry };
type CardData  = AntroCard | BioCard;

// ─── Card ─────────────────────────────────────────────────────────────────────

const MeasurementCard: React.FC<{
  card: CardData;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ card, isOpen, onToggle }) => {
  const isAntro = card.kind === 'antro';

  const weight      = isAntro ? (card.entry as MeasurementEntry).weight      : (card.entry as BioEntry).weight;
  const imc         = isAntro ? (card.entry as MeasurementEntry).imc         : (card.entry as BioEntry).imc;
  const fatPct      = isAntro ? (card.entry as MeasurementEntry).bodyFatPct  : (card.entry as BioEntry).bodyFatPct;
  const muscleMass  = isAntro ? (card.entry as MeasurementEntry).muscleKg    : (card.entry as BioEntry).muscleMass;
  const metaRaw     = isAntro ? (card.entry as MeasurementEntry).metaComplied : (card.entry as BioEntry).metaComplied;
  const hasGoal     = metaRaw === true || metaRaw === 'true';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E8E3' }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-3"
        style={{ background: 'none', border: 'none', outline: 'none' }}
      >
        {/* Date + chevron row */}
        <div className="flex items-start justify-between mb-2.5">
          <p className="font-bold leading-tight pr-1" style={{ color: '#1A2E25', fontSize: '12px' }}>
            {formatDateLong(card.entry.date)}
          </p>
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: '#F0F4F1' }}
          >
            {isOpen
              ? <ChevronUp className="w-3 h-3" style={{ color: '#6B7C73' }} />
              : <ChevronDown className="w-3 h-3" style={{ color: '#6B7C73' }} />
            }
          </div>
        </div>

        {/* Badge */}
        <span
          className="inline-block font-bold uppercase px-2 py-0.5 rounded-md mb-3"
          style={{
            color: '#2D5A4B',
            backgroundColor: '#E8F0EC',
            fontSize: '8px',
            letterSpacing: '0.08em',
          }}
        >
          {isAntro ? 'ANTROPOMETRÍA' : 'BIOIMPEDANCIA'}
        </span>

        {/* 4 stats en fila */}
        <div className="grid grid-cols-4 gap-1">
          <MiniStat Icon={Scale}    label="Peso"       value={weight     != null ? `${weight} kg`    : '—'} />
          <MiniStat Icon={Activity} label="IMC"        value={imc        != null ? imc.toFixed(1)    : '—'} />
          <MiniStat Icon={Droplets} label="% Grasa"    value={fatPct     != null ? `${fatPct}%`      : '—'} />
          <MiniStat Icon={Dumbbell} label="Masa musc." value={muscleMass != null ? `${muscleMass} kg` : '—'} />
        </div>

        {/* Meta cumplida */}
        {hasGoal && (
          <div className="mt-2.5 flex items-center gap-1">
            <Star className="w-3 h-3" style={{ color: '#2D5A4B', fill: '#2D5A4B' }} />
            <span
              className="font-bold uppercase"
              style={{ color: '#2D5A4B', fontSize: '9px', letterSpacing: '0.06em' }}
            >
              Meta cumplida
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-4" style={{ borderTop: '1px solid #F0F4F1' }}>
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
      <div className="text-center py-10 px-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: '#E8F0EC' }}
        >
          <Activity className="w-6 h-6" style={{ color: '#2D5A4B' }} />
        </div>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Sin datos de medidas registrados aún.
        </p>
      </div>
    );
  }

  const toggle = (key: string) => setOpenKey(prev => (prev === key ? null : key));

  return (
    <div className="px-4 pb-6">
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
