import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AntroFieldsConfig, BioFieldsConfig } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  antro: AntroFieldsConfig;
  bio: BioFieldsConfig;
  onChange: (antro: AntroFieldsConfig, bio: BioFieldsConfig) => void;
  defaultOpen?: boolean;
}

interface FieldDef {
  key: string;
  label: string;
}

interface SectionDef {
  title: string;
  accentColor: string;
  fields: FieldDef[];
}

// ─── Field definitions ────────────────────────────────────────────────────────

const ANTRO_SECTIONS: SectionDef[] = [
  {
    title: 'Gráficas',
    accentColor: '#F97316',
    fields: [
      { key: 'showImcChart',     label: 'Gráfica IMC' },
      { key: 'showBodyFatChart', label: 'Gráfica % Grasa corporal' },
    ],
  },
  {
    title: 'Composición corporal',
    accentColor: '#2D5A4B',
    fields: [
      { key: 'weight',       label: 'Peso' },
      { key: 'height',       label: 'Talla' },
      { key: 'imc',          label: 'IMC' },
      { key: 'bodyFatPct',   label: '% Grasa corporal' },
      { key: 'fatKg',        label: 'Masa grasa (kg)' },
      { key: 'leanMassKg',   label: 'Masa magra (kg)' },
      { key: 'leanMassPct',  label: '% Masa magra' },
      { key: 'muscleKg',     label: 'Masa muscular (kg)' },
      { key: 'boneMass',     label: 'Masa ósea (kg)' },
      { key: 'residualMass', label: 'Masa residual (kg)' },
    ],
  },
  {
    title: 'Pliegues cutáneos',
    accentColor: '#F59E0B',
    fields: [
      { key: 'biceps',      label: 'Bíceps' },
      { key: 'triceps',     label: 'Tríceps' },
      { key: 'subscapular', label: 'Subescapular' },
      { key: 'supraspinal', label: 'Suprailíaco' },
      { key: 'abdomen',     label: 'Abdominal' },
      { key: 'thigh',       label: 'Muslo' },
      { key: 'calf',        label: 'Pierna' },
      { key: 'iliacCrest',  label: 'Cresta ilíaca' },
      { key: 'skinfoldSum', label: 'Suma de pliegues' },
    ],
  },
  {
    title: 'Perímetros',
    accentColor: '#6366F1',
    fields: [
      { key: 'armRelaxed',    label: 'Brazo relajado' },
      { key: 'armContracted', label: 'Brazo contraído' },
      { key: 'waist',         label: 'Cintura' },
      { key: 'umbilical',     label: 'Umbilical' },
      { key: 'hip',           label: 'Cadera' },
      { key: 'abdominalLow',  label: 'Abdominal bajo' },
      { key: 'thighRight',    label: 'Muslo derecho' },
      { key: 'thighLeft',     label: 'Muslo izquierdo' },
      { key: 'calfGirth',     label: 'Pantorrilla' },
    ],
  },
  {
    title: 'Diámetros',
    accentColor: '#0EA5E9',
    fields: [
      { key: 'humerus', label: 'Húmero' },
      { key: 'femur',   label: 'Fémur' },
      { key: 'wrist',   label: 'Muñeca' },
    ],
  },
  {
    title: 'Somatotipo',
    accentColor: '#A855F7',
    fields: [
      { key: 'endomorfo', label: 'Endomorfo' },
      { key: 'mesomorfo', label: 'Mesomorfo' },
      { key: 'ectomorfo', label: 'Ectomorfo' },
    ],
  },
  {
    title: 'Notas',
    accentColor: '#64748B',
    fields: [
      { key: 'notes', label: 'Notas clínicas' },
    ],
  },
];

const BIO_SECTIONS: SectionDef[] = [
  {
    title: 'Gráficas',
    accentColor: '#F97316',
    fields: [
      { key: 'showImcChart',     label: 'Gráfica IMC' },
      { key: 'showBodyFatChart', label: 'Gráfica % Grasa corporal' },
    ],
  },
  {
    title: 'Composición corporal',
    accentColor: '#6366F1',
    fields: [
      { key: 'weight',         label: 'Peso' },
      { key: 'height',         label: 'Talla' },
      { key: 'imc',            label: 'IMC' },
      { key: 'bodyFatPct',     label: '% Grasa corporal' },
      { key: 'muscleMass',     label: 'Masa muscular (kg)' },
      { key: 'boneMass',       label: 'Masa ósea (kg)' },
      { key: 'waterPct',       label: '% Agua' },
      { key: 'visceralFat',    label: 'Grasa visceral' },
      { key: 'bmr',            label: 'TMB (kcal)' },
      { key: 'metabolicAge',   label: 'Edad metabólica' },
      { key: 'physiqueRating', label: 'Rating físico' },
    ],
  },
  {
    title: 'Perímetros',
    accentColor: '#0EA5E9',
    fields: [
      { key: 'waist',         label: 'Cintura' },
      { key: 'umbilical',     label: 'Umbilical' },
      { key: 'hip',           label: 'Cadera' },
      { key: 'thighLeft',     label: 'Muslo izquierdo' },
      { key: 'thighRight',    label: 'Muslo derecho' },
      { key: 'abdominalLow',  label: 'Abdominal bajo' },
      { key: 'calfGirth',     label: 'Pantorrilla' },
      { key: 'armRelaxed',    label: 'Brazo relajado' },
      { key: 'armContracted', label: 'Brazo contraído' },
    ],
  },
  {
    title: 'Notas',
    accentColor: '#64748B',
    fields: [
      { key: 'notes', label: 'Notas clínicas' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fieldOn(config: AntroFieldsConfig | BioFieldsConfig, key: string): boolean {
  const val = (config as Record<string, boolean | undefined>)[key];
  return val === undefined ? true : val;
}

function sectionAllOn(config: AntroFieldsConfig | BioFieldsConfig, fields: FieldDef[]): boolean {
  return fields.every(f => fieldOn(config, f.key));
}

// ─── Mini toggle ──────────────────────────────────────────────────────────────

const Toggle: React.FC<{
  on: boolean;
  onToggle: () => void;
  small?: boolean;
}> = ({ on, onToggle, small }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
      small ? 'w-8 h-4' : 'w-9 h-5'
    } ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}
  >
    <span
      className={`absolute top-0.5 bg-white rounded-full shadow transition-transform duration-200 ${
        small ? 'w-3 h-3 left-0.5' : 'w-4 h-4 left-0.5'
      } ${on ? (small ? 'translate-x-4' : 'translate-x-4') : 'translate-x-0'}`}
    />
  </button>
);

// ─── Section block ────────────────────────────────────────────────────────────

const SectionBlock: React.FC<{
  section: SectionDef;
  config: AntroFieldsConfig | BioFieldsConfig;
  onFieldToggle: (key: string) => void;
  onSectionToggle: (fields: FieldDef[], allOn: boolean) => void;
}> = ({ section, config, onFieldToggle, onSectionToggle }) => {
  const [open, setOpen] = useState(true);
  const allOn = sectionAllOn(config, section.fields);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-white cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: section.accentColor }} />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide truncate">
            {section.title}
          </span>
          <span className="text-xs text-slate-400">
            ({section.fields.filter(f => fieldOn(config, f.key)).length}/{section.fields.length})
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSectionToggle(section.fields, allOn)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-slate-100"
          >
            {allOn ? 'Quitar todos' : 'Todos'}
          </button>
          <div onClick={() => setOpen(v => !v)}>
            {open
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            }
          </div>
        </div>
      </div>

      {open && (
        <div className="px-3 py-2 space-y-0.5">
          {section.fields.map(field => (
            <div key={field.key} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #F8FAFC' }}>
              <span className="text-xs text-slate-600">{field.label}</span>
              <Toggle on={fieldOn(config, field.key)} onToggle={() => onFieldToggle(field.key)} small />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const MeasurementsToggle: React.FC<Props> = ({ antro, bio, onChange, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  function handleAntroFieldToggle(key: string) {
    const current = fieldOn(antro, key);
    onChange({ ...antro, [key]: !current }, bio);
  }

  function handleBioFieldToggle(key: string) {
    const current = fieldOn(bio, key);
    onChange(antro, { ...bio, [key]: !current });
  }

  function handleAntroSectionToggle(fields: FieldDef[], allOn: boolean) {
    const patch: AntroFieldsConfig = { ...antro };
    for (const f of fields) (patch as any)[f.key] = !allOn;
    onChange(patch, bio);
  }

  function handleBioSectionToggle(fields: FieldDef[], allOn: boolean) {
    const patch: BioFieldsConfig = { ...bio };
    for (const f of fields) (patch as any)[f.key] = !allOn;
    onChange(antro, patch);
  }

  const antroOnCount = ANTRO_SECTIONS.flatMap(s => s.fields).filter(f => fieldOn(antro, f.key)).length;
  const antroTotal   = ANTRO_SECTIONS.flatMap(s => s.fields).length;
  const bioOnCount   = BIO_SECTIONS.flatMap(s => s.fields).filter(f => fieldOn(bio, f.key)).length;
  const bioTotal     = BIO_SECTIONS.flatMap(s => s.fields).length;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors select-none"
      >
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Configurar campos visibles
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Antro {antroOnCount}/{antroTotal} · Bio {bioOnCount}/{bioTotal}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {/* Expandable content — 2-column grid */}
      {open && (
        <div className="p-3 grid grid-cols-2 gap-3">
          {/* Antropometría column */}
          <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-wide px-3 py-2 border-b border-slate-100 flex-shrink-0" style={{ backgroundColor: '#EBF5F0', color: '#2D5A4B' }}>
              Antropometría
            </p>
            <div className="overflow-y-auto p-2 space-y-2" style={{ maxHeight: '15rem' }}>
              {ANTRO_SECTIONS.map(section => (
                <SectionBlock
                  key={section.title}
                  section={section}
                  config={antro}
                  onFieldToggle={handleAntroFieldToggle}
                  onSectionToggle={handleAntroSectionToggle}
                />
              ))}
            </div>
          </div>

          {/* Bioimpedancia column */}
          <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-wide px-3 py-2 border-b border-slate-100 flex-shrink-0" style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}>
              Bioimpedancia
            </p>
            <div className="overflow-y-auto p-2 space-y-2" style={{ maxHeight: '15rem' }}>
              {BIO_SECTIONS.map(section => (
                <SectionBlock
                  key={section.title}
                  section={section}
                  config={bio}
                  onFieldToggle={handleBioFieldToggle}
                  onSectionToggle={handleBioSectionToggle}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
