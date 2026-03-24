import React from 'react';
import { LatestMeasurement, LatestBio } from './PortalShell';

interface Props {
  latestMeasurement?: LatestMeasurement | null;
  latestBio?: LatestBio | null;
}

function formatDate(d?: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  emoji: string;
  label: string;
  value: string | number;
  unit?: string;
}> = ({ emoji, label, value, unit }) => (
  <div
    className="p-4 rounded-2xl"
    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E0E8E3' }}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{emoji}</span>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
    </div>
    <p className="text-xl font-extrabold text-gray-900">
      {value}
      {unit && <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>}
    </p>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const MeasurementsView: React.FC<Props> = ({ latestMeasurement, latestBio }) => {
  const hasMeasurement = latestMeasurement && Object.keys(latestMeasurement).some(
    k => k !== 'date' && latestMeasurement[k as keyof LatestMeasurement] != null
  );
  const hasBio = latestBio && Object.keys(latestBio).some(
    k => k !== 'date' && latestBio[k as keyof LatestBio] != null
  );

  if (!hasMeasurement && !hasBio) {
    return (
      <div className="text-center py-10 px-6">
        <p className="text-3xl mb-3">📏</p>
        <p className="text-sm text-gray-400">
          Sin datos de medidas registrados aún.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-2">

      {/* ── Anthropometry ── */}
      {hasMeasurement && (
        <div className="px-4 pt-1 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Antropometría</p>
            {latestMeasurement!.date && (
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {formatDate(latestMeasurement!.date)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {latestMeasurement!.weight != null && (
              <StatCard emoji="⚖️" label="Peso" value={latestMeasurement!.weight!} unit="kg" />
            )}
            {latestMeasurement!.height != null && (
              <StatCard emoji="📐" label="Talla" value={latestMeasurement!.height!} unit="cm" />
            )}
            {latestMeasurement!.imc != null && (
              <StatCard emoji="🔢" label="IMC" value={latestMeasurement!.imc!.toFixed(1)} unit="kg/m²" />
            )}
            {latestMeasurement!.bodyFatPct != null && (
              <StatCard emoji="💧" label="% Grasa" value={`${latestMeasurement!.bodyFatPct!}%`} />
            )}
            {latestMeasurement!.leanMassKg != null && (
              <StatCard emoji="💪" label="Masa magra" value={latestMeasurement!.leanMassKg!} unit="kg" />
            )}
            {latestMeasurement!.muscleKg != null && (
              <StatCard emoji="🏋️" label="Masa muscular" value={latestMeasurement!.muscleKg!} unit="kg" />
            )}
            {latestMeasurement!.boneMass != null && (
              <StatCard emoji="🦴" label="Masa ósea" value={latestMeasurement!.boneMass!} unit="kg" />
            )}
          </div>
        </div>
      )}

      {/* ── Bioimpedance ── */}
      {hasBio && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Bioimpedancia</p>
            {latestBio!.date && (
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {formatDate(latestBio!.date)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {latestBio!.weight != null && (
              <StatCard emoji="⚖️" label="Peso" value={latestBio!.weight!} unit="kg" />
            )}
            {latestBio!.bodyFatPct != null && (
              <StatCard emoji="💧" label="% Grasa" value={`${latestBio!.bodyFatPct!}%`} />
            )}
            {latestBio!.muscleMass != null && (
              <StatCard emoji="💪" label="Masa muscular" value={latestBio!.muscleMass!} unit="kg" />
            )}
            {latestBio!.waterPct != null && (
              <StatCard emoji="🫧" label="% Agua" value={`${latestBio!.waterPct!}%`} />
            )}
            {latestBio!.bmr != null && (
              <StatCard emoji="🔥" label="TMB" value={latestBio!.bmr!} unit="kcal" />
            )}
            {latestBio!.metabolicAge != null && (
              <StatCard emoji="⏱️" label="Edad metabólica" value={latestBio!.metabolicAge!} unit="años" />
            )}
            {latestBio!.visceralFat != null && (
              <StatCard emoji="📊" label="Grasa visceral" value={latestBio!.visceralFat!} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
