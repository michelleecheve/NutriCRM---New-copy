import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Measurement, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import {
  Plus, Save, Trash2, ChevronRight, History, Calculator, Info,
  Star, Pencil, X, AlertTriangle
} from 'lucide-react';
import { GridInput } from './SharedComponents';
import { calculateAnthropometry } from '../../services/MeasurementsFormulas';

const DIAGNOSTIC_OPTIONS = [
  "% de grasa adecuado, buen desarrollo muscular, EN normal según IMC",
  "% de grasa adecuado, bajo desarrollo muscular, EN normal según IMC",
  "% de grasa elevado, buen desarrollo muscular, EN normal según IMC",
  "% de grasa bajo, buen desarrollo muscular, EN normal según IMC",
  "% de grasa adecuado, desarrollo muscular elevado, EN sobrepeso según IMC",
  "Deshidratado",
  "Bien hidratado",
  "Hidratado",
  "Peso corporal total adecuado para etapa",
  "Peso corporal total alto para etapa",
  "Peso corporal total bajo para etapa",
  "Sobrepeso según IMC, % de grasa elevado y desarrollo muscular adecuado",
  "Obesidad según IMC, % de grasa elevado y desarrollo muscular adecuado",
  "Obesidad según IMC, % de grasa y desarrollo muscular elevado.",
  "Bajo peso para estatura según percentiles OMS",
  "Peso normal para estatura según percentiles OMS",
  "Sobrepeso para estatura según percentiles OMS",
  "% de grasa bajo, bajo desarrollo muscular, EN bajo peso según IMC",
  "% de grasa elevado, desarrollo muscular elevado, EN obesidad según IMC",
  "% de grasa adecuado, bajo desarrollo muscular, EN bajo peso según IMC"
];

// ✅ Quitamos date del grid manual: ahora se vincula desde evaluación asignada
const FORM_SECTIONS: any[] = [
  {
    title: 'DATOS GENERALES',
    fields: [
      { key: 'gender', label: 'Género', isSelect: true, options: ['M', 'F'], isManual: true },
      { key: 'age', label: 'Edad', type: 'number', isManual: true },
      { key: 'weight', label: 'Peso (kg)', type: 'number', isManual: true },
      { key: 'height', label: 'Talla (cm)', type: 'number', isManual: true },
      { key: 'metaComplied', label: 'Meta Cumplida', isStar: true, isManual: true },
    ]
  },
  {
    title: 'PLIEGUES CUTÁNEOS (MM)',
    fields: [
      { key: 'biceps', label: 'Bíceps', type: 'number', isManual: true },
      { key: 'triceps', label: 'Tríceps', type: 'number', isManual: true },
      { key: 'subscapular', label: 'Subescapular', type: 'number', isManual: true },
      { key: 'supraspinal', label: 'Supraespinal', type: 'number', isManual: true },
      { key: 'abdomen', label: 'Abdomen', type: 'number', isManual: true },
      { key: 'thigh', label: 'Muslo', type: 'number', isManual: true },
      { key: 'calf', label: 'Pantorrilla', type: 'number', isManual: true },
      { key: 'iliacCrest', label: 'Cresta Ilíaca', type: 'number', isManual: true },
      { key: 'skinfoldSum', label: 'SUM. PLIEGUES', isCalculated: true, formula: 'Suma de los 8 pliegues' },
    ]
  },
  {
    title: 'DIÁMETROS ÓSEOS (CM)',
    fields: [
      { key: 'wrist', label: 'Muñeca', type: 'number', isManual: true },
      { key: 'humerus', label: 'Húmero', type: 'number', isManual: true },
      { key: 'femur', label: 'Fémur', type: 'number', isManual: true },
    ]
  },
  {
    title: 'PERÍMETROS CORPORALES (CM)',
    fields: [
      { key: 'armRelaxed', label: 'Brazo', type: 'number', isManual: true },
      { key: 'armContracted', label: 'Brazo cont.', type: 'number', isManual: true },
      { key: 'calfGirth', label: 'Pantorrilla', type: 'number', isManual: true },
      { key: 'waist', label: 'Cintura', type: 'number', isManual: true },
      { key: 'umbilical', label: 'Umbilical', type: 'number', isManual: true },
      { key: 'hip', label: 'Cadera', type: 'number', isManual: true },
      { key: 'abdominalLow', label: '3 cm abajo umb.', type: 'number', isManual: true },
      { key: 'thighRight', label: 'Muslo der.', type: 'number', isManual: true },
      { key: 'thighLeft', label: 'Muslo izq.', type: 'number', isManual: true },
    ]
  },
  {
    title: 'COMPOSICIÓN CORPORAL',
    fields: [
      { key: 'imc', label: 'IMC', isCalculated: true, formula: 'Peso / (Talla/100)²' },
      { key: 'bodyFat', label: '% Grasa', isCalculated: true, formula: 'M: (Σ 6 Pliegues * 0.097) + 3.64 | F: (Σ 6 Pliegues * 0.143) + 4.56' },
      { key: 'fatKg', label: 'Peso Grasa (kg)', isCalculated: true, formula: '(% Grasa * Peso) / 100' },
      { key: 'leanMassKg', label: 'Peso Libre de Grasa (kg)', isCalculated: true, formula: 'Peso - Peso Grasa' },
      { key: 'leanMassPct', label: '% Peso Libre de Grasa', isCalculated: true, formula: '(Peso Libre Grasa / Peso) * 100' },
      { key: 'aks', label: 'AKS', isCalculated: true, formula: '(Peso Libre Grasa * 1000) / (Talla³ * 0.01)' },
      { key: 'boneMass', label: 'Masa Ósea (kg)', isCalculated: true, formula: '3.02 * ((Talla² * Muñeca * Húmero * 4) / 10⁶)^0.712' },
      { key: 'residualMass', label: 'PesRES (kg)', isCalculated: true, formula: 'M: Peso * 0.241 | F: Peso * 0.209' },
      { key: 'muscleKg', label: 'Peso Músculo (kg)', isCalculated: true, formula: 'Peso - (Masa Ósea + Peso Grasa + PesRES)' },
    ]
  },
  {
    title: 'SOMATOTIPO',
    fields: [
      { key: 'endomorfo', label: 'Endomorfo', isCalculated: true, formula: 'Carter & Heath (1990) - Coef: 0.145' },
      { key: 'mesomorfo', label: 'Mesomorfo', isCalculated: true, formula: 'Carter & Heath (1990)' },
      { key: 'ectomorfo', label: 'Ectomorfo', isCalculated: true, formula: 'Carter & Heath (1990) - 2 Rangos' },
      { key: 'x', label: 'X', isCalculated: true, formula: 'Ecto - Endo' },
      { key: 'y', label: 'Y', isCalculated: true, formula: '(2 * Meso) - (Endo + Ecto)' },
    ]
  },
  {
    title: 'DIAGNÓSTICO NUTRICIONAL',
    fields: [
      { key: 'diagnosticN', label: 'Diagnóstico N', isSelect: true, options: DIAGNOSTIC_OPTIONS, isManual: true, isFullWidth: true },
      { key: 'subjectiveValuation', label: 'Valoración Subjetiva (1-10)', type: 'number', isManual: true, isFullWidth: true },
    ]
  }
];

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmText = 'Sí, eliminar', cancelText = 'Cancelar', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const InfoModal: React.FC<{
  title: string;
  message: string;
  onClose: () => void;
}> = ({ title, message, onClose }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const NewMeasurementForm: React.FC<{
  patient: Patient;
  onUpdate: (p: Patient) => void;
  onViewChange?: (view: 'list' | 'detail' | 'new') => void;
  showDelete?: boolean; // ✅ para ocultar en EvaluationDetail
}> = ({ patient, onUpdate, onViewChange, showDelete = true }) => {
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ Evaluación asignada
  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  const [formEvaluationId, setFormEvaluationId] = useState<string | null>(
    store.getSelectedEvaluationId(patient.id)
  );
  const [evalSelectorOpen, setEvalSelectorOpen] = useState(false);

  const formEvaluation = useMemo(() => {
    if (!formEvaluationId) return null;
    return store.getEvaluationById(formEvaluationId) ?? null;
  }, [formEvaluationId]);

  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  const [formData, setFormData] = useState<Measurement>({
    date: store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0],
    metaComplied: false,
    weight: 0,
    height: 0
  });

  // ✅ Modales
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // Si cambia la evaluación asignada, arrastrar su date al measurement
  useEffect(() => {
    if (!formEvaluation) return;
    setFormData(prev => ({ ...prev, date: formEvaluation.date }));
  }, [formEvaluation?.date]);

  const handleFieldChange = (key: keyof Measurement, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(calculateAnthropometry(updated));
  };

  const handleSave = () => {
    if (!formEvaluationId) {
      setInfoModal({ title: 'Falta evaluación', message: 'Primero selecciona una evaluación.' });
      return;
    }
    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) {
      setInfoModal({ title: 'Evaluación no encontrada', message: 'La evaluación seleccionada no existe o fue eliminada.' });
      return;
    }

    const normalized: Measurement = calculateAnthropometry({ ...formData, date: ev.date });

    let newMeasurements = [...patient.measurements];
    if (editingId) {
      newMeasurements = newMeasurements.map(m => m.date === editingId ? normalized : m);
    } else {
      newMeasurements.push(normalized);
    }

    onUpdate({ ...patient, measurements: newMeasurements });
    store.updatePatient({ ...patient, measurements: newMeasurements });
    setView('list');
    setEditingId(null);
    setEvalSelectorOpen(false);
  };

  const handleDeleteConfirmed = () => {
    const newMeasurements = patient.measurements.filter(m => m.date !== editingId);
    onUpdate({ ...patient, measurements: newMeasurements });
    store.updatePatient({ ...patient, measurements: newMeasurements });
    setView('list');
    setEditingId(null);
    setEvalSelectorOpen(false);
    setConfirmDeleteOpen(false);
  };

  const handleDelete = () => {
    setConfirmDeleteOpen(true);
  };

  const handleEdit = (m: Measurement) => {
    setFormData(m);
    setEditingId(m.date);
    setView('detail');

    const match = patientEvaluations.find(e => e.date === m.date);
    setFormEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id));
    setEvalSelectorOpen(false);
  };

  const handleNew = () => {
    const defaultEvalId = store.getSelectedEvaluationId(patient.id);
    const defaultEval = defaultEvalId ? store.getEvaluationById(defaultEvalId) : null;

    setFormEvaluationId(defaultEvalId ?? null);
    setEvalSelectorOpen(false);

    setFormData({
      date: defaultEval?.date ?? (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]),
      metaComplied: false,
      weight: 0,
      height: 0
    });
    setEditingId(null);
    setView('new');
  };

  const handleChangeFormEvaluation = (evId: string) => {
    const ev = store.getEvaluationById(evId);
    setFormEvaluationId(evId || null);
    if (ev) setFormData(prev => calculateAnthropometry({ ...prev, date: ev.date }));
    setEvalSelectorOpen(false);
  };

  if (view === 'detail' || view === 'new') {
    return (
      <>
        {infoModal && (
          <InfoModal
            title={infoModal.title}
            message={infoModal.message}
            onClose={() => setInfoModal(null)}
          />
        )}

        {confirmDeleteOpen && (
          <ConfirmModal
            title="Eliminar registro"
            message="¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer."
            onCancel={() => setConfirmDeleteOpen(false)}
            onConfirm={handleDeleteConfirmed}
          />
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('list')}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                title="Volver"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  {view === 'detail' ? 'Detalle del Registro' : 'Nuevo Registro Antropométrico'}
                </h3>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('list')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" /> Guardar Registro
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Vinculación */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Evaluación asignada</p>

                {!evalSelectorOpen ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">
                      {formEvaluation ? `${formEvaluation.title ?? formEvaluation.date} — ${formEvaluation.date}` : '—'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEvalSelectorOpen(true)}
                      className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                      title="Cambiar evaluación asignada"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={formEvaluationId ?? ''}
                      onChange={(e) => handleChangeFormEvaluation(e.target.value)}
                      className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                      autoFocus
                      disabled={patientEvaluations.length === 0}
                    >
                      {patientEvaluations.length === 0 ? (
                        <option value="">Crea una evaluación primero</option>
                      ) : (
                        <>
                          <option value="">Seleccionar...</option>
                          {patientEvaluations.map(ev => (
                            <option key={ev.id} value={ev.id}>
                              {ev.title ?? ev.date} — {ev.date}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setEvalSelectorOpen(false)}
                      className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    disabled
                    readOnly
                    className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600 outline-none cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-9">
                  <p className="text-xs text-slate-400 mt-8">
                    La fecha se toma automáticamente de la evaluación asignada.
                  </p>
                </div>
              </div>
            </div>

            {FORM_SECTIONS.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {section.fields.map((field: any) => {
                    const fieldWrapperClass = field.isFullWidth ? "col-span-full" : "";

                    if (field.isCalculated) {
                      const val = (formData as any)[field.key];
                      const displayVal = (val === undefined || val === null || isNaN(val)) ? '-' : val.toFixed(3);
                      return (
                        <div key={field.key} className={`bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 ${fieldWrapperClass}`}>
                          <label className="text-xs font-bold text-emerald-800 mb-1 block uppercase">{field.label}</label>
                          <div className="text-lg font-bold text-emerald-700">{displayVal}</div>
                          <div className="text-[10px] text-emerald-600/60 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" /> {field.formula}
                          </div>
                        </div>
                      );
                    }

                    if (field.isStar) {
                      const isChecked = !!(formData as any)[field.key];
                      return (
                        <div key={field.key} className={`flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 ${fieldWrapperClass}`}>
                          <button
                            onClick={() => handleFieldChange(field.key, !isChecked)}
                            className="focus:outline-none group transition-transform hover:scale-110"
                          >
                            <Star className={`w-6 h-6 transition-colors ${isChecked ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 group-hover:text-yellow-200'}`} />
                          </button>
                          <label className="text-sm font-bold text-slate-700">{field.label}</label>
                        </div>
                      );
                    }

                    if (field.isSelect) {
                      return (
                        <div key={field.key} className={`flex flex-col ${fieldWrapperClass}`}>
                          <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase">{field.label}</label>
                          <select
                            value={(formData as any)[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          >
                            <option value="">Seleccionar...</option>
                            {field.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <div key={field.key} className={fieldWrapperClass}>
                        <GridInput
                          label={field.label}
                          type={field.type}
                          value={(formData as any)[field.key] ?? ''}
                          onChange={(e: any) =>
                            handleFieldChange(
                              field.key,
                              field.type === 'number' ? parseFloat(e.target.value) : e.target.value
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-between items-center">
            {view === 'detail' && showDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors ml-auto md:ml-0"
              >
                <Trash2 className="w-4 h-4" /> Eliminar Registro
              </button>
            ) : <div></div>}

            <div className="flex gap-3">
              <button onClick={() => setView('list')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" /> Guardar Registro
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Historial de Registros</h3>
            <p className="text-xs text-slate-400">Haga clic en un registro para ver detalles</p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Nuevo Registro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Peso</th>
                <th className="px-6 py-4">Talla</th>
                <th className="px-6 py-4">IMC</th>
                <th className="px-6 py-4 text-center">Meta</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patient.measurements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No hay registros antropométricos aún.</p>
                  </td>
                </tr>
              ) : (
                [...patient.measurements]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((m) => (
                    <tr
                      key={m.date}
                      onClick={() => handleEdit(m)}
                      className="group hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-1.5 rounded group-hover:bg-emerald-100 transition-colors">
                            <Calculator className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                          </div>
                          <span className="font-bold text-slate-700">
                            {new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{m.weight} kg</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{m.height} cm</td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-600 font-bold">{m.imc || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {m.metaComplied ? (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <span className="text-slate-200">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};