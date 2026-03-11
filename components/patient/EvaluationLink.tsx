import React, { useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import type { PatientEvaluation } from '../../types';
import { store } from '../../services/store';

export const EvaluationLink: React.FC<{
  patientId: string;
  patientEvaluations: PatientEvaluation[];

  /** Controlled selected evaluation id */
  evaluationId: string | null;
  onChangeEvaluationId: (id: string | null) => void;

  /** UI */
  label?: string; // default: "Evaluación Asignada"
  disabled?: boolean;
}> = ({
  patientId,
  patientEvaluations,
  evaluationId,
  onChangeEvaluationId,
  label = 'Evaluación Asignada',
  disabled = false
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);

  const evaluation = useMemo(() => {
    if (!evaluationId) return null;
    return store.getEvaluationById(evaluationId) ?? null;
  }, [evaluationId]);

  const linkedDate =
    evaluation?.date ??
    (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

  const handlePick = (evId: string) => {
    const id = evId || null;
    onChangeEvaluationId(id);

    // keep store selected evaluation in sync (same behavior as other sections)
    if (id) store.setSelectedEvaluationId(patientId, id);

    setSelectorOpen(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>

      {!selectorOpen ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">
            {evaluation ? `${evaluation.title ?? evaluation.date} — ${evaluation.date}` : '—'}
          </span>

          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            disabled={disabled}
            className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            title="Cambiar Evaluación Asignada"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={evaluationId ?? ''}
            onChange={(e) => handlePick(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 w-full"
            autoFocus
            disabled={disabled || patientEvaluations.length === 0}
          >
            {patientEvaluations.length === 0 ? (
              <option value="">Crea Una Evaluación Primero</option>
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
            onClick={() => setSelectorOpen(false)}
            className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Fecha De Evaluación</p>
        <input
          type="date"
          value={linkedDate}
          disabled
          readOnly
          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600 outline-none cursor-not-allowed"
        />
      </div>
    </div>
  );
};