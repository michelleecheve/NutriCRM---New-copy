import React, { useState } from 'react';
import { authStore } from '../../services/authStore';
import { supabaseService } from '../../services/supabaseService';

export const MenuPatientPortal: React.FC = () => {
  const user = authStore.getCurrentUser();
  const currentDefault = user?.profile?.portalConfig?.measurementsDetailDefault ?? true;

  const [measurementsDetailDefault, setMeasurementsDetailDefault] = useState(currentDefault);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleToggle() {
    const next = !measurementsDetailDefault;
    setMeasurementsDetailDefault(next);
    setSaving(true);
    setSaved(false);
    try {
      const userId = user?.id;
      if (!userId) return;
      const existing = user?.profile?.portalConfig ?? {};
      await supabaseService.updateProfile(userId, {
        portalConfig: { ...existing, measurementsDetailDefault: next },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setMeasurementsDetailDefault(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">
            Detalle de medidas visible por defecto
          </p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {measurementsDetailDefault
              ? 'Los nuevos pacientes podrán expandir sus tarjetas de medidas y ver todos los datos.'
              : 'Los nuevos pacientes solo verán la tarjeta resumida, sin poder expandirla.'}
          </p>
          <p className="text-xs text-slate-300 mt-1.5">
            Solo afecta pacientes sin configuración previa. Los ya configurados mantienen su valor individual.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && (
            <span className="text-xs text-emerald-600 font-medium">Guardado</span>
          )}
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              measurementsDetailDefault ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            title={measurementsDetailDefault ? 'Desactivar por defecto' : 'Activar por defecto'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                measurementsDetailDefault ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
