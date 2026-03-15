import React, { useMemo, useRef, useState } from 'react';
import { Patient, SomatotypeRecord, PatientEvaluation } from '../../types';
import { X, Crosshair, Plus, Download, Link2 } from 'lucide-react';
import { store } from '../../services/store';
import { SomatocartaLogic } from './SomatocartaLogic';
import { SomatocartaForm } from './SomatocartaForm';
import { SomatocartaCard } from './SomatocartaCard';
import { EvaluationLink } from './EvaluationLink';

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmText = 'Sí, Eliminar', cancelText = 'Cancelar', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const formatSomatoDate = (yyyyMmDd: string) => {
  const d = new Date(`${yyyyMmDd}T12:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const SomatocartaModule: React.FC<{
  patient: Patient;
  onUpdate: (p: Patient) => void;
  showDelete?: boolean;
}> = ({ patient, onUpdate, showDelete = true }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // ✅ patrón consistente: showForm + editingId (igual que MenuAddRead)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewingChart, setViewingChart] = useState<SomatotypeRecord | null>(null);

  // delete modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // evaluations for linking
  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  // link modal (por registro)
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingSomatoId, setLinkingSomatoId] = useState<string | null>(null);
  const [somatoEvalSelectorOpen, setSomatoEvalSelectorOpen] = useState(false);
  const [somatoEvaluationId, setSomatoEvaluationId] = useState<string | null>(null);

  const somatoEvaluation = useMemo(() => {
    if (!somatoEvaluationId) return null;
    return store.getEvaluationById(somatoEvaluationId) ?? null;
  }, [somatoEvaluationId]);

  const somatoLinkedDate =
    somatoEvaluation?.date ??
    (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

  const sortedRecords = useMemo(
    () => [...(patient.somatotypes || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [patient.somatotypes]
  );

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (rec: SomatotypeRecord) => {
    setEditingId(rec.id);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('somatocarta-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSavePatient = (updated: Patient) => {
    onUpdate(updated);
    resetForm();
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const itemToDelete = (patient.somatotypes || []).find(s => s.id === deleteTargetId);
    const updatedSomatotypes = (patient.somatotypes || []).filter(s => s.id !== deleteTargetId);
    const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
    onUpdate(updatedPatient);
    
    if (itemToDelete?.id) {
      try {
        await store.deleteSomatotype(itemToDelete.id);
      } catch (error) {
        console.error('Error deleting somatotype from Supabase:', error);
      }
    }

    setConfirmDeleteOpen(false);
    setDeleteTargetId(null);
    if (editingId === deleteTargetId) resetForm();
  };

  const openLinkModal = (rec: SomatotypeRecord) => {
    setLinkingSomatoId(rec.id);
    const currentLinkedEvalId = (rec as any).linkedEvaluationId as string | undefined;
    if (currentLinkedEvalId && store.getEvaluationById(currentLinkedEvalId)) {
      setSomatoEvaluationId(currentLinkedEvalId);
    } else {
      const match = patientEvaluations.find(e => e.date === rec.date);
      setSomatoEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id));
    }
    setSomatoEvalSelectorOpen(false);
    setLinkModalOpen(true);
  };

  const applyLink = async () => {
    if (!linkingSomatoId) return;
    let recordToSave: SomatotypeRecord | null = null;
    const updatedSomatotypes = (patient.somatotypes || []).map(s => {
      if (s.id !== linkingSomatoId) return s;
      recordToSave = { ...s, date: somatoLinkedDate, linkedEvaluationId: somatoEvaluationId ?? '' } as any;
      return recordToSave!;
    });
    const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
    onUpdate(updatedPatient);

    if (recordToSave && somatoEvaluationId) {
      try {
        await store.saveSomatotype(somatoEvaluationId, recordToSave);
      } catch (error) {
        console.error('Error linking somatotype in Supabase:', error);
      }
    }

    setLinkModalOpen(false);
    setLinkingSomatoId(null);
    setSomatoEvalSelectorOpen(false);
  };

  const downloadChartAsImage = () => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 1000;
    canvas.height = 1000;
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `somatocarta-${viewingChart?.date || 'chart'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <>
      {confirmDeleteOpen && (
        <ConfirmModal
          title="Eliminar Registro"
          message="¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer."
          onCancel={() => { setConfirmDeleteOpen(false); setDeleteTargetId(null); }}
          onConfirm={confirmDelete}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-800">
            <Crosshair className="w-5 h-5" />
            <h3 className="font-bold text-lg">Historial De Somatocarta</h3>
          </div>

          <button
            onClick={() => {
              if (showForm) resetForm();
              else {
                setEditingId(null);
                setShowForm(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors ${
              showForm
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
            }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Crear Somatotipo'}
          </button>
        </div>

        {/* ✅ Form usa nueva API: solo editingId */}
        {showForm && (
          <div id="somatocarta-form" className="p-6 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-2">
            <SomatocartaForm
              patient={patient}
              patientEvaluations={patientEvaluations}
              editingId={editingId}
              onSavePatient={handleSavePatient}
              onCancel={resetForm}
            />
          </div>
        )}

        <div className="p-6">
          {sortedRecords.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
              <Crosshair className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay registros de somatotipo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRecords.map(rec => (
                <SomatocartaCard
                  key={rec.id}
                  record={rec}
                  onView={() => setViewingChart(rec)}
                  onEdit={() => handleEditClick(rec)}
                  onDelete={() => requestDelete(rec.id)}
                  onLink={() => openLinkModal(rec)}
                  showDelete={showDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal vincular por registro */}
        {linkModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Vincular Somatotipo A Evaluación</h3>
                </div>
                <button
                  onClick={() => { setLinkModalOpen(false); setLinkingSomatoId(null); setSomatoEvalSelectorOpen(false); }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Evaluación Asignada</p>
                  {!somatoEvalSelectorOpen ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">
                        {somatoEvaluation ? `${somatoEvaluation.title ?? somatoEvaluation.date} — ${formatSomatoDate(somatoEvaluation.date)}` : '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSomatoEvalSelectorOpen(true)}
                        className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-bold">Editar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={somatoEvaluationId ?? ''}
                        onChange={(e) => { setSomatoEvaluationId(e.target.value || null); setSomatoEvalSelectorOpen(false); }}
                        className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 w-full"
                        autoFocus
                        disabled={patientEvaluations.length === 0}
                      >
                        {patientEvaluations.length === 0 ? (
                          <option value="">Crea Una Evaluación Primero</option>
                        ) : (
                          <>
                            <option value="">Seleccionar...</option>
                            {patientEvaluations.map(ev => (
                              <option key={ev.id} value={ev.id}>
                                {ev.title ?? ev.date} — {formatSomatoDate(ev.date)}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <button type="button" onClick={() => setSomatoEvalSelectorOpen(false)} className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Fecha De Evaluación</p>
                  <input
                    type="date"
                    value={somatoLinkedDate}
                    disabled
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setLinkModalOpen(false); setLinkingSomatoId(null); setSomatoEvalSelectorOpen(false); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applyLink}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    Guardar Vínculo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal ver gráfico grande */}
        {viewingChart && (
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setViewingChart(null)}
          >
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Somatocarta</h3>
                  <p className="text-sm text-slate-500">Fecha: {formatSomatoDate(viewingChart.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadChartAsImage}
                    className="p-2 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors flex items-center gap-2 px-4 font-bold text-sm"
                  >
                    <Download className="w-5 h-5" />
                    Descargar PNG
                  </button>
                  <button onClick={() => setViewingChart(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div ref={chartContainerRef} className="p-8 h-[600px] flex items-center justify-center bg-white">
                <SomatocartaLogic x={viewingChart.x} y={viewingChart.y} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};