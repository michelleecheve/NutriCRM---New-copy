import React, { useState, useRef, useEffect } from 'react';
import { Patient } from '../../types';
import {
  Microscope, Sparkles, Save, ChevronDown, ChevronUp,
  FileText, Image as ImageIcon, Settings, RotateCcw, X
} from 'lucide-react';
import { FileGallery } from './FileGallery';
import { store } from '../../services/store';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// ─── Storage key for custom prompt ────────────────────────────────────────────
const PROMPT_STORAGE_KEY = 'nutriflow_labs_ai_prompt_v1';

export const DEFAULT_PROMPT = `Eres un asistente clínico experto en interpretación de laboratorios médicos.
Analiza los resultados de laboratorio del paciente "{patientName}".

Proporciona en español:
1. RESUMEN DE VALORES: Lista los valores encontrados indicando cuáles están normales, elevados o bajos.
2. INTERPRETACIÓN CLÍNICA: Explica qué significan los valores alterados y su relevancia clínica.
3. IMPLICACIONES NUTRICIONALES: Cómo afectan estos resultados la alimentación del paciente.
4. RECOMENDACIONES DIETÉTICAS: Ajustes alimentarios sugeridos basados en estos resultados.

Usa lenguaje profesional pero claro. Organiza con los títulos de cada sección.`;

export function loadSavedPrompt(): string {
  try { return localStorage.getItem(PROMPT_STORAGE_KEY) || DEFAULT_PROMPT; }
  catch { return DEFAULT_PROMPT; }
}

export function savePromptToStorage(p: string) {
  try { localStorage.setItem(PROMPT_STORAGE_KEY, p); } catch {}
}

interface LabsTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
}

// ─── AI Lab Analysis via Gemini ───────────────────────────────────────────────
async function analyzeLabWithGemini(
  fileUrl: string,
  fileType: 'image' | 'pdf' | 'other',
  customPrompt: string
): Promise<string> {
  if (!process.env.API_KEY) throw new Error('API Key no configurada.');
  if (fileType === 'other') throw new Error('Solo se pueden analizar imágenes y PDFs.');

  const match = fileUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Formato de archivo inválido.');
  const [, mimeType, base64Data] = match;

  const contents: any[] = [
    {
      inlineData: {
        mimeType: fileType === 'pdf' ? 'application/pdf' : mimeType,
        data: base64Data,
      },
    },
    { text: customPrompt },
  ];

  const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents });
  const text = response.text || '';
  if (!text) throw new Error('Gemini no devolvió respuesta.');
  return text;
}

// ─── AI Config Popup ──────────────────────────────────────────────────────────
const AIConfigPopup: React.FC<{
  prompt: string;
  isCustom: boolean;
  onSave: (p: string) => void;
  onReset: () => void;
}> = ({ prompt: initialPrompt, isCustom, onSave, onReset }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initialPrompt);
  const popupRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setDraft(initialPrompt); }, [initialPrompt]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = () => { onSave(draft); setOpen(false); };
  const handleReset = () => { setDraft(DEFAULT_PROMPT); onReset(); setOpen(false); };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        title="Configurar prompt de AI"
        className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${
          isCustom
            ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
            : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
        }`}
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            ref={popupRef}
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">Prompt de análisis AI</span>
                {isCustom && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Personalizado
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] text-slate-400 font-medium">
                Usa <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{'{patientName}'}</code> para insertar el nombre del paciente automáticamente.
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono leading-relaxed focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all resize-y"
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-100 transition-all">
                <RotateCcw className="w-3 h-3" />
                Restaurar por defecto
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">
                  Cancelar
                </button>
                <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm">
                  <Save className="w-3 h-3" />
                  Guardar prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Per-file Interpretation Panel (exported for reuse in EvaluationDetail) ───
export const LabInterpretationPanel: React.FC<{
  file: any;
  patientName: string;
  customPrompt: string;
  isPromptCustom: boolean;
  onSavePrompt: (p: string) => void;
  onResetPrompt: () => void;
  onSave: (fileId: string, interpretation: string) => void;
}> = ({ file, patientName, customPrompt, isPromptCustom, onSavePrompt, onResetPrompt, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [interpretation, setInterpretation] = useState<string>(file.labInterpretation || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleAnalyzeWithAI = async () => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const resolvedPrompt = customPrompt.replace(/\{patientName\}/g, patientName);
      const result = await analyzeLabWithGemini(file.url, file.type, resolvedPrompt);
      setInterpretation(result);
      setIsDirty(true);
    } catch (e: any) {
      setError(e.message || 'Error al analizar con IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => { onSave(file.id, interpretation); setIsDirty(false); };

  const fileIcon = file.type === 'pdf'
    ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
    : <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />;

  const hasInterpretation = !!file.labInterpretation;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      isOpen ? 'border-indigo-200 shadow-sm' : 'border-slate-200'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {fileIcon}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
              {file.date}
              {hasInterpretation
                ? <span className="text-emerald-600 ml-1.5">· ✓ Con interpretación</span>
                : <span className="ml-1.5">· Sin interpretación</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {hasInterpretation && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 space-y-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Interpretación / Notas clínicas
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing || file.type === 'other'}
                title={file.type === 'other' ? 'Solo disponible para imágenes y PDFs' : 'Gemini leerá el archivo con el prompt configurado'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isAnalyzing || file.type === 'other'
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                {isAnalyzing ? 'Analizando...' : 'Analizar con AI'}
              </button>
              <AIConfigPopup
                prompt={customPrompt}
                isCustom={isPromptCustom}
                onSave={onSavePrompt}
                onReset={onResetPrompt}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <textarea
            value={interpretation}
            onChange={(e) => { setInterpretation(e.target.value); setIsDirty(true); }}
            rows={9}
            placeholder={
              file.type === 'other'
                ? 'Escribe aquí la interpretación del laboratorio...'
                : 'Escribe aquí la interpretación, o usa el botón de IA para generarla automáticamente...'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all resize-y placeholder:text-slate-300"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                isDirty
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Guardar interpretación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main LabsTab ──────────────────────────────────────────────────────────────
export const LabsTab: React.FC<LabsTabProps> = ({ patient, onUpdate }) => {
  const labs = patient.labs || [];

  const [customPrompt, setCustomPrompt] = useState<string>(loadSavedPrompt);
  const [isPromptCustom, setIsPromptCustom] = useState(loadSavedPrompt() !== DEFAULT_PROMPT);

  const handleSavePrompt = (p: string) => {
    setCustomPrompt(p);
    setIsPromptCustom(p !== DEFAULT_PROMPT);
    savePromptToStorage(p);
  };

  const handleResetPrompt = () => {
    setCustomPrompt(DEFAULT_PROMPT);
    setIsPromptCustom(false);
    savePromptToStorage(DEFAULT_PROMPT);
  };

  const handleUpdateFiles = (newFiles: any[]) => {
    const updated = { ...patient, labs: newFiles };
    onUpdate(updated);
    store.updatePatient(updated);
  };

  const handleSaveInterpretation = (fileId: string, interpretation: string) => {
    const updatedLabs = labs.map(f =>
      f.id === fileId ? { ...f, labInterpretation: interpretation } : f
    );
    const updated = { ...patient, labs: updatedLabs };
    onUpdate(updated);
    store.updatePatient(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <FileGallery
          patientId={patient.id}
          files={labs}
          onUpdate={handleUpdateFiles}
          title="Resultados de Laboratorio"
          icon={Microscope}
          accept="application/pdf,image/*"
        />
      </div>

      {labs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
            {labs.map(file => (
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
      )}
    </div>
  );
};