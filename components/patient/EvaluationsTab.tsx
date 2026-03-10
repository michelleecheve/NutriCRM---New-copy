import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Check } from 'lucide-react';
import { store } from '../../services/store';
import { SectionHeader } from './SharedComponents';
import type { Patient, PatientEvaluation } from '../../types';
import { EvaluationDetail } from './EvaluationDetail';

const todayStr = () => new Date().toISOString().split('T')[0];

export const EvaluationsTab: React.FC<{
  patientId: string;
  patient: Patient;
  onUpdate: (p: Patient) => void;
}> = ({ patientId, patient, onUpdate }) => {
  const [evaluations, setEvaluations] = useState<PatientEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => {
    const list = store.getEvaluations(patientId);
    setEvaluations(list);
    const sel = store.getSelectedEvaluationId(patientId);
    setSelectedId(sel);
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return store.getEvaluationById(selectedId) ?? null;
  }, [selectedId]);

  const handleCreateToday = () => {
    store.addEvaluation(patientId, todayStr());
    load();
  };

  const handleSelect = (evId: string) => {
    store.setSelectedEvaluationId(patientId, evId);
    setSelectedId(evId);
  };

  // “navegación” interna: si hay seleccionada -> vista detalle completa
  if (selected) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <SectionHeader icon={Calendar} title="Evaluaciones" />
            <button
              type="button"
              onClick={handleCreateToday}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear evaluación de hoy
            </button>
          </div>
        </div>

        <EvaluationDetail
          patient={patient}
          patientId={patientId}
          evaluationId={selected.id}
          onUpdate={onUpdate}
          onBack={() => setSelectedId(null)}
        />
      </div>
    );
  }

  // Vista historial/lista
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader icon={Calendar} title="Evaluaciones" />
        <button
          type="button"
          onClick={handleCreateToday}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear evaluación de hoy
        </button>
      </div>

      <div className="mt-6">
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="italic">No hay evaluaciones todavía.</p>
              <p className="text-sm mt-2">Crea una evaluación para poder registrar mediciones, menús, etc.</p>
            </div>
          ) : (
            evaluations.map(ev => (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleSelect(ev.id)}
                className="w-full text-left p-4 rounded-2xl border transition-colors border-slate-100 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 truncate">{ev.title ?? ev.date}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{ev.date} · {ev.id}</p>
                  </div>

                  {/* indicador opcional si este era el “selected” guardado en store */}
                  {store.getSelectedEvaluationId(patientId) === ev.id && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" /> Última seleccionada
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};