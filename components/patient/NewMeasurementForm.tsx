import React, { useEffect, useMemo, useState } from 'react';
import { Patient, Measurement, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import {
  Save, Trash2, ChevronRight, Calculator, Info,
  Star, X, AlertTriangle
} from 'lucide-react';
import { GridInput } from './SharedComponents';
import { EvaluationLink } from './EvaluationLink';
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
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, onConfirm, onCancel }) => (
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
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">
            Sí, eliminar
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
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800">
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
  // ✅ editingId ahora es el id del Measurement (no la fecha)
  // null = crear nuevo
  editingId: string | null;
  onClose: () => void;
  showDelete?: boolean;
}> = ({ patient, onUpdate, editingId, onClose, showDelete = true }) => {

  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  const existingRecord = useMemo<Measurement | null>(() => {
    if (!editingId) return null;
    return (
      patient.measurements.find(m => m.id === editingId) ??
      patient.measurements.find(m => m.date === editingId) ??
      null
    );
  }, [editingId, patient.measurements]);

  const isEditing = !!existingRecord;

  const [evaluationId, setEvaluationId] = useState<string | null>(() => {
    if (existingRecord) {
      const match = patientEvaluations.find(e => e.date === existingRecord.date);
      return match?.id ?? store.getSelectedEvaluationId(patient.id);
    }
    return store.getSelectedEvaluationId(patient.id);
  });

  const evaluation = useMemo(() => {
    if (!evaluationId) return null;
    return store.getEvaluationById(evaluationId) ?? null;
  }, [evaluationId]);

  const linkedDate =
    evaluation?.date ??
    (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

  const buildDefault = (): Measurement => ({
    id: crypto.randomUUID(),
    linkedEvaluationId: evaluationId || '',
    date: linkedDate,
    metaComplied: false,
    weight: 0,
    height: 0,
  });

  const [formData, setFormData] = useState<Measurement>(() =>
    existingRecord ? { ...existingRecord } : buildDefault()
  );

  useEffect(() => {
    const rec = editingId
      ? (patient.measurements.find(m => m.id === editingId) ??
         patient.measurements.find(m => m.date === editingId) ??
         null)
      : null;

    if (rec) {
      setFormData({ ...rec });
      const match = patientEvaluations.find(e => e.date === rec.date);
      setEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id));
    } else {
      const selId = store.getSelectedEvaluationId(patient.id);
      const selEv = selId ? store.getEvaluationById(selId) : null;
      setFormData({
        id: crypto.randomUUID(),
        linkedEvaluationId: selId || '',
        date: selEv?.date ?? (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]),
        metaComplied: false,
        weight: 0,
        height: 0,
      });
      setEvaluationId(selId);
    }
  }, [editingId, patient.measurements, patientEvaluations]);

  useEffect(() => {
    if (!evaluation) return;
    setFormData(prev => calculateAnthropometry({ ...prev, date: evaluation.date }));
  }, [evaluation?.date]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  const handleFieldChange = (key: keyof Measurement, value: any) => {
    setFormData(prev => calculateAnthropometry({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!evaluationId) {
      setInfoModal({ title: 'Falta evaluación', message: 'Primero selecciona una evaluación.' });
      return;
    }
    const ev = store.getEvaluationById(evaluationId);
    if (!ev) {
      setInfoModal({ title: 'Evaluación no encontrada', message: 'La evaluación seleccionada no existe o fue eliminada.' });
      return;
    }

    // 1. Mantener el ID original al editar; si creas, usa uno nuevo si no hay
    const normalized: Measurement = calculateAnthropometry({
      ...formData,
      date: ev.date,
      linkedEvaluationId: evaluationId || '',
      id: isEditing && existingRecord ? existingRecord.id : (formData.id || crypto.randomUUID()),
    });

    // 2. Reemplaza en memoria POR ID (no por fecha) al editar, o agrega si nuevo
    let updatedMeasurements: Measurement[];
    if (isEditing && existingRecord) {
      updatedMeasurements = patient.measurements.map(m =>
        m.id === existingRecord.id ? normalized : m
      );
    } else {
      // Evita duplicados si se crea con la misma fecha o datos
      updatedMeasurements = [normalized, ...patient.measurements.filter(m => m.id !== normalized.id)];
    }

    const updatedPatient = { ...patient, measurements: updatedMeasurements };

    // 3. Actualiza la UI primero (optimista)
    onUpdate(updatedPatient);

    try {
      // 4. Guarda en Supabase
      await store.updatePatient(updatedPatient);      // Actualiza al paciente
      await store.saveMeasurement(evaluationId, normalized); // Actualiza la tabla measurements
      onClose();
    } catch (error) {
      console.error('Error saving measurement:', error);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!editingId) return;
    const itemToDelete = patient.measurements.find(m => m.id === editingId || (!m.id && m.date === editingId));
    const updatedMeasurements = patient.measurements.filter(m => m.id !== editingId && m.date !== editingId);
    const updatedPatient = { ...patient, measurements: updatedMeasurements };
    onUpdate(updatedPatient);
    try {
      await store.updatePatient(updatedPatient);
      if (itemToDelete?.linkedEvaluationId) {
        await store.deleteMeasurement(itemToDelete.id);
      }
      setConfirmDeleteOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting measurement:', error);
    }
  };

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
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
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
                {isEditing ? 'Editar Registro Antropométrico' : 'Nuevo Registro Antropométrico'}
              </h3>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Guardar Registro
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* ✅ EvaluationLink — mismo componente que Somatocarta y Menu */}
          <div className="space-y-3">
            <EvaluationLink
              patientId={patient.id}
              patientEvaluations={patientEvaluations}
              evaluationId={evaluationId}
              onChangeEvaluationId={setEvaluationId}
            />
            <p className="text-xs text-slate-400 px-1">
              La fecha del registro se toma automáticamente de la evaluación asignada.
            </p>
          </div>

          {/* Secciones del form */}
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

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-between items-center">
          {isEditing && showDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar Registro
            </button>
          ) : <div />}

          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">
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
};