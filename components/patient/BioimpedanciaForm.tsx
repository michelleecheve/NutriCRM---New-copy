import React, { useState, useEffect, useMemo } from 'react';
import { Patient } from '../../types';
import { X, Save, Activity, ChevronRight, Trash2, Star } from 'lucide-react';
import { GridInput } from './SharedComponents';
import { EvaluationLink } from './EvaluationLink';
import { store } from '../../services/store';

// Local version of GridInput with blue focus for Bioimpedancia
const BlueGridInput = ({ label, value, onChange, type = "text", placeholder = "-", readOnly = false }: any) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={onChange}
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
  const [evaluationId, setEvaluationId] = useState<string | null>(() => store.getSelectedEvaluationId(patient.id));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
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
  });

  // Load existing record if editingId is provided
  useEffect(() => {
    if (editingId) {
      const record = patient.bioimpedancias?.find(b => b.id === editingId);
      if (record) {
        setFormData({
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
    if (!evaluationId) {
      setStatusMessage({ type: 'error', text: 'Por favor selecciona una evaluación para vincular este registro.' });
      return;
    }

    const selectedEval = patientEvaluations.find(e => e.id === evaluationId);
    if (!selectedEval) {
      setStatusMessage({ type: 'error', text: 'La evaluación seleccionada no es válida.' });
      return;
    }

    try {
      setStatusMessage(null);
      const recordToSave = {
        ...formData,
        id: editingId || undefined,
        date: selectedEval.date,
      };

      await store.saveBioimpedancia(evaluationId, recordToSave);
      
      // Update parent component via onUpdate
      const updatedPatient = store.getPatient(patient.id);
      if (updatedPatient) {
        onUpdate(updatedPatient);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving bioimpedancia:', error);
      setStatusMessage({ type: 'error', text: 'Error al guardar el registro. Por favor intenta de nuevo.' });
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    
    try {
      setStatusMessage(null);
      await store.deleteBioimpedancia(editingId);
      
      // Update parent component
      const updatedPatient = store.getPatient(patient.id);
      if (updatedPatient) {
        onUpdate(updatedPatient);
      }
      
      onClose();
    } catch (error) {
      console.error('Error deleting bioimpedancia:', error);
      setStatusMessage({ type: 'error', text: 'Error al eliminar el registro.' });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl animate-in fade-in zoom-in duration-300 max-w-5xl mx-auto overflow-hidden">
      {/* Header matching the image */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
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
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> {editingId ? 'Actualizar Registro' : 'Guardar Registro'}
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {statusMessage && (
          <div className={`p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {statusMessage.text}
          </div>
        )}
        {/* Evaluación Asignada Section */}
        <div className="space-y-3">
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
        <div className="space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            DATOS GENERALES
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
        <div className="space-y-6">
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

        {/* Delete Button at the end */}
        {editingId && (
          <div className="pt-8 border-t border-slate-100 flex justify-start">
            {!showDeleteConfirm ? (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
