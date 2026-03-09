import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Check } from 'lucide-react';
import { store } from '../../services/store';
import { SectionHeader } from './SharedComponents';
import type { PatientEvaluation } from '../../types';

const todayStr = () => new Date().toISOString().split('T')[0];

export const EvaluationsTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [evaluations, setEvaluations] = useState<PatientEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => {
    const list = store.getEvaluations(patientId);
    setEvaluations(list);
    setSelectedId(store.getSelectedEvaluationId(patientId));
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return store.getEvaluationById(selectedId) ?? null;
  }, [selectedId]);

  const handleCreateToday = () => {
    const ev = store.addEvaluation(patientId, todayStr());
    setSelectedId(ev.id);
    load();
  };

  const handleSelect = (evId: string) => {
    store.setSelectedEvaluationId(patientId, evId);
    setSelectedId(evId);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader icon={Calendar} title="Evaluaciones (por día)" />
        <button
          type="button"
          onClick={handleCreateToday}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear evaluación de hoy
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-3">
          {evaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="italic">No hay evaluaciones todavía.</p>
              <p className="text-sm mt-2">Crea una evaluación para poder registrar mediciones, menús, etc.</p>
            </div>
          ) : (
            evaluations.map(ev => {
              const isActive = selectedId === ev.id;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleSelect(ev.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                    isActive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-800 truncate">{ev.date}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{ev.id}</p>
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Seleccionada
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="h-full min-h-[220px] border border-slate-100 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8">
              <p className="font-bold">Selecciona una evaluación</p>
              <p className="text-sm mt-1">Las demás pestañas se asignarán a esta evaluación.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl bg-white p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluación seleccionada</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selected.date}</h3>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluation ID</p>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-800 break-all">{selected.id}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Creada</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {new Date(selected.createdAt).toLocaleString('es-ES')}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 font-mono break-all">{selected.createdAt}</p>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-400">
                Cada registro de las otras pestañas deberá guardarse con este <span className="font-mono">evaluationId</span>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};