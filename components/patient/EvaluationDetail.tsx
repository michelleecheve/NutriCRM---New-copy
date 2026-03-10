import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Pencil, Save, Trash2, Utensils, ArrowLeft } from 'lucide-react';
import { store } from '../../services/store';
import { DietaryCard } from './DietaryCard';
import { DietaryForm } from './DietaryForm';
import type { DietaryEvaluation, Patient, PatientEvaluation } from '../../types';

type Draft = {
  title: string;
  date: string;
};

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="font-extrabold text-slate-900 text-lg">{title}</p>
      </div>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
        >
          Sí, eliminar
        </button>
      </div>
    </div>
  </div>
);

export const EvaluationDetail: React.FC<{
  patient: Patient;
  evaluationId: string;

  // para mantener EXACTA la mecánica de selección por pacienteId que ya usas
  patientId: string;

  onUpdate: (p: Patient) => void;

  onBack: () => void;
}> = ({ patient, evaluationId, patientId, onUpdate, onBack }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Dietética embebida
  const [dietaryView, setDietaryView] = useState<'card' | 'edit'>('card');
  const [formEvaluationId, setFormEvaluationId] = useState<string | null>(null);
  const [evalSelectorOpen, setEvalSelectorOpen] = useState(false);
  const [dietaryFormData, setDietaryFormData] = useState<DietaryEvaluation>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    mealsPerDay: 5,
    excludedFoods: '',
    notes: '',
    recall: [],
    foodFrequency: {},
    foodFrequencyOthers: ''
  });

  const selected = useMemo(() => store.getEvaluationById(evaluationId) ?? null, [evaluationId]);

  const patientEvaluations: PatientEvaluation[] = useMemo(() => store.getEvaluations(patient.id), [patient.id]);

  const linkedDietary = useMemo(() => {
    if (!selected) return null;
    return patient.dietaryEvaluations.find(d => d.date === selected.date) ?? null;
  }, [patient.dietaryEvaluations, selected?.date]);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      setErrorMsg('');
      return;
    }

    setDraft({
      title: selected.title ?? `Evaluación ${selected.date}`,
      date: selected.date,
    });
    setErrorMsg('');

    setDietaryView('card');
    setEvalSelectorOpen(false);
    setFormEvaluationId(selected.id);

    if (linkedDietary) {
      setDietaryFormData(linkedDietary);
    } else {
      setDietaryFormData({
        id: Math.random().toString(36).substring(7),
        date: selected.date,
        mealsPerDay: 5,
        excludedFoods: '',
        notes: '',
        recall: [],
        foodFrequency: {},
        foodFrequencyOthers: ''
      });
    }
  }, [selected?.id]);

  const hasChanges = useMemo(() => {
    if (!selected || !draft) return false;
    const t = selected.title ?? `Evaluación ${selected.date}`;
    return draft.title !== t || draft.date !== selected.date;
  }, [selected, draft]);

  const handleSave = () => {
    if (!selected || !draft) return;
    setErrorMsg('');
    try {
      store.updateEvaluation(selected.id, {
        title: draft.title?.trim() ? draft.title.trim() : undefined,
        date: draft.date,
      });
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'No se pudo guardar la evaluación.');
    }
  };

  const handleDeleteConfirmed = () => {
    if (!selected) return;
    store.deleteEvaluation(selected.id);
    setConfirmOpen(false);
    setDraft(null);
    setErrorMsg('');
    // limpiamos la selección (mismo comportamiento que antes al borrar)
    store.setSelectedEvaluationId(patientId, null);
    onBack();
  };

  const handleSaveDietary = () => {
    if (!selected) return;
    if (!formEvaluationId) {
      alert('Primero selecciona una evaluación.');
      return;
    }

    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) {
      alert('Evaluación no encontrada.');
      return;
    }

    const normalizedForm: DietaryEvaluation = { ...dietaryFormData, date: ev.date };

    const exists = patient.dietaryEvaluations.some(d => d.date === ev.date);
    const updatedDietaryEvaluations = exists
      ? patient.dietaryEvaluations.map(d => (d.date === ev.date ? normalizedForm : d))
      : [normalizedForm, ...patient.dietaryEvaluations];

    const updatedPatient: Patient = { ...patient, dietaryEvaluations: updatedDietaryEvaluations };
    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);

    setDietaryView('card');
    setEvalSelectorOpen(false);
  };

  if (!selected || !draft) {
    return (
      <div className="h-full min-h-[220px] border border-slate-100 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8">
        <p className="font-bold">Evaluación no encontrada</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    );
  }

  return (
    <>
      {confirmOpen && (
        <ConfirmModal
          title="Eliminar evaluación"
          message={`¿Seguro que deseas eliminar "${selected.title ?? selected.date}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div className="border border-slate-200 rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al historial
            </button>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Evaluación seleccionada
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-slate-300 shrink-0" />
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Título de la evaluación"
                className="w-full text-xl font-extrabold text-slate-900 bg-transparent outline-none border-b border-transparent focus:border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                hasChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</p>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluation ID</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-800 break-all">{selected.id}</p>
          </div>
        </div>

        {/* ✅ Dietética */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Utensils className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluación dietética</p>
                <p className="text-[12px] text-slate-400">
                  Se vincula por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDietaryView('edit')}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              {linkedDietary ? 'Editar' : 'Crear'}
            </button>
          </div>

          {dietaryView === 'edit' ? (
            <DietaryForm
              formData={dietaryFormData}
              setFormData={setDietaryFormData}
              patientEvaluations={patientEvaluations}
              formEvaluationId={formEvaluationId}
              setFormEvaluationId={setFormEvaluationId}
              evalSelectorOpen={evalSelectorOpen}
              setEvalSelectorOpen={setEvalSelectorOpen}
              onCancel={() => setDietaryView('card')}
              onSave={handleSaveDietary}
            />
          ) : linkedDietary ? (
            <DietaryCard evalItem={linkedDietary} onClick={() => setDietaryView('edit')} />
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-sm">
              No hay evaluación dietética para esta fecha. Presiona <span className="font-bold">Crear</span> para agregarla.
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-slate-400">
          Cada registro de las otras pestañas deberá guardarse con este <span className="font-mono">evaluationId</span>.
        </div>
      </div>
    </>
  );
};