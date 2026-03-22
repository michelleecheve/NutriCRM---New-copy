import React, { useState, useMemo } from 'react';
import { Patient, Measurement } from '../../types';
import { store } from '../../services/store';
import { Plus, History, Eye, EyeOff, Activity } from 'lucide-react';
import { AnthropometryTable } from './AnthropometryTable';
import { SomatocartaModule } from './SomatocartaModule';
import { NewMeasurementForm } from './NewMeasurementForm';
import { MeasurementsHistory } from './MeasurementsHistory';
import { BioimpedanciaSection } from './BioimpedanciaSection';
import { BioimpedanciaForm } from './BioimpedanciaForm';

export const MeasurementsTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void; onNavigateToEvaluations: () => void }> = ({ patient, onUpdate, onNavigateToEvaluations }) => {
  const [view, setView] = useState<'list' | 'edit' | 'bio_edit'>('list');
  const patientEvaluations = useMemo(() => store.getEvaluations(patient.id), [patient.id]);
  // ✅ editingId es ahora m.id (string) — null = crear nuevo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAnthro, setShowAnthro] = useState(false);
  const [showBio, setShowBio] = useState(false);

  const handleAdd = () => {
    setEditingId(null);
    setView('edit');
  };

  const handleAddBio = () => {
    setEditingId(null);
    setView('bio_edit');
  };

  const handleEditBio = (id: string) => {
    setEditingId(id);
    setView('bio_edit');
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

  if (view === 'bio_edit') {
    return (
      <div className="space-y-8">
        <BioimpedanciaForm
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
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleAdd}
              disabled={patientEvaluations.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                patientEvaluations.length === 0
                  ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                  : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
              }`}
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
            {patientEvaluations.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Para agregar medidas primero debes crear una fecha de evaluación.</span>
                <button
                  type="button"
                  onClick={onNavigateToEvaluations}
                  className="flex-shrink-0 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                  Crear evaluación
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAnthro && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <AnthropometryTable patient={patient} onUpdate={onUpdate} />
          <SomatocartaModule patient={patient} onUpdate={onUpdate} />
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="font-bold text-lg text-slate-800">Historial de Medidas</h3>
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
            onClick={() => setShowBio(!showBio)}
            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 border border-slate-200"
            title={showBio ? "Ocultar secciones" : "Mostrar secciones"}
          >
            {showBio ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleAddBio}
              disabled={patientEvaluations.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                patientEvaluations.length === 0
                  ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                  : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
              }`}
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
            {patientEvaluations.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Para agregar medidas primero debes crear una fecha de evaluación.</span>
                <button
                  type="button"
                  onClick={onNavigateToEvaluations}
                  className="flex-shrink-0 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                  Crear evaluación
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBio && (
        <BioimpedanciaSection 
          patient={patient} 
          onUpdate={onUpdate} 
          onEdit={handleEditBio}
        />
      )}
    </div>
  );
};