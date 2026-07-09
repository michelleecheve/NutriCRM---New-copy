import React, { useState, useRef, useEffect } from 'react';
import { Patient } from '../../types';
import {
  Microscope, Save, ChevronDown, ChevronUp,
  FileText, Image as ImageIcon,
} from 'lucide-react';
import { FileGallery } from './FileGallery';
import { supabaseService } from '../../services/supabaseService';



interface LabsTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onNavigateToEvaluations: () => void;
}

// ─── Per-file Interpretation Panel ───────────────────────────────────────────
export const LabInterpretationPanel: React.FC<{
  file: any;
  onSave: (fileId: string, interpretation: string) => void;
}> = ({ file, onSave }) => {
  const [isOpen,         setIsOpen]         = useState(false);
  const [interpretation, setInterpretation] = useState<string>(file.labInterpretation || '');
  const [isDirty,        setIsDirty]        = useState(false);

  useEffect(() => {
    setInterpretation(file.labInterpretation || '');
    setIsDirty(false);
  }, [file.labInterpretation]);

  const handleSave = () => {
    onSave(file.id, interpretation);
    setIsDirty(false);
  };

  const fileIcon = file.type === 'pdf'
    ? <FileText  className="w-4 h-4 text-red-500  flex-shrink-0" />
    : <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />;

  const hasInterpretation = !!file.labInterpretation;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-indigo-200 shadow-sm' : 'border-slate-200'}`}>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Interpretación / Notas clínicas
            </p>
          </div>

          <textarea
            value={interpretation}
            onChange={e => { setInterpretation(e.target.value); setIsDirty(true); }}
            rows={9}
            placeholder="Escribe aquí la interpretación del laboratorio..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all resize-y placeholder:text-slate-300"
          />

          <div className="flex justify-start sm:justify-end">
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
export const LabsTab: React.FC<LabsTabProps> = ({ patient, onUpdate, onNavigateToEvaluations }) => {
  const labs = patient.labs || [];

  const handleUpdateFiles = (newFiles: any[]) => {
    onUpdate({ ...patient, labs: newFiles });
  };

  // ✅ Guarda la interpretación en Supabase + actualiza estado local
  const handleSaveInterpretation = async (fileId: string, interpretation: string) => {
    const updatedLabs = labs.map(f =>
      f.id === fileId ? { ...f, labInterpretation: interpretation } : f
    );
    onUpdate({ ...patient, labs: updatedLabs });

    try {
      await supabaseService.updatePatientFile(fileId, { labInterpretation: interpretation });
    } catch (err) {
      console.error('Error guardando interpretación en Supabase:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div data-tour="patient-labs-upload" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <FileGallery
          patientId={patient.id}
          files={labs}
          onUpdate={handleUpdateFiles}
          title="Resultados de Laboratorio"
          icon={Microscope}
          accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          folder="labs"
          onCreateEvaluation={onNavigateToEvaluations}
        />
      </div>

      {labs.length > 0 && (
        <div data-tour="patient-labs-interpretation" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Interpretación de Laboratorios</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Notas clínicas por archivo
              </p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {labs.map(file => (
              <LabInterpretationPanel
                key={file.id}
                file={file}
                onSave={handleSaveInterpretation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};