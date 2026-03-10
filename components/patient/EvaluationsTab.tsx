import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Check, Trash2, Save, Pencil, AlertTriangle } from 'lucide-react';
import { store } from '../../services/store';
import { SectionHeader } from './SharedComponents';
import type { PatientEvaluation } from '../../types';

const todayStr = () => new Date().toISOString().split('T')[0];

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

export const EvaluationsTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [evaluations, setEvaluations] = useState<PatientEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  }, [selected?.id]);

  const handleCreateToday = () => {
    store.addEvaluation(patientId, todayStr());
    load();
  };

  const handleSelect = (evId: string) => {
    store.setSelectedEvaluationId(patientId, evId);
    setSelectedId(evId);
  };

  const handleSave = () => {
    if (!selected || !draft) return;
    setErrorMsg('');
    try {
      store.updateEvaluation(selected.id, {
        title: draft.title?.trim() ? draft.title.trim() : undefined,
        date: draft.date,
      });
      load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'No se pudo guardar la evaluación.');
    }
  };

  const handleDeleteConfirmed = () => {
    if (!selected) return;
    store.deleteEvaluation(selected.id);
    setConfirmOpen(false);
    setSelectedId(null);
    setDraft(null);
    setErrorMsg('');
    load();
  };

  const hasChanges = useMemo(() => {
    if (!selected || !draft) return false;
    const t = selected.title ?? `Evaluación ${selected.date}`;
    return draft.title !== t || draft.date !== selected.date;
  }, [selected, draft]);

  return (
    <>
      {confirmOpen && selected && (
        <ConfirmModal
          title="Eliminar evaluación"
          message={`¿Seguro que deseas eliminar "${selected.title ?? selected.date}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

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

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <p className="text-sm font-extrabold text-slate-800 truncate">{ev.title ?? ev.date}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{ev.date} · {ev.id}</p>
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

          <div className="lg:col-span-2">
            {!selected || !draft ? (
              <div className="h-full min-h-[220px] border border-slate-100 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8">
                <p className="font-bold">Selecciona una evaluación</p>
                <p className="text-sm mt-1">Las demás pestañas se asignarán a esta evaluación.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluación seleccionada</p>
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

                <div className="mt-6 text-xs text-slate-400">
                  Cada registro de las otras pestañas deberá guardarse con este <span className="font-mono">evaluationId</span>.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};