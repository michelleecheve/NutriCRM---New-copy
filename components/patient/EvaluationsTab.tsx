import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Check, ChevronRight } from 'lucide-react';
import { store } from '../../services/store';
import { SectionHeader } from './SharedComponents';
import type { Patient, PatientEvaluation } from '../../types';
import { EvaluationDetail } from './EvaluationDetail';

export const EvaluationsTab: React.FC<{
  patientId: string;
  patient: Patient;
  onUpdate: (p: Patient) => void;
}> = ({ patientId, patient, onUpdate }) => {
  const [evaluations, setEvaluations] = useState<PatientEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => {
    setEvaluations(store.getEvaluations(patientId));
  };

  useEffect(() => {
    load();
    setSelectedId(null);
  }, [patientId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return store.getEvaluationById(selectedId) ?? null;
  }, [selectedId]);

  const handleCreateToday = async () => {
    try {
      await store.addEvaluation(patientId, store.getTodayStr());
      load();
    } catch (error) {
      console.error('Error creating evaluation:', error);
    }
  };

  const handleOpenDetail = (evId: string) => {
    store.setSelectedEvaluationId(patientId, evId);
    setSelectedId(evId);
  };

  if (selected) {
    return (
      <div className="pb-10">
        <EvaluationDetail
          patient={patient}
          patientId={patientId}
          evaluationId={selected.id}
          onUpdate={onUpdate}
          onBack={() => {
            setSelectedId(null);
            load();
          }}
        />
      </div>
    );
  }

  // Always mark the most recently created evaluation (latest by date, then by position)
  const lastRegisteredId = store.getLatestEvaluationId(patientId);

  return (
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

      <div className="mt-6">
        {evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <p className="italic">No hay evaluaciones todavía.</p>
            <p className="text-sm mt-2">Crea una evaluación para poder registrar mediciones, menús, etc.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <div className="col-span-8">Evaluación</div>
              <div className="col-span-3">Fecha</div>
              <div className="col-span-1" />
            </div>

            <div className="divide-y divide-slate-100">
              {evaluations.map(ev => {
                const isLast = lastRegisteredId === ev.id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleOpenDetail(ev.id)}
                    className="w-full text-left grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center"
                  >
                    <div className="col-span-8 flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-slate-400" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {ev.title ?? `Evaluación ${ev.date}`}
                          </p>
                          {isLast && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full shrink-0">
                              <Check className="w-3.5 h-3.5" />
                              Última
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <p className="text-sm font-bold text-slate-700">{ev.date}</p>
                    </div>

                    <div className="col-span-1 flex justify-end text-slate-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};