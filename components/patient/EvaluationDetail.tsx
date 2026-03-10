import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Save, Trash2, Utensils, ArrowLeft, Calculator, Microscope, Image as ImageIcon, BookOpen } from 'lucide-react';
import { store } from '../../services/store';
import { DietaryCard } from './DietaryCard';
import { DietaryForm } from './DietaryForm';
import { NewMeasurementForm } from './NewMeasurementForm';
import { FileGallery } from './FileGallery';
import { MenuAddRead } from './MenuAddRead';
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
  patientId: string;
  onUpdate: (p: Patient) => void;
  onBack: () => void;
}> = ({ patient, evaluationId, patientId, onUpdate, onBack }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  // ✅ menu state (embed MenuAddRead)
  const [menuView, setMenuView] = useState<'card' | 'edit'>('card');
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  const selected = useMemo(() => store.getEvaluationById(evaluationId) ?? null, [evaluationId]);

  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  const linkedDietary = useMemo(() => {
    if (!selected) return null;
    return patient.dietaryEvaluations.find(d => d.date === selected.date) ?? null;
  }, [patient.dietaryEvaluations, selected?.date]);

  // ✅ vincular labs/fotos por fecha
  const linkedLabs = useMemo(() => {
    if (!selected) return [];
    return (patient.labs || []).filter((f: any) => f?.date === selected.date);
  }, [patient.labs, selected?.date]);

  const linkedPhotos = useMemo(() => {
    if (!selected) return [];
    return (patient.photos || []).filter((f: any) => f?.date === selected.date);
  }, [patient.photos, selected?.date]);

  // ✅ vincular menú por fecha (preferencia: linkedEvaluationId, fallback por basedOnMeasurementDate)
  const linkedMenu = useMemo(() => {
    if (!selected) return null;
    const allMenus: any[] = [...(patient.menus || []), ...(patient.dietary?.menus || [])];

    // 1) preferir menu.linkedEvaluationId
    const byEvalId = allMenus.find(m => (m as any)?.linkedEvaluationId === selected.id);
    if (byEvalId) return byEvalId;

    // 2) fallback por fecha
    const byDate = allMenus.find(m => (m as any)?.basedOnMeasurementDate === selected.date);
    return byDate ?? null;
  }, [patient.menus, patient.dietary?.menus, selected?.id, selected?.date]);

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

    // ✅ init menu section
    setMenuView('card');
    setEditingMenuId(linkedMenu?.id ?? null);
  }, [selected?.id, linkedMenu?.id]);

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
    store.setSelectedEvaluationId(patientId, null);
    onBack();
  };

  const handleSaveDietary = () => {
    if (!selected) return;
    if (!formEvaluationId) return;

    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) return;

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

  // ✅ Persistencia correcta: fusionar "archivos de esta fecha" con "archivos de otras fechas"
  const handleUpdateLabsForThisEvaluation = (newFilesForThisDate: any[]) => {
    if (!selected) return;

    const rest = (patient.labs || []).filter((f: any) => f?.date !== selected.date);
    const updatedPatient: Patient = { ...patient, labs: [...newFilesForThisDate, ...rest] };

    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);
  };

  const handleUpdatePhotosForThisEvaluation = (newFilesForThisDate: any[]) => {
    if (!selected) return;

    const rest = (patient.photos || []).filter((f: any) => f?.date !== selected.date);
    const updatedPatient: Patient = { ...patient, photos: [...newFilesForThisDate, ...rest] };

    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);
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

      <div className="space-y-6">
        {/* Card 1 */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al historial
              </button>

              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-slate-300 shrink-0" />
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Título de la evaluación"
                  className="w-full text-xl font-bold text-slate-900 bg-transparent outline-none border-b border-slate-100 focus:border-slate-300 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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

          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</p>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluation ID</p>
                <p className="mt-2 font-mono text-sm font-bold text-slate-700 break-all border border-slate-200 rounded-xl px-3 py-2 bg-white">
                  {selected.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Utensils className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Evaluación dietética</p>
                <p className="text-xs text-slate-500">
                  Vinculada por fecha: <span className="font-mono font-bold">{selected.date}</span>
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
              showDelete={false}
            />
          ) : linkedDietary ? (
            <DietaryCard evalItem={linkedDietary} onClick={() => setDietaryView('edit')} />
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
              No hay evaluación dietética para esta fecha. Presiona <span className="font-bold">Crear</span> para agregarla.
            </div>
          )}
        </div>

        {/* Card 3: Antropometría */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Medidas antropométricas</p>
                <p className="text-xs text-slate-500">
                  Vinculadas por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
          </div>

          <NewMeasurementForm
            patient={patient}
            onUpdate={onUpdate}
            onViewChange={() => {}}
            showDelete={false}
          />
        </div>

        {/* ✅ Card 4: Menú (debajo de medidas) */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Menú</p>
                <p className="text-xs text-slate-500">
                  Vinculado por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingMenuId(linkedMenu?.id ?? null);
                setMenuView('edit');
              }}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              {linkedMenu ? 'Editar' : 'Crear'}
            </button>
          </div>

          {menuView === 'edit' ? (
            <MenuAddRead
              patient={patient}
              onUpdate={onUpdate}
              editingMenuId={editingMenuId}
              onClose={() => {
                setMenuView('card');
                // refrescar id en base al store/patient (se recalcula en memo en el siguiente render)
              }}
            />
          ) : linkedMenu ? (
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {linkedMenu.name ?? 'Menú'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fecha: <span className="font-mono font-bold">{(linkedMenu as any).basedOnMeasurementDate ?? selected.date}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMenuId(linkedMenu.id);
                    setMenuView('edit');
                  }}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Ver / Editar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
              No hay menú para esta fecha. Presiona <span className="font-bold">Crear</span> para agregarlo.
            </div>
          )}
        </div>

        {/* Card 5: Labs */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Microscope className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Laboratorios</p>
                <p className="text-xs text-slate-500">
                  Vinculados por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
          </div>

          <FileGallery
            patientId={patient.id}
            files={linkedLabs}
            onUpdate={handleUpdateLabsForThisEvaluation}
            title="Resultados de Laboratorio"
            icon={Microscope}
            accept="application/pdf,image/*"
            showDelete={false}
          />
        </div>

        {/* Card 6: Fotos */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Fotos de progreso</p>
                <p className="text-xs text-slate-500">
                  Vinculadas por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
          </div>

          <FileGallery
            patientId={patient.id}
            files={linkedPhotos}
            onUpdate={handleUpdatePhotosForThisEvaluation}
            title="Galería de Progreso"
            icon={ImageIcon}
            accept="image/*"
            showDelete={false}
          />
        </div>
      </div>
    </>
  );
};