import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Pencil,
  Save,
  Trash2,
  Utensils,
  ArrowLeft,
  Calculator,
  Microscope,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Crosshair,
  Download,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { store } from '../../services/store';
import { authStore } from '../../services/authStore';
import { supabaseService } from '../../services/supabaseService';
import { DietaryCard } from './DietaryCard';
import { DietaryForm } from './DietaryForm';
import { NewMeasurementForm } from './NewMeasurementForm';
import { FileGallery } from './FileGallery';
import type { FileGalleryHandle } from './FileGallery';
import { MenuAddRead } from './MenuAddRead';
import { MenuCard } from './MenuCard';
import type { DietaryEvaluation, Patient, PatientEvaluation, Measurement, SomatotypeRecord, BioimpedanciaRecord } from '../../types';
import { MeasurementsHistory } from './MeasurementsHistory';
import { BioimpedanciaHistory } from './BioimpedanciaHistory';
import { BioimpedanciaForm } from './BioimpedanciaForm';
import { SomatocartaCard } from './SomatocartaCard';
import { SomatocartaForm } from './SomatocartaForm';
import { SomatocartaLogic } from './SomatocartaLogic';
import { LabInterpretationPanel, DEFAULT_PROMPT } from './LabsTab';

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
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">
          Sí, eliminar
        </button>
      </div>
    </div>
  </div>
);

const formatSomatoDate = (yyyyMmDd: string) => {
  const d = new Date(`${yyyyMmDd}T12:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Labs Interpretation Section (date-scoped) ────────────────────────────────
const LabsInterpretationSection: React.FC<{
  linkedLabs: any[];
  patient: Patient;
  onUpdate: (p: Patient) => void;
}> = ({ linkedLabs, patient, onUpdate }) => {
  const savedPrompt = store.getUserProfile()?.labAIPrompt || DEFAULT_PROMPT;
  const [customPrompt,   setCustomPrompt]   = useState<string>(savedPrompt);
  const [isPromptCustom, setIsPromptCustom] = useState(savedPrompt !== DEFAULT_PROMPT);

  const handleSavePrompt = async (p: string) => {
    setCustomPrompt(p);
    setIsPromptCustom(p !== DEFAULT_PROMPT);
    try {
      const userId = authStore.getCurrentUser()?.id;
      if (userId) await supabaseService.updateProfile(userId, { labAIPrompt: p });
    } catch (err) {
      console.error('Error guardando lab prompt:', err);
    }
  };

  const handleResetPrompt = async () => {
    setCustomPrompt(DEFAULT_PROMPT);
    setIsPromptCustom(false);
    try {
      const userId = authStore.getCurrentUser()?.id;
      if (userId) await supabaseService.updateProfile(userId, { labAIPrompt: '' });
    } catch (err) {
      console.error('Error reseteando lab prompt:', err);
    }
  };

  const handleSaveInterpretation = async (fileId: string, interpretation: string) => {
    const updatedLabs = (patient.labs || []).map((f: any) =>
      f.id === fileId ? { ...f, labInterpretation: interpretation } : f
    );
    const updated = { ...patient, labs: updatedLabs };
    onUpdate(updated);
    store.updatePatient(updated);
    try {
      await supabaseService.updatePatientFile(fileId, { labInterpretation: interpretation });
    } catch (err) {
      console.error('Error guardando interpretación:', err);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-xl">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Interpretación de Laboratorios</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Análisis clínico por archivo — manual o asistido por IA (Gemini)
          </p>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {linkedLabs.map((file: any) => (
          <LabInterpretationPanel
            key={file.id}
            file={file}
            patientName={`${patient.firstName} ${patient.lastName}`}
            customPrompt={customPrompt}
            isPromptCustom={isPromptCustom}
            onSavePrompt={handleSavePrompt}
            onResetPrompt={handleResetPrompt}
            onSave={handleSaveInterpretation}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main EvaluationDetail ────────────────────────────────────────────────────
export const EvaluationDetail: React.FC<{
  patient: Patient;
  evaluationId: string;
  patientId: string;
  onUpdate: (p: Patient) => void;
  onBack: () => void;
}> = ({ patient, evaluationId, patientId, onUpdate, onBack }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [dietaryView, setDietaryView] = useState<'card' | 'edit'>('card');
  const [dietaryEditingId, setDietaryEditingId] = useState<string | null>(null);

  const [menuView, setMenuView] = useState<'card' | 'edit'>('card');
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  const [measView, setMeasView] = useState<'card' | 'edit'>('card');
  const [measEditingId, setMeasEditingId] = useState<string | null>(null);

  const [bioView, setBioView] = useState<'card' | 'edit'>('card');
  const [bioEditingId, setBioEditingId] = useState<string | null>(null);

  const [somatoView, setSomatoView] = useState<'card' | 'view' | 'edit'>('card');
  const [somatoEditingId, setSomatoEditingId] = useState<string | null>(null);
  const [viewingChart, setViewingChart] = useState<SomatotypeRecord | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const labsGalleryRef = useRef<FileGalleryHandle>(null);
  const photosGalleryRef = useRef<FileGalleryHandle>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selected = useMemo(() => store.getEvaluationById(evaluationId) ?? null, [evaluationId]);

  const [notes, setNotes] = useState(selected?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  useEffect(() => {
    setNotes(selected?.notes || '');
  }, [selected?.id, selected?.notes]);

  const handleNotesSave = async () => {
    if (!selected) return;
    setIsSavingNotes(true);
    try {
      await store.updateEvaluation(selected.id, { notes: notes });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const hasNotesChanges = notes !== (selected?.notes || '');

  const linkedDietaryEvaluations = useMemo(() => {
    if (!selected) return [];
    return patient.dietaryEvaluations.filter(d => d.date === selected.date);
  }, [patient.dietaryEvaluations, selected?.date]);

  const linkedLabs = useMemo(() => {
    if (!selected) return [];
    return (patient.labs || []).filter((f: any) => f?.date === selected.date);
  }, [patient.labs, selected?.date]);

  const linkedPhotos = useMemo(() => {
    if (!selected) return [];
    return (patient.photos || []).filter((f: any) => f?.date === selected.date);
  }, [patient.photos, selected?.date]);

  const linkedSomatotypes: SomatotypeRecord[] = useMemo(() => {
    if (!selected) return [];
    return (patient.somatotypes || []).filter((s: any) => s?.date === selected.date);
  }, [patient.somatotypes, selected?.date]);

  const linkedMenus = useMemo(() => {
    if (!selected) return [];
    const allMenus: any[] = [...(patient.menus || []), ...(patient.dietary?.menus || [])];
    return allMenus
      .filter(m => {
        const byEvalId = (m as any)?.linkedEvaluationId === selected.id;
        const byDate   = (m as any)?.basedOnMeasurementDate === selected.date;
        return byEvalId || byDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [patient.menus, patient.dietary?.menus, selected?.id, selected?.date]);

  const linkedMeasurements = useMemo(() => {
    if (!selected) return [];
    return patient.measurements.filter(m => m.linkedEvaluationId === selected.id);
  }, [patient.measurements, selected?.id]);

  const linkedBioimpedancias = useMemo(() => {
    if (!selected) return [];
    return (patient.bioimpedancias || []).filter(b => b.evaluation_id === selected.id);
  }, [patient.bioimpedancias, selected?.id]);

  useEffect(() => {
    if (!selected) { setDraft(null); setErrorMsg(''); return; }
    setDraft({ title: selected.title ?? `Evaluación ${selected.date}`, date: selected.date });
    setErrorMsg('');
    setDietaryView('card'); setDietaryEditingId(null);
    setMenuView('card'); setEditingMenuId(null);
    setMeasView('card'); setMeasEditingId(null);
    setBioView('card'); setBioEditingId(null);
    setSomatoView('card'); setSomatoEditingId(null);
    setViewingChart(null);
  }, [selected?.id]);

  const hasChanges = useMemo(() => {
    if (!selected || !draft) return false;
    const t = selected.title ?? `Evaluación ${selected.date}`;
    return draft.title !== t || draft.date !== selected.date;
  }, [selected, draft]);

  const handleSave = async () => {
    if (!selected || !draft) return;
    setErrorMsg('');
    try {
      await store.updateEvaluation(selected.id, {
        title: draft.title?.trim() ? draft.title.trim() : undefined,
        date: draft.date,
      });
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'No se pudo guardar la evaluación.');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!selected) return;
    try {
      await store.deleteEvaluation(selected.id);
      setConfirmOpen(false);
      setDraft(null);
      setErrorMsg('');
      store.setSelectedEvaluationId(patientId, null);
      onBack();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  const handleUpdateLabsForThisEvaluation = async (newFilesForThisDate: any[]) => {
    if (!selected) return;
    const rest = (patient.labs || []).filter((f: any) => f?.date !== selected.date);
    const updatedPatient: Patient = { ...patient, labs: [...newFilesForThisDate, ...rest] };
    onUpdate(updatedPatient);
    try {
      await store.updatePatient(updatedPatient);
    } catch (error) {
      console.error('Error updating patient labs:', error);
    }
  };

  const handleUpdatePhotosForThisEvaluation = async (newFilesForThisDate: any[]) => {
    if (!selected) return;
    const rest = (patient.photos || []).filter((f: any) => f?.date !== selected.date);
    const updatedPatient: Patient = { ...patient, photos: [...newFilesForThisDate, ...rest] };
    onUpdate(updatedPatient);
    try {
      await store.updatePatient(updatedPatient);
    } catch (error) {
      console.error('Error updating patient photos:', error);
    }
  };

  const handleEditLinkedMeasurement = (m: Measurement) => {
    setMeasEditingId(m.id ?? m.date);
    setMeasView('edit');
    setTimeout(() => {
      document.getElementById('evaluation-measurements')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleEditLinkedBioimpedancia = (b: BioimpedanciaRecord) => {
    setBioEditingId(b.id);
    setBioView('edit');
    setTimeout(() => {
      document.getElementById('evaluation-measurements')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const downloadChartAsImage = () => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 1000; canvas.height = 1000;
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

  if (!selected || !draft) {
    return (
      <div className="h-full min-h-[220px] border border-slate-100 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8">
        <p className="font-bold">Evaluación no encontrada</p>
        <button type="button" onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    );
  }

  return (
    <>
      {confirmOpen && (
        <ConfirmModal
          title="Eliminar evaluación"
          message={`¿Seguro que deseas eliminar "${selected.title ?? selected.date}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

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
                <button onClick={downloadChartAsImage}
                  className="p-2 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors flex items-center gap-2 px-4 font-bold text-sm">
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

      <div className="space-y-6">
        {/* Card 1: Header */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <button type="button" onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-4 h-4" />
                Volver al historial
              </button>
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-slate-300 shrink-0" />
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Título de la evaluación"
                  className="w-full text-xl font-bold text-slate-900 bg-transparent outline-none border-b border-slate-100 focus:border-slate-300 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={handleSave} disabled={!hasChanges}
                title="Se Activa Guardar Si Cambias Nombre o Fecha de Evaluación"
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                  hasChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
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

          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</p>
                <input type="date" value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Evaluation ID</p>
                <p className="mt-2 font-mono text-sm font-bold text-slate-700 break-all border border-slate-200 rounded-xl px-3 py-2 bg-white">
                  {selected.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Evaluation Notes */}
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          <button 
            type="button"
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">Notas de Evaluación</p>
            </div>
            <div className="text-slate-400">
              {notesExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </div>
          </button>
          
          {notesExpanded && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe aquí las notas generales de esta evaluación..."
                className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all resize-y"
              />
              <div className="mt-4 flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {hasNotesChanges ? 'Tienes cambios sin guardar' : 'Notas actualizadas'}
                </p>
                <button
                  onClick={handleNotesSave}
                  disabled={isSavingNotes}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:shadow-amber-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingNotes ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSavingNotes ? 'Guardando...' : 'Guardar Notas'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Dietary */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Utensils className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Evaluación Dietética</p>
                <p className="text-xs text-slate-500">
                  Vinculada por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => { setDietaryEditingId(null); setDietaryView('edit'); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>

          {dietaryView === 'edit' ? (
            <DietaryForm
              patient={patient}
              patientEvaluations={patientEvaluations}
              editingId={dietaryEditingId}
              onSavePatient={async (updated) => {
                onUpdate(updated);
                try {
                  await store.updatePatient(updated);
                  setDietaryView('card');
                  setDietaryEditingId(null);
                } catch (error) {
                  console.error('Error updating patient dietary:', error);
                }
              }}
              onCancel={() => { setDietaryView('card'); setDietaryEditingId(null); }}
              showDelete={false}
            />
          ) : linkedDietaryEvaluations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedDietaryEvaluations.map(d => (
                <DietaryCard key={d.id} evalItem={d}
                  onClick={() => { setDietaryEditingId(d.id); setDietaryView('edit'); }} />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
              No hay evaluaciones dietéticas para esta fecha. Presiona <span className="font-bold">Crear</span> para agregar una.
            </div>
          )}
        </div>

        {/* Card 3: Measurements */}
        <div id="evaluation-measurements" className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Medidas</p>
                <p className="text-xs text-slate-500">
                  Vinculadas por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setMeasEditingId(null); setMeasView('edit'); }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4" /> Crear Antropométrica
              </button>
              <button type="button" onClick={() => { setBioEditingId(null); setBioView('edit'); }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Crear Bioimpedancia
              </button>
            </div>
          </div>

          {measView === 'edit' ? (
            <NewMeasurementForm
              patient={patient}
              onUpdate={onUpdate}
              editingId={measEditingId}
              onClose={() => { setMeasView('card'); setMeasEditingId(null); }}
              showDelete={false}
            />
          ) : bioView === 'edit' ? (
            <BioimpedanciaForm
              patient={patient}
              onUpdate={onUpdate}
              editingId={bioEditingId}
              onClose={() => { setBioView('card'); setBioEditingId(null); }}
            />
          ) : (
            <div className="space-y-8">
              {/* Antropometría */}
              <div>
                {linkedMeasurements.length > 0 ? (
                  <MeasurementsHistory
                    patient={{ ...patient, measurements: linkedMeasurements }}
                    onEdit={handleEditLinkedMeasurement}
                  />
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
                    No hay registros antropométricos para esta fecha. Presiona <span className="font-bold">Crear Antropométrica</span> para agregar uno.
                  </div>
                )}
              </div>

              {/* Bioimpedancia */}
              <div>
                {linkedBioimpedancias.length > 0 ? (
                  <BioimpedanciaHistory
                    patient={{ ...patient, bioimpedancias: linkedBioimpedancias }}
                    onEdit={handleEditLinkedBioimpedancia}
                  />
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
                    No hay registros de bioimpedancia para esta fecha. Presiona <span className="font-bold">Crear Bioimpedancia</span> para agregar uno.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Somatocarta */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Crosshair className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Somatocarta</p>
                <p className="text-xs text-slate-500">
                  Vinculada por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => { setSomatoEditingId(null); setSomatoView('edit'); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>

          {somatoView === 'edit' ? (
            <SomatocartaForm
              patient={patient}
              patientEvaluations={patientEvaluations}
              editingId={somatoEditingId}
              onCancel={() => { setSomatoView('card'); setSomatoEditingId(null); }}
              onSavePatient={async (updated) => {
                onUpdate(updated);
                try {
                  await store.updatePatient(updated);
                  setSomatoView('card');
                  setSomatoEditingId(null);
                } catch (error) {
                  console.error('Error updating patient somatotype:', error);
                }
              }}
            />
          ) : linkedSomatotypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedSomatotypes.map(rec => (
                <SomatocartaCard key={rec.id} record={rec}
                  onView={() => setViewingChart(rec)}
                  onEdit={() => { setSomatoEditingId(rec.id); setSomatoView('edit'); }}
                  onLink={() => { setSomatoEditingId(rec.id); setSomatoView('edit'); }}
                  showDelete={false}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
              No hay registros de somatotipo para esta fecha. Presiona <span className="font-bold">Crear</span> para agregar uno.
            </div>
          )}
        </div>

        {/* Card 5: Menus */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Menú</p>
                <p className="text-xs text-slate-500">
                  Vinculados por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => { setEditingMenuId(null); setMenuView('edit'); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>

          {menuView === 'edit' ? (
            <MenuAddRead
              patient={patient}
              onUpdate={onUpdate}
              editingMenuId={editingMenuId}
              onClose={() => { setMenuView('card'); setEditingMenuId(null); }}
            />
          ) : linkedMenus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedMenus.map(menu => (
                <MenuCard key={menu.id} menu={menu}
                  onClick={() => { setEditingMenuId(menu.id); setMenuView('edit'); }} />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm">
              No hay menús para esta fecha. Presiona <span className="font-bold">Crear</span> para agregar uno.
            </div>
          )}
        </div>

        {/* Card 6: Labs */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Microscope className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Laboratorios</p>
                <p className="text-xs text-slate-500">
                  Vinculados por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => labsGalleryRef.current?.openUpload()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Subir
            </button>
          </div>

          <FileGallery
            ref={labsGalleryRef}
            patientId={patient.id}
            files={linkedLabs}
            onUpdate={handleUpdateLabsForThisEvaluation}
            title="Resultados De Laboratorio"
            icon={Microscope}
            accept="application/pdf,image/*"
            showDelete={false}
            hideHeader
          />

          {/* Interpretaciones — filtradas por fecha via linkedLabs */}
          {linkedLabs.length > 0 && (
            <LabsInterpretationSection
              linkedLabs={linkedLabs}
              patient={patient}
              onUpdate={onUpdate}
            />
          )}
        </div>

        {/* Card 7: Photos */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">Fotos De Progreso</p>
                <p className="text-xs text-slate-500">
                  Vinculadas por fecha: <span className="font-mono font-bold">{selected.date}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => photosGalleryRef.current?.openUpload()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Subir
            </button>
          </div>

          <FileGallery
            ref={photosGalleryRef}
            patientId={patient.id}
            files={linkedPhotos}
            onUpdate={handleUpdatePhotosForThisEvaluation}
            title="Galería De Progreso"
            icon={ImageIcon}
            accept="image/*"
            showDelete={false}
            hideHeader
          />
        </div>

        {/* Delete evaluation — bottom of page */}
        <div className="flex justify-end">
          <button type="button" onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />
            Eliminar Evaluación
          </button>
        </div>

      </div>
    </>
  );
};