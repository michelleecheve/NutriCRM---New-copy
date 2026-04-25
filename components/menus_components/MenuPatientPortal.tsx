import React, { useState } from 'react';
import { authStore } from '../../services/authStore';
import { supabaseService } from '../../services/supabaseService';
import { AntroFieldsConfig, BioFieldsConfig } from '../../types';
import { MeasurementsToggle } from '../patient_mobile_portal/MeasurementsToggle';

const EMPTY_ANTRO: AntroFieldsConfig = {};
const EMPTY_BIO: BioFieldsConfig = {};

export const MenuPatientPortal: React.FC = () => {
  const user = authStore.getCurrentUser();
  const portalConfig = user?.profile?.portalConfig ?? {};

  const [measurementsDetailDefault, setMeasurementsDetailDefault] = useState(
    portalConfig.measurementsDetailDefault ?? true,
  );
  const [antroConfig, setAntroConfig] = useState<AntroFieldsConfig>(
    portalConfig.antroFieldsDefault ?? EMPTY_ANTRO,
  );
  const [bioConfig, setBioConfig] = useState<BioFieldsConfig>(
    portalConfig.bioFieldsDefault ?? EMPTY_BIO,
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function persist(patch: Partial<typeof portalConfig>) {
    const userId = user?.id;
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    try {
      await supabaseService.updateProfile(userId, {
        portalConfig: { ...portalConfig, ...patch },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDetail() {
    const next = !measurementsDetailDefault;
    setMeasurementsDetailDefault(next);
    await persist({ measurementsDetailDefault: next });
  }

  async function handleFieldsChange(antro: AntroFieldsConfig, bio: BioFieldsConfig) {
    setAntroConfig(antro);
    setBioConfig(bio);
    await persist({ antroFieldsDefault: antro, bioFieldsDefault: bio });
  }

  return (
    <div className="space-y-3">
      {/* Master toggle */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">
            Detalle de medidas visible por defecto
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {measurementsDetailDefault
              ? 'Los pacientes nuevos podrán expandir sus tarjetas de medidas y ver los datos configurados.'
              : 'Los pacientes nuevos solo verán la tarjeta resumida, sin detalle.'}
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            Solo afecta pacientes sin configuración previa. Los ya configurados mantienen su valor individual.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && (
            <span className="text-xs text-emerald-600 font-medium">Guardado</span>
          )}
          <button
            onClick={handleToggleDetail}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              measurementsDetailDefault ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                measurementsDetailDefault ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Field toggles — only when detail is ON */}
      {measurementsDetailDefault && (
        <div className="p-4 rounded-xl space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Campos visibles en el detalle de medidas
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura qué datos se muestran cuando el paciente expande una tarjeta de medidas.
              Este es el template por defecto para pacientes nuevos.
            </p>
          </div>
          <MeasurementsToggle
            antro={antroConfig}
            bio={bioConfig}
            onChange={handleFieldsChange}
          />
          {saving && (
            <p className="text-xs text-slate-400 animate-pulse">Guardando...</p>
          )}
        </div>
      )}
    </div>
  );
};
