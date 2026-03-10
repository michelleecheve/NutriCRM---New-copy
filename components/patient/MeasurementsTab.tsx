import React, { useState } from 'react';
import { Patient, Measurement } from '../../types';
import { Plus, History } from 'lucide-react';
import { AnthropometryTable } from './AnthropometryTable';
import { SomatocartaModule } from './SomatocartaModule';
import { NewMeasurementForm } from './NewMeasurementForm';
import { MeasurementsHistory } from './MeasurementsHistory';

export const MeasurementsTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingId(null);
    setView('new');
  };

  const handleEdit = (m: Measurement) => {
    setEditingId(m.date);
    setView('detail');
  };

  // ✅ Cuando estás en form, se comporta como “página individual”
  if (view === 'new' || view === 'detail') {
    return (
      <div className="space-y-8">
        <NewMeasurementForm
          patient={patient}
          onUpdate={onUpdate}
          mode={view}
          editingId={editingId}
          onClose={() => {
            setView('list');
            setEditingId(null);
          }}
        />
      </div>
    );
  }

  // ✅ Vista normal (list)
  return (
    <div className="space-y-8">
      {/* Botón agregar arriba */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Medidas Antropométricas</h3>
            <p className="text-xs text-slate-400">Agregar Registro + Tabla + Somatocarta + Historial</p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {/* 2) Tabla antropométrica */}
      <AnthropometryTable patient={patient} onUpdate={onUpdate} />

      {/* 3) Somatocarta */}
      <SomatocartaModule patient={patient} onUpdate={onUpdate} />

      {/* 4) Historial al final (cards) */}
      <div className="space-y-4">
        <div className="px-1">
          <h3 className="font-bold text-lg text-slate-800">Historial de Registros</h3>
          <p className="text-xs text-slate-400">Haga clic en un registro para ver detalles</p>
        </div>

        <MeasurementsHistory patient={patient} onEdit={handleEdit} />
      </div>
    </div>
  );
};
