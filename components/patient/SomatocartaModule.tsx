import React, { useMemo, useRef, useState } from 'react';
import { Patient, SomatotypeRecord, PatientEvaluation } from '../../types';
import { Calendar, Eye, Edit2, Trash2, X, Crosshair, Plus, Download, Link2, Pencil, AlertTriangle } from 'lucide-react';
import { GridInput } from './SharedComponents';
import { store } from '../../services/store';
import { SomatocartaGraph } from './SomatocartaGraph';

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

const formatSomatoDate = (yyyyMmDd: string) => {
  // render like: "8 Mar 2026"
  const d = new Date(`${yyyyMmDd}T12:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const SomatocartaModule: React.FC<{
  patient: Patient;
  onUpdate: (p: Patient) => void;
  showDelete?: boolean; // ✅ para ocultar al usar dentro de EvaluationDetail
}> = ({ patient, onUpdate, showDelete = true }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ delete flow sin confirm()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ✅ evaluaciones disponibles (para vincular)
  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  // ✅ "vinculación por defecto para crear" (igual que FileGallery upload)
  const [createEvalSelectorOpen, setCreateEvalSelectorOpen] = useState(false);
  const [createEvaluationId, setCreateEvaluationId] = useState<string | null>(
    store.getSelectedEvaluationId(patient.id)
  );

  const createEvaluation = useMemo(() => {
    if (!createEvaluationId) return null;
    return store.getEvaluationById(createEvaluationId) ?? null;
  }, [createEvaluationId]);

  const createLinkedDate =
    createEvaluation?.date ??
    (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]);

  // ✅ formData
  const [formData, setFormData] = useState<{ date: string; x: string; y: string }>({
    date: createLinkedDate,
    x: '',
    y: ''
  });

  // ✅ modal "ver gráfico"
  const [viewingChart, setViewingChart] = useState<SomatotypeRecord | null>(null);

  // ✅ vincular POR CARD (como FileGallery)
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
    setFormData({ date: createLinkedDate, x: '', y: '' });
    setEditingId(null);
    setShowForm(false);
    setCreateEvalSelectorOpen(false);
  };

  const handleChangeCreateEvaluation = (evId: string) => {
    const ev = store.getEvaluationById(evId);
    setCreateEvaluationId(evId || null);
    if (ev) store.setSelectedEvaluationId(patient.id, ev.id);
    setCreateEvalSelectorOpen(false);
    if (ev) setFormData(prev => ({ ...prev, date: ev.date }));
  };

  const handleEditClick = (rec: SomatotypeRecord) => {
    setFormData({ date: rec.date, x: rec.x.toString(), y: rec.y.toString() });
    setEditingId(rec.id);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('somatocarta-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSave = () => {
    if (!formData.x || !formData.y || !formData.date) return;

    const xVal = parseFloat(formData.x);
    const yVal = parseFloat(formData.y);

    let updatedSomatotypes = [...(patient.somatotypes || [])];

    if (editingId) {
      updatedSomatotypes = updatedSomatotypes.map(s =>
        s.id === editingId ? { ...s, date: formData.date, x: xVal, y: yVal } : s
      );
    } else {
      const newRecord: SomatotypeRecord = {
        id: Math.random().toString(36).substring(7),
        date: formData.date,
        x: xVal,
        y: yVal
      };
      updatedSomatotypes = [newRecord, ...updatedSomatotypes];
    }

    const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);

    resetForm();
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    const updatedSomatotypes = (patient.somatotypes || []).filter(s => s.id !== deleteTargetId);

    const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);

    setConfirmDeleteOpen(false);
    setDeleteTargetId(null);

    if (editingId === deleteTargetId) resetForm();
  };

  const openLinkModal = (rec: SomatotypeRecord) => {
    setLinkingSomatoId(rec.id);

    // if already linked by id and still exists, keep it; else match by date; else selected eval
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

  const applyLink = () => {
    if (!linkingSomatoId) return;

    const updatedSomatotypes = (patient.somatotypes || []).map(s => {
      if (s.id !== linkingSomatoId) return s;
      return {
        ...s,
        date: somatoLinkedDate,
        linkedEvaluationId: somatoEvaluationId ?? null
      } as any;
    });

    const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);

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
          onCancel={() => {
            setConfirmDeleteOpen(false);
            setDeleteTargetId(null);
          }}
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
                setFormData(prev => ({ ...prev, date: createLinkedDate }));
                setEditingId(null);
                setShowForm(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors ${
              showForm ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
            }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Crear Somatotipo'}
          </button>
        </div>

        {showForm && (
          <div id="somatocarta-form" className="p-6 bg-slate-50 border-b border-slate-100 space-y-4 animate-in slide-in-from-top-2">
            {/* Vinculación por defecto (igual que FileGallery) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Evaluación Asignada</p>

              {!createEvalSelectorOpen ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    {createEvaluation ? `${createEvaluation.title ?? createEvaluation.date} — ${formatSomatoDate(createEvaluation.date)}` : '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCreateEvalSelectorOpen(true)}
                    className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Cambiar Evaluación Asignada"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={createEvaluationId ?? ''}
                    onChange={(e) => handleChangeCreateEvaluation(e.target.value)}
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
                  <button
                    type="button"
                    onClick={() => setCreateEvalSelectorOpen(false)}
                    className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <GridInput label="Fecha" type="date" value={formData.date} onChange={(e: any) => setFormData({ ...formData, date: e.target.value })} />
              <GridInput label="Coordenada X" type="number" placeholder="-1.5" value={formData.x} onChange={(e: any) => setFormData({ ...formData, x: e.target.value })} />
              <GridInput label="Coordenada Y" type="number" placeholder="4.2" value={formData.y} onChange={(e: any) => setFormData({ ...formData, y: e.target.value })} />

              <div className="flex gap-2">
                <button onClick={handleSave} className="h-[38px] flex-1 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                  {editingId ? 'Actualizar Registro' : 'Guardar Registro'}
                </button>

                {editingId && showDelete && (
                  <button
                    type="button"
                    onClick={() => requestDelete(editingId)}
                    className="h-[38px] px-3 bg-red-50 border border-red-100 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {sortedRecords.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
              <Crosshair className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No Hay Registros De Somatotipo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRecords.map(rec => (
                <div
                  key={rec.id}
                  className={`border rounded-xl p-4 hover:shadow-md transition-all bg-white relative group ${
                    editingId === rec.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-700 text-sm truncate">
                        {formatSomatoDate(rec.date)}
                      </span>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {/* Vincular por card */}
                      <button
                        type="button"
                        onClick={() => openLinkModal(rec)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Vincular A Evaluación"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>

                      <button onClick={() => setViewingChart(rec)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Ver Gráfico">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(rec)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {showDelete && (
                        <button onClick={() => requestDelete(rec.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mb-3">
                    <div className="flex-1 bg-slate-50 rounded p-2 text-center">
                      <div className="text-xs text-slate-400 uppercase font-bold">Coord X</div>
                      <div className="font-bold text-slate-800">{rec.x}</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded p-2 text-center">
                      <div className="text-xs text-slate-400 uppercase font-bold">Coord Y</div>
                      <div className="font-bold text-slate-800">{rec.y}</div>
                    </div>
                  </div>

                  <div className="h-32 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                    <SomatocartaGraph x={rec.x} y={rec.y} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal vinculación por card */}
        {linkModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Vincular Somatotipo A Evaluación</h3>
                </div>
                <button
                  onClick={() => {
                    setLinkModalOpen(false);
                    setLinkingSomatoId(null);
                    setSomatoEvalSelectorOpen(false);
                  }}
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
                        title="Cambiar Evaluación Asignada"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
                      <button
                        type="button"
                        onClick={() => setSomatoEvalSelectorOpen(false)}
                        className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                      >
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
                    onClick={() => {
                      setLinkModalOpen(false);
                      setLinkingSomatoId(null);
                      setSomatoEvalSelectorOpen(false);
                    }}
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

        {/* Modal grande ver gráfico */}
        {viewingChart && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewingChart(null)}>
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
                    title="Descargar Imagen"
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
                <SomatocartaGraph x={viewingChart.x} y={viewingChart.y} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};