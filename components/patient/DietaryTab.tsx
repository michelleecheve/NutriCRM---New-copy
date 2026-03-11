import React, { useMemo, useState } from 'react';
import { Patient, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import { Utensils, Plus } from 'lucide-react';
import { SectionHeader, ModernTextArea } from './SharedComponents';
import { DietaryCard } from './DietaryCard';
import { DietaryForm } from './DietaryForm';

export const DietaryTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  const updateDietary = (field: string, value: any) => {
    onUpdate({ ...patient, dietary: { ...patient.dietary, [field]: value } });
  };

  const handleSavePatient = (updated: Patient) => {
    onUpdate(updated);
    store.updatePatient(updated);
    setView('list');
    setEditingId(null);
  };

  const handleDelete = () => {
    if (!editingId) return;
    const updatedEvaluations = patient.dietaryEvaluations.filter(e => e.id !== editingId);
    const updated = { ...patient, dietaryEvaluations: updatedEvaluations };
    onUpdate(updated);
    store.updatePatient(updated);
    setView('list');
    setEditingId(null);
  };

  if (view === 'edit') {
    return (
      <DietaryForm
        patient={patient}
        patientEvaluations={patientEvaluations}
        editingId={editingId}
        onSavePatient={handleSavePatient}
        onCancel={() => { setView('list'); setEditingId(null); }}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* Perfil dietético */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <SectionHeader icon={Utensils} title="Perfil Dietético Actual" />
        <div className="grid grid-cols-1 gap-6">
          <ModernTextArea
            label="Preferencias y Aversiones"
            value={patient.dietary.preferences}
            onChange={(e: any) => updateDietary('preferences', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {/* Header historial */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <Utensils className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Historial de Evaluaciones Dietéticas</h3>
              <p className="text-xs text-slate-400">La evaluación a vincular se selecciona dentro del formulario.</p>
            </div>
          </div>

          {/* ✅ Botón Crear siempre visible — EvaluationLink vive dentro del form */}
          <button
            type="button"
            onClick={() => { setEditingId(null); setView('edit'); }}
            disabled={patientEvaluations.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors ${
              patientEvaluations.length > 0
                ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
            }`}
            title={patientEvaluations.length === 0 ? 'Crea una evaluación primero.' : ''}
          >
            <Plus className="w-4 h-4" /> Nueva evaluación dietética
          </button>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patient.dietaryEvaluations.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay evaluaciones dietéticas registradas.</p>
          </div>
        ) : (
          patient.dietaryEvaluations.map(evalItem => (
            <DietaryCard
              key={evalItem.id}
              evalItem={evalItem}
              onClick={() => { setEditingId(evalItem.id); setView('edit'); }}
            />
          ))
        )}
      </div>
    </div>
  );
};