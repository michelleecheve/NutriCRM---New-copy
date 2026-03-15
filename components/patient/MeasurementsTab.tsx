import React, { useState } from 'react';
import { Patient, Measurement } from '../../types';
import { Plus, History, Eye, EyeOff, Activity } from 'lucide-react';
import { AnthropometryTable } from './AnthropometryTable';
import { SomatocartaModule } from './SomatocartaModule';
import { NewMeasurementForm } from './NewMeasurementForm';
import { MeasurementsHistory } from './MeasurementsHistory';

export const MeasurementsTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  // ✅ editingId es ahora m.id (string) — null = crear nuevo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAnthro, setShowAnthro] = useState(false);
  const [showBio, setShowBio] = useState(false);

  const handleAdd = () => {
    setEditingId(null);
    setView('edit');
  };

  const handleEdit = (m: Measurement) => {
    // Legacy fix: si no tiene id, crea uno y actualiza el measurement INMUTABLE
    if (!m.id) {
      const newId = crypto.randomUUID();
      const updatedMeasurements = patient.measurements.map(meas =>
        meas === m ? { ...m, id: newId } : meas
      );
      onUpdate({ ...patient, measurements: updatedMeasurements });
      setEditingId(newId);
    } else {
      setEditingId(m.id);
    }
    setView('edit');
  };

  if (view === 'edit') {
    return (
      <div className="space-y-8">
        <NewMeasurementForm
          patient={patient}
          onUpdate={onUpdate}
          editingId={editingId}
          onClose={() => {
            setView('list');
            setEditingId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Medidas Antropométricas Card */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Medidas Antropométricas</h3>
            <p className="text-xs text-slate-400">Pliegues, perímetros y diámetros</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnthro(!showAnthro)}
            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600 border border-slate-200"
            title={showAnthro ? "Ocultar secciones" : "Mostrar secciones"}
          >
            {showAnthro ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={handleAdd}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {showAnthro && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <AnthropometryTable patient={patient} onUpdate={onUpdate} />
          <SomatocartaModule patient={patient} onUpdate={onUpdate} />
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="font-bold text-lg text-slate-800">Historial de Registros</h3>
              <p className="text-xs text-slate-400">Haga clic en un registro para ver detalles</p>
            </div>
            <MeasurementsHistory patient={patient} onEdit={handleEdit} />
          </div>
        </div>
      )}

      {/* Medidas Bioimpedancia Card */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Medidas Bioimpedancia</h3>
            <p className="text-xs text-slate-400">Grasa, músculo, agua y metabolismo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 border border-slate-200 cursor-not-allowed opacity-50"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
};