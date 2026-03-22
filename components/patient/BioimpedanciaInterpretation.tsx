import React, { useState } from 'react';
import { Info } from 'lucide-react';

// ─── Helper ───────────────────────────────────────────────────────────────────
const s = (v: any): string => (v == null ? '' : String(v));

// ─── Colors ───────────────────────────────────────────────────────────────────
const C_LOW     = '#f97316'; // orange  - Bajo
const C_HEALTHY = '#14b8a6'; // teal    - Saludable
const C_HIGH    = '#f59e0b'; // amber   - Alto
const C_OBESE   = '#ef4444'; // red     - Obesidad / Riesgo alto

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1.5">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help text-slate-400 hover:text-teal-600 transition-colors inline-flex items-center"
      >
        <Info className="w-3.5 h-3.5" />
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl min-w-[230px] max-w-[310px] animate-in fade-in zoom-in duration-200 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Zone {
  label: string;
  end: number;
  color: string;
}

// ─── Generic Range Bar ────────────────────────────────────────────────────────
const RangeBar = ({
  value, minVal, maxVal, zones, unit, title, tooltipContent, chartId, showIdealRange = false
}: {
  value: string;
  minVal: number;
  maxVal: number;
  zones: Zone[];
  unit: string;
  title: string;
  tooltipContent: React.ReactNode;
  chartId: string;
  showIdealRange?: boolean;
}) => {
  if (s(value).trim() === '') return null;
  const v = parseFloat(s(value));
  if (isNaN(v)) return null;

  const W = 500;
  const H = 28;
  const R = 8;
  const range = maxVal - minVal;
  const clampedV = Math.max(minVal, Math.min(maxVal, v));
  const indicatorX = ((clampedV - minVal) / range) * W;

  let prevEnd = minVal;
  const segments = zones.map(z => {
    const segX = ((prevEnd - minVal) / range) * W;
    const segW = ((z.end - prevEnd) / range) * W;
    prevEnd = z.end;
    return { ...z, x: segX, w: segW };
  });

  const currentSeg = segments.find(s => v < s.end) ?? segments[segments.length - 1];

  // Compute ideal (Saludable / Normal) range text
  let idealText = '';
  if (showIdealRange) {
    let zoneStart = minVal;
    for (const z of zones) {
      if (z.label === 'Saludable' || z.label === 'Normal') {
        idealText = `ideal: ${zoneStart}–${z.end}${unit}`;
        break;
      }
      zoneStart = z.end;
    }
  }

  return (
    <div className="animate-in fade-in duration-300 space-y-1">
      <div className="flex items-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        <InfoTooltip content={tooltipContent} />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm font-bold" style={{ color: currentSeg.color }}>
          {v}{unit}
        </span>
        <span className="text-xs text-slate-400">—</span>
        <span className="text-xs font-semibold" style={{ color: currentSeg.color }}>{currentSeg.label}</span>
        {idealText && (
          <span className="text-xs text-slate-400 ml-1">({idealText})</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
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
          <line
            key={`div-${s.label}`}
            x1={s.x + s.w} y1={0}
            x2={s.x + s.w} y2={H}
            stroke="white" strokeWidth={2} opacity={0.5}
          />
        ))}
        {segments.map(s => (
          <text
            key={`lbl-${s.label}`}
            x={s.x + s.w / 2}
            y={H / 2 + 4}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="white"
            opacity={0.9}
          >
            {s.label}
          </text>
        ))}
        <polygon
          points={`${indicatorX},${H + 2} ${indicatorX - 7},${H + 16} ${indicatorX + 7},${H + 16}`}
          fill={currentSeg.color}
        />
      </svg>
    </div>
  );
};

// ─── Physique Rating Grid ─────────────────────────────────────────────────────
const PHYSIQUE_TYPES = [
  { n: 1, label: 'Obesidad oculta' },
  { n: 2, label: 'Obeso' },
  { n: 3, label: 'Constitución sólida' },
  { n: 4, label: 'Poco ejercitado' },
  { n: 5, label: 'Estándar' },
  { n: 6, label: 'Estándar musculoso' },
  { n: 7, label: 'Delgado' },
  { n: 8, label: 'Delgado y musculoso' },
  { n: 9, label: 'Muy musculoso' },
];

const PhysiqueRatingGrid = ({
  value, tooltipContent
}: { value: string; tooltipContent: React.ReactNode }) => {
  if (s(value).trim() === '') return null;
  const v = parseInt(s(value));
  if (isNaN(v) || v < 1 || v > 9) return null;
  const current = PHYSIQUE_TYPES.find(t => t.n === v);

  return (
    <div className="animate-in fade-in duration-300 space-y-1">
      <div className="flex items-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Physique Rating</span>
        <InfoTooltip content={tooltipContent} />
      </div>
      {current && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-teal-600">{v}</span>
          <span className="text-xs text-slate-400">—</span>
          <span className="text-xs font-semibold text-teal-600">{current.label}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {PHYSIQUE_TYPES.map(t => (
          <div
            key={t.n}
            className={`rounded-xl p-2.5 text-center transition-all duration-200 ${
              t.n === v
                ? 'bg-teal-500 shadow-lg shadow-teal-500/25 scale-105'
                : 'bg-slate-100'
            }`}
          >
            <div className={`text-base font-extrabold ${t.n === v ? 'text-white' : 'text-slate-400'}`}>
              {t.n}
            </div>
            <div className={`text-[10px] font-medium leading-tight mt-0.5 ${
              t.n === v ? 'text-teal-50' : 'text-slate-500'
            }`}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Metabolic Age Chart ──────────────────────────────────────────────────────
const MetabolicAgeChart = ({
  metabolicAge, realAge, tooltipContent
}: { metabolicAge: string; realAge: number; tooltipContent: React.ReactNode }) => {
  if (s(metabolicAge).trim() === '') return null;
  const meta = parseFloat(s(metabolicAge));
  if (isNaN(meta) || !realAge || realAge <= 0) return null;

  const W = 500;
  const H = 28;
  const R = 8;
  const rangeMin = 10;
  const rangeMax = 80;
  const range = rangeMax - rangeMin;

  const clampedReal = Math.max(rangeMin, Math.min(rangeMax, realAge));
  const clampedMeta = Math.max(rangeMin, Math.min(rangeMax, meta));
  const realX = ((clampedReal - rangeMin) / range) * W;
  const metaX = ((clampedMeta - rangeMin) / range) * W;

  const diff = Math.round(Math.abs(meta - realAge));
  const isOlder = meta > realAge;
  const statusColor = isOlder ? C_OBESE : C_HEALTHY;
  const statusLabel = diff === 0
    ? 'Igual a edad real'
    : isOlder
      ? `${diff} año${diff !== 1 ? 's' : ''} por encima`
      : `${diff} año${diff !== 1 ? 's' : ''} por debajo`;

  // Keep labels from overlapping when ages are close
  const tooClose = Math.abs(realX - metaX) < 70;
  const realLabelY = tooClose ? H + 14 : H + 14;
  const metaLabelY = tooClose ? H + 30 : H + 30;
  const realLabelAnchor = tooClose && realX > metaX ? 'start' : tooClose && realX < metaX ? 'end' : 'middle';
  const metaLabelAnchor = tooClose && metaX > realX ? 'start' : tooClose && metaX < realX ? 'end' : 'middle';

  return (
    <div className="animate-in fade-in duration-300 space-y-1">
      <div className="flex items-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Edad Metabólica</span>
        <InfoTooltip content={tooltipContent} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold" style={{ color: statusColor }}>{meta} años</span>
        <span className="text-xs text-slate-400">—</span>
        <span className="text-xs font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 38}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <clipPath id="clip-meta-age">
            <rect x={0} y={0} width={W} height={H} rx={R} />
          </clipPath>
          <linearGradient id="grad-meta-age" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C_HEALTHY} />
            <stop offset="60%" stopColor={C_HIGH} />
            <stop offset="100%" stopColor={C_OBESE} />
          </linearGradient>
        </defs>
        <g clipPath="url(#clip-meta-age)">
          <rect x={0} y={0} width={W} height={H} fill="url(#grad-meta-age)" opacity={0.75} />
        </g>
        {/* Real age line */}
        <line x1={realX} y1={0} x2={realX} y2={H} stroke="white" strokeWidth={3} strokeDasharray="4,3" opacity={0.9} />
        <text
          x={realX} y={realLabelY}
          textAnchor={realLabelAnchor}
          fontSize={10} fontWeight="bold" fill="#475569"
        >
          Real: {realAge}
        </text>
        {/* Metabolic age indicator */}
        <polygon
          points={`${metaX},${H + 2} ${metaX - 7},${H + 16} ${metaX + 7},${H + 16}`}
          fill={statusColor}
        />
        <text
          x={metaX} y={metaLabelY}
          textAnchor={metaLabelAnchor}
          fontSize={10} fontWeight="bold" fill={statusColor}
        >
          Metab.: {meta}
        </text>
      </svg>
    </div>
  );
};

// ─── Bone Mass Chart ──────────────────────────────────────────────────────────
const getExpectedBoneMass = (weight: number, sex: string): number => {
  if (sex === 'Femenino') {
    if (weight < 50) return 1.95;
    if (weight <= 75) return 2.40;
    return 2.95;
  } else {
    if (weight < 65) return 2.66;
    if (weight <= 95) return 3.29;
    return 3.69;
  }
};

const BoneMassChart = ({
  boneMass, weight, sex, tooltipContent
}: { boneMass: string; weight: string; sex: string; tooltipContent: React.ReactNode }) => {
  if (s(boneMass).trim() === '' || s(weight).trim() === '') return null;
  const v = parseFloat(s(boneMass));
  const weightVal = parseFloat(s(weight));
  if (isNaN(v) || isNaN(weightVal) || weightVal <= 0) return null;

  const expected = getExpectedBoneMass(weightVal, sex);
  const minVal = parseFloat((expected * 0.5).toFixed(2));
  const maxVal = parseFloat((expected * 1.5).toFixed(2));
  const lowEnd = parseFloat((expected * 0.9).toFixed(2));
  const highStart = parseFloat((expected * 1.1).toFixed(2));

  const zones: Zone[] = [
    { label: 'Bajo', end: lowEnd, color: C_LOW },
    { label: 'Normal', end: highStart, color: C_HEALTHY },
    { label: 'Alto', end: maxVal, color: C_OBESE },
  ];

  const W = 500;
  const H = 28;
  const R = 8;
  const range = maxVal - minVal;
  const clampedV = Math.max(minVal, Math.min(maxVal, v));
  const indicatorX = ((clampedV - minVal) / range) * W;
  const expectedX = ((expected - minVal) / range) * W;

  let prevEnd = minVal;
  const segments = zones.map(z => {
    const segX = ((prevEnd - minVal) / range) * W;
    const segW = ((z.end - prevEnd) / range) * W;
    prevEnd = z.end;
    return { ...z, x: segX, w: segW };
  });

  const currentSeg = segments.find(s => v < s.end) ?? segments[segments.length - 1];

  return (
    <div className="animate-in fade-in duration-300 space-y-1">
      <div className="flex items-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Masa Ósea</span>
        <InfoTooltip content={tooltipContent} />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm font-bold" style={{ color: currentSeg.color }}>{v} kg</span>
        <span className="text-xs text-slate-400">—</span>
        <span className="text-xs font-semibold" style={{ color: currentSeg.color }}>{currentSeg.label}</span>
        <span className="text-xs text-slate-400 ml-1">(esperado: {expected} kg)</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <clipPath id="clip-bone-mass">
            <rect x={0} y={0} width={W} height={H} rx={R} />
          </clipPath>
        </defs>
        <g clipPath="url(#clip-bone-mass)">
          {segments.map(s => (
            <rect key={s.label} x={s.x} y={0} width={s.w} height={H} fill={s.color} opacity={0.85} />
          ))}
        </g>
        {segments.slice(0, -1).map(s => (
          <line
            key={`div-${s.label}`}
            x1={s.x + s.w} y1={0}
            x2={s.x + s.w} y2={H}
            stroke="white" strokeWidth={2} opacity={0.5}
          />
        ))}
        {segments.map(s => (
          <text
            key={`lbl-${s.label}`}
            x={s.x + s.w / 2}
            y={H / 2 + 4}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="white"
            opacity={0.9}
          >
            {s.label}
          </text>
        ))}
        {/* Expected value marker */}
        <line
          x1={expectedX} y1={0}
          x2={expectedX} y2={H}
          stroke="white" strokeWidth={2} strokeDasharray="4,2" opacity={0.8}
        />
        {/* Indicator triangle */}
        <polygon
          points={`${indicatorX},${H + 2} ${indicatorX - 7},${H + 16} ${indicatorX + 7},${H + 16}`}
          fill={currentSeg.color}
        />
      </svg>
    </div>
  );
};

// ─── Body Fat Zones ───────────────────────────────────────────────────────────
const getBodyFatZones = (sex: string, age: number): Zone[] => {
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
};

// ─── Tooltip Contents ─────────────────────────────────────────────────────────
const BodyFatTooltip = () => (
  <div className="space-y-1.5">
    <div className="font-bold text-teal-300 mb-1">% Grasa Corporal (Tanita BC-533)</div>
    <div className="font-semibold text-slate-300">Mujeres</div>
    <div>20-39: &lt;21% Bajo · 21-33% Saludable · 33-39% Alto · &gt;39% Obesidad</div>
    <div>40-59: &lt;23% Bajo · 23-34% Saludable · 34-40% Alto · &gt;40% Obesidad</div>
    <div>60+: &lt;24% Bajo · 24-36% Saludable · 36-42% Alto · &gt;42% Obesidad</div>
    <div className="font-semibold text-slate-300 mt-1">Hombres</div>
    <div>20-39: &lt;8% Bajo · 8-20% Saludable · 20-25% Alto · &gt;25% Obesidad</div>
    <div>40-59: &lt;11% Bajo · 11-22% Saludable · 22-28% Alto · &gt;28% Obesidad</div>
    <div>60+: &lt;13% Bajo · 13-25% Saludable · 25-30% Alto · &gt;30% Obesidad</div>
  </div>
);

const VisceralFatTooltip = () => (
  <div className="space-y-1">
    <div className="font-bold text-teal-300 mb-1">Grasa Visceral</div>
    <div>1-9: <span className="text-teal-300">Saludable</span></div>
    <div>10-14: <span className="text-yellow-300">Elevado</span></div>
    <div>15-59: <span className="text-red-300">Riesgo alto</span></div>
  </div>
);

const WaterTooltip = () => (
  <div className="space-y-1">
    <div className="font-bold text-teal-300 mb-1">Agua Corporal Total</div>
    <div>Mujeres: <span className="text-teal-300">45-60%</span></div>
    <div>Hombres: <span className="text-teal-300">50-65%</span></div>
    <div className="text-slate-400 mt-1">Valores fuera de rango pueden indicar deshidratación o retención de líquidos.</div>
  </div>
);

const ImcTooltip = () => (
  <div className="space-y-1">
    <div className="font-bold text-teal-300 mb-1">IMC (OMS)</div>
    <div>&lt;18.5: <span className="text-orange-300">Bajo peso</span></div>
    <div>18.5-24.9: <span className="text-teal-300">Normal</span></div>
    <div>25-29.9: <span className="text-yellow-300">Sobrepeso</span></div>
    <div>&gt;30: <span className="text-red-300">Obesidad</span></div>
  </div>
);

const BoneMassTooltip = () => (
  <div className="space-y-1">
    <div className="font-bold text-teal-300 mb-1">Masa Ósea Estimada (Tanita BC-533)</div>
    <div className="font-semibold text-slate-300">Mujeres</div>
    <div>&lt;50 kg → 1.95 kg esperado</div>
    <div>50-75 kg → 2.40 kg esperado</div>
    <div>&gt;75 kg → 2.95 kg esperado</div>
    <div className="font-semibold text-slate-300 mt-1">Hombres</div>
    <div>&lt;65 kg → 2.66 kg esperado</div>
    <div>65-95 kg → 3.29 kg esperado</div>
    <div>&gt;95 kg → 3.69 kg esperado</div>
  </div>
);

const PhysiqueTooltip = () => (
  <div className="space-y-0.5">
    <div className="font-bold text-teal-300 mb-1">Physique Rating</div>
    {PHYSIQUE_TYPES.map(t => (
      <div key={t.n}>
        <span className="text-teal-300 font-bold">{t.n}</span> — {t.label}
      </div>
    ))}
  </div>
);

const MetabolicAgeTooltip = () => (
  <div className="space-y-1">
    <div className="font-bold text-teal-300 mb-1">Edad Metabólica</div>
    <div>Compara el metabolismo basal con el promedio de la edad cronológica.</div>
    <div className="mt-1">
      <span className="text-teal-300">Por debajo</span> de la edad real: buen metabolismo y composición corporal.
    </div>
    <div>
      <span className="text-red-300">Por encima</span> de la edad real: metabolismo más lento de lo esperado.
    </div>
  </div>
);

// ─── Chart Placeholder ────────────────────────────────────────────────────────
const ChartPlaceholder = ({
  title, tooltipContent, missingFields
}: { title: string; tooltipContent: React.ReactNode; missingFields: string[] }) => (
  <div className="space-y-1">
    <div className="flex items-center">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      <InfoTooltip content={tooltipContent} />
    </div>
    <div className="flex items-center gap-2 py-2.5 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-xs text-slate-400">
        Por favor llena <span className="font-semibold text-slate-500">{missingFields.join(' y ')}</span> para generar esta gráfica
      </span>
    </div>
  </div>
);

// ─── Form Data Interface ──────────────────────────────────────────────────────
export interface BioFormData {
  gender: string;
  age: string;
  weight: string;
  height: string;
  imc: string;
  bodyFat: string;
  totalBodyWater: string;
  muscleMass: string;
  physiqueRating: string;
  visceralFat: string;
  boneMass: string;
  bmr: string;
  metabolicAge: string;
  [key: string]: any;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const BioimpedanciaInterpretation: React.FC<{
  formData: BioFormData;
}> = ({ formData }) => {
  const age = parseInt(s(formData.age)) || 0;
  const sex = s(formData.gender) || '';

  const hasAnyValue = [
    formData.bodyFat,
    formData.visceralFat,
    formData.totalBodyWater,
    formData.physiqueRating,
    formData.metabolicAge,
    formData.imc,
    formData.boneMass,
  ].some(v => s(v).trim() !== '');

  if (!hasAnyValue) return null;

  const bodyFatZones = getBodyFatZones(sex, age);
  const bodyFatMax = sex === 'Masculino' ? 40 : 55;

  const waterZones: Zone[] = sex === 'Masculino' ? [
    { label: 'Bajo', end: 50, color: C_LOW },
    { label: 'Saludable', end: 65, color: C_HEALTHY },
    { label: 'Alto', end: 80, color: C_OBESE },
  ] : [
    { label: 'Bajo', end: 45, color: C_LOW },
    { label: 'Saludable', end: 60, color: C_HEALTHY },
    { label: 'Alto', end: 80, color: C_OBESE },
  ];

  return (
    <div className="space-y-6">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
        INTERPRETACIÓN VISUAL EN TIEMPO REAL
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        {/* % Grasa Corporal */}
        {s(formData.bodyFat).trim() === '' || !sex || !age ? (
          <ChartPlaceholder
            title="% Grasa Corporal"
            tooltipContent={<BodyFatTooltip />}
            missingFields={[
              ...(!sex ? ['Género'] : []),
              ...(!age ? ['Edad'] : []),
              ...(s(formData.bodyFat).trim() === '' ? ['% Grasa corporal'] : []),
            ]}
          />
        ) : (
          <RangeBar
            value={s(formData.bodyFat)}
            minVal={0}
            maxVal={bodyFatMax}
            zones={bodyFatZones}
            unit="%"
            title="% Grasa Corporal"
            tooltipContent={<BodyFatTooltip />}
            chartId="clip-body-fat"
            showIdealRange
          />
        )}

        {/* Grasa Visceral */}
        {s(formData.visceralFat).trim() === '' ? (
          <ChartPlaceholder
            title="Grasa Visceral"
            tooltipContent={<VisceralFatTooltip />}
            missingFields={['Grasa visceral']}
          />
        ) : (
          <RangeBar
            value={s(formData.visceralFat)}
            minVal={1}
            maxVal={30}
            zones={[
              { label: 'Saludable', end: 10, color: C_HEALTHY },
              { label: 'Elevado', end: 15, color: C_HIGH },
              { label: 'Riesgo alto', end: 30, color: C_OBESE },
            ]}
            unit=""
            title="Grasa Visceral"
            tooltipContent={<VisceralFatTooltip />}
            chartId="clip-visceral-fat"
            showIdealRange
          />
        )}

        {/* Agua Corporal */}
        {s(formData.totalBodyWater).trim() === '' || !sex ? (
          <ChartPlaceholder
            title="Agua Corporal Total"
            tooltipContent={<WaterTooltip />}
            missingFields={[
              ...(!sex ? ['Género'] : []),
              ...(s(formData.totalBodyWater).trim() === '' ? ['% Agua corporal'] : []),
            ]}
          />
        ) : (
          <RangeBar
            value={s(formData.totalBodyWater)}
            minVal={30}
            maxVal={80}
            zones={waterZones}
            unit="%"
            title="Agua Corporal Total"
            tooltipContent={<WaterTooltip />}
            chartId="clip-water"
            showIdealRange
          />
        )}

        {/* IMC */}
        {s(formData.imc).trim() === '' ? (
          <ChartPlaceholder
            title="IMC"
            tooltipContent={<ImcTooltip />}
            missingFields={['Peso y Talla']}
          />
        ) : (
          <RangeBar
            value={s(formData.imc)}
            minVal={10}
            maxVal={45}
            zones={[
              { label: 'Bajo peso', end: 18.5, color: C_LOW },
              { label: 'Normal', end: 25, color: C_HEALTHY },
              { label: 'Sobrepeso', end: 30, color: C_HIGH },
              { label: 'Obesidad', end: 45, color: C_OBESE },
            ]}
            unit=""
            title="IMC"
            tooltipContent={<ImcTooltip />}
            chartId="clip-imc"
            showIdealRange
          />
        )}

        {/* Masa Ósea */}
        {s(formData.boneMass).trim() === '' || s(formData.weight).trim() === '' || !sex ? (
          <ChartPlaceholder
            title="Masa Ósea"
            tooltipContent={<BoneMassTooltip />}
            missingFields={[
              ...(!sex ? ['Género'] : []),
              ...(s(formData.weight).trim() === '' ? ['Peso'] : []),
              ...(s(formData.boneMass).trim() === '' ? ['Masa ósea'] : []),
            ]}
          />
        ) : (
          <BoneMassChart
            boneMass={s(formData.boneMass)}
            weight={s(formData.weight)}
            sex={sex}
            tooltipContent={<BoneMassTooltip />}
          />
        )}

        {/* Edad Metabólica */}
        {s(formData.metabolicAge).trim() === '' || !age ? (
          <ChartPlaceholder
            title="Edad Metabólica"
            tooltipContent={<MetabolicAgeTooltip />}
            missingFields={[
              ...(!age ? ['Edad'] : []),
              ...(s(formData.metabolicAge).trim() === '' ? ['Edad metabólica'] : []),
            ]}
          />
        ) : (
          <MetabolicAgeChart
            metabolicAge={s(formData.metabolicAge)}
            realAge={age}
            tooltipContent={<MetabolicAgeTooltip />}
          />
        )}
      </div>

      {/* Physique Rating — full width */}
      {s(formData.physiqueRating).trim() === '' ? (
        <ChartPlaceholder
          title="Physique Rating"
          tooltipContent={<PhysiqueTooltip />}
          missingFields={['Physique Rating']}
        />
      ) : (
        <PhysiqueRatingGrid
          value={s(formData.physiqueRating)}
          tooltipContent={<PhysiqueTooltip />}
        />
      )}
    </div>
  );
};
