import React, { useMemo, useState, useEffect } from 'react';
import { Patient, DietaryEvaluation, MealEntry, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import { Utensils, Plus } from 'lucide-react';
import { SectionHeader, ModernTextArea } from './SharedComponents';
import { DietaryCard } from './DietaryCard';
import { DietaryForm } from './DietaryForm';

export const DietaryTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEvaluationId, setFormEvaluationId] = useState<string | null>(null);
  const [evalSelectorOpen, setEvalSelectorOpen] = useState(false);

  const patientEvaluations: PatientEvaluation[] = useMemo(() => store.getEvaluations(patient.id), [patient.id]);
  const selectedEvaluationId = store.getSelectedEvaluationId(patient.id);

  const selectedEvaluation = useMemo(() => {
    if (!selectedEvaluationId) return null;
    return store.getEvaluationById(selectedEvaluationId) ?? null;
  }, [selectedEvaluationId]);

  const canCreateDietaryEvaluation = patientEvaluations.length > 0 && !!selectedEvaluation;

  const [formData, setFormData] = useState<DietaryEvaluation>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    mealsPerDay: 5,
    excludedFoods: '',
    notes: '',
    recall: [],
    foodFrequency: {},
    foodFrequencyOthers: ''
  });

  useEffect(() => {
    if (editingId) {
      const existing = patient.dietaryEvaluations.find(e => e.id === editingId);
      if (existing) {
        setFormData(existing);
        // Buscar a qué evaluación pertenece por fecha
        const matchingEval = patientEvaluations.find(ev => ev.date === existing.date);
        setFormEvaluationId(matchingEval?.id ?? selectedEvaluationId);
      }
      return;
    }
    setFormEvaluationId(selectedEvaluationId);
    setEvalSelectorOpen(false);
    setFormData({
      id: Math.random().toString(36).substring(7),
      date: selectedEvaluation?.date ?? new Date().toISOString().split('T')[0],
      mealsPerDay: 5,
      excludedFoods: '',
      notes: '',
      recall: [],
      foodFrequency: {},
      foodFrequencyOthers: ''
    });
  }, [editingId, patient.dietaryEvaluations, selectedEvaluation?.date]);

  const updateDietary = (field: string, value: any) => {
    onUpdate({ ...patient, dietary: { ...patient.dietary, [field]: value } });
  };

  const handleSave = () => {
    if (!formEvaluationId) {
      alert('Primero selecciona una evaluación.');
      return;
    }
    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) {
      alert('Evaluación no encontrada.');
      return;
    }
    const normalizedForm: DietaryEvaluation = { ...formData, date: ev.date };
    let updatedEvaluations = [...patient.dietaryEvaluations];
    if (editingId) {
      updatedEvaluations = updatedEvaluations.map(e => e.id === editingId ? normalizedForm : e);
    } else {
      updatedEvaluations = [normalizedForm, ...updatedEvaluations];
    }
    onUpdate({ ...patient, dietaryEvaluations: updatedEvaluations });
    store.updatePatient({ ...patient, dietaryEvaluations: updatedEvaluations });
    setView('list');
    setEditingId(null);
    setEvalSelectorOpen(false);
  };

  const handleSelectEvaluationFromDropdown = (evId: string) => {
    store.setSelectedEvaluationId(patient.id, evId || null);
    setView(v => v);
  };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <SectionHeader icon={Utensils} title="Perfil Dietético Actual" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernTextArea label="Preferencias y Aversiones" value={patient.dietary.preferences} onChange={(e: any) => updateDietary('preferences', e.target.value)} rows={4} />
            <ModernTextArea label="Notas Adicionales" value={patient.dietary.notes} onChange={(e: any) => updateDietary('notes', e.target.value)} rows={4} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Utensils className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Historial de Evaluaciones Dietéticas</h3>
                <p className="text-xs text-slate-400">El registro dietético se asignará a la evaluación que elijas.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full lg:w-auto">
              <div className="w-full sm:w-[320px]">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Elegir evaluación</label>
                <select
                  value={selectedEvaluationId ?? ''}
                  onChange={(e) => handleSelectEvaluationFromDropdown(e.target.value)}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                  disabled={patientEvaluations.length === 0}
                >
                  {patientEvaluations.length === 0 ? (
                    <option value="">Crea una evaluación primero</option>
                  ) : (
                    <>
                      <option value="">Seleccionar...</option>
                      {patientEvaluations.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title ?? ev.date} — {ev.date}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={() => { setEditingId(null); setView('edit'); }}
                disabled={!canCreateDietaryEvaluation}
                className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 h-[42px] ${
                  canCreateDietaryEvaluation
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                }`}
                title={!canCreateDietaryEvaluation ? 'Crea y selecciona una evaluación primero.' : ''}
              >
                <Plus className="w-4 h-4" /> Nueva evaluación dietética
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patient.dietaryEvaluations.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay evaluaciones dietéticas registradas.</p>
            </div>
          ) : (
            patient.dietaryEvaluations.map((evalItem) => (
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
  }

  return (
    <DietaryForm
      formData={formData}
      setFormData={setFormData}
      patientEvaluations={patientEvaluations}
      formEvaluationId={formEvaluationId}
      setFormEvaluationId={setFormEvaluationId}
      evalSelectorOpen={evalSelectorOpen}
      setEvalSelectorOpen={setEvalSelectorOpen}
      onCancel={() => setView('list')}
      onSave={handleSave}
    />
  );
};