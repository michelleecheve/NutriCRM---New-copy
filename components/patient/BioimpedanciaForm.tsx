import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient } from '../../types';
import { X, Activity, ChevronRight, Trash2, Star, Info } from 'lucide-react';
import { SaveButton } from '../SaveButton';
import { GridInput } from './SharedComponents';
import { EvaluationLink } from './EvaluationLink';
import { store } from '../../services/store';
import { BioimpedanciaInterpretation } from './BioimpedanciaInterpretation';
import { PageGuideButton } from '../tour/PageGuideButton';
import { getBioimpedanciaFormGuideSteps } from '../tour/pageGuides/bioimpedanciaForm';

const calcDecimalAge = (birthdate: string, refDate: string): number => {
  const birth = new Date(birthdate);
  const ref = refDate ? new Date(refDate) : new Date();
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  return parseFloat((years + months / 12).toFixed(2));
};

const AgeHintTooltip: React.FC<{ birthdate?: string; refDate: string }> = ({ birthdate, refDate }) => {
  const [show, setShow] = useState(false);

  let content: string;
  if (!birthdate) {
    content = 'El paciente no tiene fecha de nacimiento registrada para calcular la edad exacta.';
  } else {
    const ref = refDate || new Date().toISOString().slice(0, 10);
    const decimal = calcDecimalAge(birthdate, ref);
    const birth = new Date(birthdate);
    const refD = new Date(ref);
    let years = refD.getFullYear() - birth.getFullYear();
    let months = refD.getMonth() - birth.getMonth();
    if (refD.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    content = `Según fecha de nacimiento, la edad exacta es ${decimal} años\n(${years} años, ${months} meses)`;
  }

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl min-w-[220px] max-w-[300px] animate-in fade-in zoom-in duration-200" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

// Local version of GridInput with blue focus for Bioimpedancia
const BlueGridInput = ({ label, value, onChange, type = "text", placeholder = "-", readOnly = false }: any) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 ${readOnly ? 'bg-slate-100 cursor-default' : 'focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
    />
  </div>
);

export const BioimpedanciaForm: React.FC<{ 
  patient: Patient; 
  onClose: () => void;
  onUpdate: (p: Patient) => void;
  editingId?: string | null;
}> = ({ patient, onClose, onUpdate, editingId }) => {
  const [evaluationId, setEvaluationId] = useState<string | null>(() => store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const savedIdRef = useRef<string | undefined>(editingId || undefined);
  
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    weight: '',
    height: '',
    imc: '',
    bodyFat: '',
    totalBodyWater: '',
    muscleMass: '',
    physiqueRating: '',
    visceralFat: '',
    boneMass: '',
    bmr: '',
    metabolicAge: '',
    meta_complied: false,
    armRelaxed: '',
    armContracted: '',
    calfGirth: '',
    waist: '',
    umbilical: '',
    hip: '',
    abdominalLow: '',
    thighRight: '',
    thighLeft: '',
    notes: '',
  });

  // Load existing record if editingId is provided
  useEffect(() => {
    if (editingId) {
      const record = patient.bioimpedancias?.find(b => b.id === editingId);
      if (record) {
        setFormData({
          gender: record.gender || '',
          age: record.age?.toString() || '',
          weight: record.weight?.toString() || '',
          height: record.height?.toString() || '',
          imc: record.imc?.toString() || '',
          bodyFat: record.body_fat_pct?.toString() || '',
          totalBodyWater: record.water_pct?.toString() || '',
          muscleMass: record.muscle_mass?.toString() || '',
          physiqueRating: record.physique_rating || '',
          visceralFat: record.visceral_fat?.toString() || '',
          boneMass: record.bone_mass?.toString() || '',
          bmr: record.bmr?.toString() || '',
          metabolicAge: record.metabolic_age?.toString() || '',
          meta_complied: record.meta_complied === 'true',
          armRelaxed: record.armRelaxed?.toString() || '',
          armContracted: record.armContracted?.toString() || '',
          calfGirth: record.calfGirth?.toString() || '',
          waist: record.waist?.toString() || '',
          umbilical: record.umbilical?.toString() || '',
          hip: record.hip?.toString() || '',
          abdominalLow: record.abdominalLow?.toString() || '',
          thighRight: record.thighRight?.toString() || '',
          thighLeft: record.thighLeft?.toString() || '',
          notes: record.notes || '',
        });
        setEvaluationId(record.evaluation_id);
      }
    }
  }, [editingId, patient.bioimpedancias]);

  // Use store.getEvaluations to ensure we have the most up-to-date list
  const patientEvaluations = useMemo(() => {
    const evals = store.getEvaluations(patient.id);
    return evals.length > 0 ? evals : (patient.evaluations || []);
  }, [patient.id, patient.evaluations]);

  const evaluation = useMemo(() => evaluationId ? store.getEvaluationById(evaluationId) ?? null : null, [evaluationId]);
  const linkedDate = evaluation?.date ?? '';

  // Auto-fill age from birthdate when evaluation date changes (new records only)
  useEffect(() => {
    if (!editingId && patient.clinical?.birthdate && linkedDate) {
      setFormData(prev => ({ ...prev, age: calcDecimalAge(patient.clinical!.birthdate!, linkedDate).toString() }));
    }
  }, [linkedDate, editingId]);

  // Calculate IMC automatically
  useEffect(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height) / 100; // cm to m

    if (w > 0 && h > 0) {
      const imcValue = (w / (h * h)).toFixed(2);
      setFormData(prev => ({ ...prev, imc: imcValue }));
    } else {
      setFormData(prev => ({ ...prev, imc: '' }));
    }
  }, [formData.weight, formData.height]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!evaluationId) throw new Error('Selecciona una evaluación para vincular este registro.');
    const selectedEval = patientEvaluations.find(e => e.id === evaluationId);
    if (!selectedEval) throw new Error('La evaluación seleccionada no es válida.');

    const recordToSave = {
      ...formData,
      id: savedIdRef.current,
      date: selectedEval.date,
      patientId: patient.id,
    };

    const saved = await store.saveBioimpedancia(evaluationId, recordToSave);
    if (saved?.id) savedIdRef.current = saved.id;

    const updatedPatient = store.getPatient(patient.id);
    if (updatedPatient) onUpdate(updatedPatient);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    await store.deleteBioimpedancia(editingId);
    const updatedPatient = store.getPatient(patient.id);
    if (updatedPatient) onUpdate(updatedPatient);
    onClose();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl animate-in fade-in zoom-in duration-300 max-w-5xl mx-auto overflow-hidden">
      {/* Header matching the image */}
      <div className="p-6 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
            title="Volver"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">
              {editingId ? 'Editar Registro de Bioimpedancia' : 'Registro de Bioimpedancia'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PageGuideButton steps={getBioimpedanciaFormGuideSteps()} label="Guía de este formulario" variant="light" />
          <SaveButton onSave={handleSave} />
          <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors text-center">
            Salir
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Evaluación Asignada Section */}
        <div data-tour="bioimpedancia-evaluation-link" className="space-y-3">
          <EvaluationLink
            patientId={patient.id}
            patientEvaluations={patientEvaluations}
            evaluationId={evaluationId}
            onChangeEvaluationId={setEvaluationId}
          />
          <p className="text-xs text-slate-400 px-1">
            La fecha del registro se toma automáticamente de la evaluación asignada.
          </p>
        </div>

        {/* Datos Generales Section */}
        <div data-tour="bioimpedancia-datos-generales" className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            DATOS GENERALES
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Género */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Género</label>
              <select
                value={formData.gender}
                onChange={(e: any) => handleChange('gender', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center">
                Edad (años)
                <AgeHintTooltip birthdate={patient.clinical?.birthdate} refDate={linkedDate} />
              </label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e: any) => handleChange('age', e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                placeholder="-"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <BlueGridInput
              label="Peso corporal (kg)"
              value={formData.weight}
              onChange={(e: any) => handleChange('weight', e.target.value)}
              type="number"
            />
            <BlueGridInput 
              label="Talla (cm)" 
              value={formData.height} 
              onChange={(e: any) => handleChange('height', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="IMC (Calculado)" 
              value={formData.imc} 
              readOnly={true}
              placeholder="Auto"
            />
            
            <BlueGridInput 
              label="% Grasa corporal" 
              value={formData.bodyFat} 
              onChange={(e: any) => handleChange('bodyFat', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="% Agua corporal total" 
              value={formData.totalBodyWater} 
              onChange={(e: any) => handleChange('totalBodyWater', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Masa muscular" 
              value={formData.muscleMass} 
              onChange={(e: any) => handleChange('muscleMass', e.target.value)} 
              type="number"
            />

            <BlueGridInput 
              label="Physique Rating" 
              value={formData.physiqueRating} 
              onChange={(e: any) => handleChange('physiqueRating', e.target.value)} 
            />
            <BlueGridInput 
              label="Grasa visceral" 
              value={formData.visceralFat} 
              onChange={(e: any) => handleChange('visceralFat', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Masa ósea estimada" 
              value={formData.boneMass} 
              onChange={(e: any) => handleChange('boneMass', e.target.value)} 
              type="number"
            />

            <BlueGridInput 
              label="Metabolismo basal (kcal)" 
              value={formData.bmr} 
              onChange={(e: any) => handleChange('bmr', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Edad metabólica" 
              value={formData.metabolicAge} 
              onChange={(e: any) => handleChange('metabolicAge', e.target.value)} 
              type="number"
            />

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <button
                onClick={() => handleChange('meta_complied', !formData.meta_complied)}
                className="focus:outline-none group transition-transform hover:scale-110"
              >
                <Star className={`w-6 h-6 transition-colors ${formData.meta_complied ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 group-hover:text-yellow-200'}`} />
              </button>
              <label className="text-sm font-bold text-slate-700">Meta Cumplida</label>
            </div>
          </div>
        </div>

        {/* Perímetros Corporales Section */}
        <div data-tour="bioimpedancia-perimetros" className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            PERÍMETROS CORPORALES (CM)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <BlueGridInput 
              label="Brazo" 
              value={formData.armRelaxed} 
              onChange={(e: any) => handleChange('armRelaxed', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Brazo cont." 
              value={formData.armContracted} 
              onChange={(e: any) => handleChange('armContracted', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Pantorrilla" 
              value={formData.calfGirth} 
              onChange={(e: any) => handleChange('calfGirth', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Cintura" 
              value={formData.waist} 
              onChange={(e: any) => handleChange('waist', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Umbilical" 
              value={formData.umbilical} 
              onChange={(e: any) => handleChange('umbilical', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Cadera" 
              value={formData.hip} 
              onChange={(e: any) => handleChange('hip', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="3 cm abajo umb." 
              value={formData.abdominalLow} 
              onChange={(e: any) => handleChange('abdominalLow', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Muslo der." 
              value={formData.thighRight} 
              onChange={(e: any) => handleChange('thighRight', e.target.value)} 
              type="number"
            />
            <BlueGridInput 
              label="Muslo izq." 
              value={formData.thighLeft} 
              onChange={(e: any) => handleChange('thighLeft', e.target.value)} 
              type="number"
            />
          </div>
        </div>

        {/* Notas */}
        <div data-tour="bioimpedancia-notas" className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            NOTAS
          </h4>
          <textarea
            value={formData.notes || ''}
            onChange={(e: any) => handleChange('notes', e.target.value)}
            rows={3}
            placeholder="Escribe tus notas aquí..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-300"
          />
        </div>

        {/* Visual Interpretation */}
        <div data-tour="bioimpedancia-interpretation">
          <BioimpedanciaInterpretation formData={formData} />
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            {editingId && (!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all group"
              >
                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Eliminar Registro
              </button>
            ) : (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2">
                <span className="text-sm font-bold text-slate-500 italic">¿Confirmar eliminación?</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    No, cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div data-tour="bioimpedancia-save-btn">
              <SaveButton onSave={handleSave} />
            </div>
            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
