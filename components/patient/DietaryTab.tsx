import React, { useMemo, useState } from 'react';
import { Patient, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import { Utensils, Plus, Save } from 'lucide-react';
import { SectionHeader, ModernTextArea } from './SharedComponents';
import { DietaryCard } from './DietaryCard';
import { DietaryForm } from './DietaryForm';

export const DietaryTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void; onNavigateToEvaluations: () => void }> = ({ patient, onUpdate, onNavigateToEvaluations }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localPatient, setLocalPatient] = useState<Patient>(patient);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state if patient changes
  React.useEffect(() => {
    setLocalPatient(patient);
  }, [patient.id]);

  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  const updateDietary = (field: string, value: any) => {
    setLocalPatient(prev => ({
      ...prev,
      dietary: { ...prev.dietary, [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localPatient);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePatient = (updated: Patient) => {
    onUpdate(updated);
    store.updatePatient(updated);
    setView('list');
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    const itemToDelete = patient.dietaryEvaluations.find(e => e.id === editingId);
    const updatedEvaluations = patient.dietaryEvaluations.filter(e => e.id !== editingId);
    const updated = { ...patient, dietaryEvaluations: updatedEvaluations };
    
    try {
      if (itemToDelete?.id) {
        await store.deleteDietaryEvaluation(itemToDelete.id);
      }
      onUpdate(updated);
      setView('list');
      setEditingId(null);
    } catch (error) {
      console.error('Error deleting dietary evaluation:', error);
    }
  };

  const hasChanges = JSON.stringify(localPatient.dietary) !== JSON.stringify(patient.dietary);

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Perfil dietético */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader icon={Utensils} title="Perfil Dietético Actual" />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`text-xs font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg ${
              hasChanges
                ? 'text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                : 'text-emerald-600 bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <Save className="w-3 h-3" />
            {isSaving ? 'Guardando...' : hasChanges ? '● Hay cambios sin guardar' : 'Guardar Cambios'}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <ModernTextArea
            label="Preferencias y Aversiones"
            value={localPatient.dietary.preferences}
            onChange={(e: any) => updateDietary('preferences', e.target.value)}
            rows={4}
            placeholder="Escribe aquí las preferencias y aversiones alimentarias del paciente..."
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
              <p className="text-xs text-slate-400">Recordatorio 24H, Frecuencia de consumo de alimentos.</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => { setEditingId(null); setView('edit'); }}
              disabled={patientEvaluations.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors ${
                patientEvaluations.length > 0
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" /> Nueva evaluación dietética
            </button>
            {patientEvaluations.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Para crear una evaluación dietética primero debes crear una fecha de evaluación.</span>
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