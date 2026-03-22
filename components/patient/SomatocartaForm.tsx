import React, { useEffect, useMemo, useState } from 'react';
import type { Patient, PatientEvaluation, SomatotypeRecord } from '../../types';
import { store } from '../../services/store';
import { GridInput } from './SharedComponents';
import { EvaluationLink } from './EvaluationLink';

export type SomatocartaFormValues = { x: string; y: string };

export const SomatocartaForm: React.FC<{
  patient: Patient;
  patientEvaluations: PatientEvaluation[];
  editingId: string | null;        // id del SomatotypeRecord — null = crear nuevo
  onSavePatient: (updated: Patient) => void;
  onCancel: () => void;
}> = ({ patient, patientEvaluations, editingId, onSavePatient, onCancel }) => {

  // --- resolver record existente por id ---
  const existingRecord = useMemo<SomatotypeRecord | null>(() => {
    if (!editingId) return null;
    return (patient.somatotypes || []).find(s => s.id === editingId) ?? null;
  }, [editingId, patient.somatotypes]);

  // --- evaluación vinculada ---
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

  // --- valores del form ---
  const [values, setValues] = useState<SomatocartaFormValues>({
    x: existingRecord ? String(existingRecord.x) : '',
    y: existingRecord ? String(existingRecord.y) : '',
  });

  // re-inicializar si cambia editingId
  useEffect(() => {
    const rec = editingId
      ? (patient.somatotypes || []).find(s => s.id === editingId) ?? null
      : null;

    setValues({
      x: rec ? String(rec.x) : '',
      y: rec ? String(rec.y) : '',
    });

    if (rec) {
      const match = patientEvaluations.find(e => e.date === rec.date);
      setEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id));
    } else {
      setEvaluationId(store.getSelectedEvaluationId(patient.id));
    }
  }, [editingId]);

  const handleSave = async () => {
    if (!values.x || !values.y) return;
    const xVal = parseFloat(values.x);
    const yVal = parseFloat(values.y);

    let updatedSomatotypes: SomatotypeRecord[];
    let recordToSave: SomatotypeRecord;

    if (existingRecord) {
      // ✅ EDITAR — reemplaza solo el record con ese id
      recordToSave = { ...existingRecord, linkedEvaluationId: evaluationId || '', date: linkedDate, x: xVal, y: yVal };
      updatedSomatotypes = (patient.somatotypes || []).map(s =>
        s.id === existingRecord.id ? recordToSave : s
      );
    } else {
      // ✅ CREAR NUEVO — siempre agrega, nunca sobreescribe
      recordToSave = {
        id: Math.random().toString(36).substring(7),
        linkedEvaluationId: evaluationId || '',
        date: linkedDate,
        x: xVal,
        y: yVal,
      };
      updatedSomatotypes = [recordToSave, ...(patient.somatotypes || [])];
    }

    if (evaluationId) {
      try {
        await store.saveSomatotype(evaluationId, recordToSave);
        onSavePatient({ ...patient, somatotypes: updatedSomatotypes });
      } catch (error) {
        console.error('Error saving somatotype to Supabase:', error);
      }
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
      <EvaluationLink
        patientId={patient.id}
        patientEvaluations={patientEvaluations}
        evaluationId={evaluationId}
        onChangeEvaluationId={setEvaluationId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <GridInput
          label="Coordenada X"
          type="number"
          placeholder="-1.5"
          value={values.x}
          onChange={(e: any) => setValues({ ...values, x: e.target.value })}
        />
        <GridInput
          label="Coordenada Y"
          type="number"
          placeholder="4.2"
          value={values.y}
          onChange={(e: any) => setValues({ ...values, y: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-white transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          {existingRecord ? 'Guardar Cambios' : 'Guardar Somatotipo'}
        </button>
      </div>
    </div>
  );
};