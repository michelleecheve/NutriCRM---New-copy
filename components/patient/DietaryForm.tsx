import React, { useEffect, useMemo, useState } from 'react';
import { DietaryEvaluation, MealEntry, Patient, PatientEvaluation } from '../../types';
import { Utensils, Plus, X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { GridInput, ModernTextArea } from './SharedComponents';
import { EvaluationLink } from './EvaluationLink';
import { store } from '../../services/store';

const FOOD_GROUPS = [
  'Carne, Pollo, Cerdo', 'Pescado, Mariscos', 'Queso, Huevo', 'Leche / Yogurt', 'Incaparina',
  'Vegetales', 'Frutas', 'Granos', 'Cereales', 'Pan', 'Tortilla', 'Aguacate / semillas', 'Sal', 'Azucar',
  'Café / Té', 'Jugos', 'Gaseosas', 'Chucherias / Frituras', 'Comida Rápida', 'Galletas', 'Postres', 'Bebidas Alcohólicas'
];
const FREQUENCIES = ['Diario', 'Semanal', 'Mensual', 'Rara vez', 'Nunca'];
const MEAL_TYPES = ['Desayuno', 'Refacción', 'Almuerzo', 'Cena'];

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="font-extrabold text-slate-900 text-lg">{title}</p>
      </div>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">
          Sí, eliminar
        </button>
      </div>
    </div>
  </div>
);

export const DietaryForm: React.FC<{
  patient: Patient;
  patientEvaluations: PatientEvaluation[];
  editingId: string | null;
  onSavePatient: (updated: Patient) => void;
  onCancel: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}> = ({ patient, patientEvaluations, editingId, onSavePatient, onCancel, onDelete, showDelete = true }) => {

  const existingRecord = useMemo<DietaryEvaluation | null>(() => {
    if (!editingId) return null;
    return patient.dietaryEvaluations.find(d => d.id === editingId) ?? null;
  }, [editingId, patient.dietaryEvaluations]);

  const isEditing = !!existingRecord;

  const [evaluationId, setEvaluationId] = useState<string | null>(() => {
    if (existingRecord) {
      const match = patientEvaluations.find(e => e.date === existingRecord.date);
      return match?.id ?? store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id);
    }
    return store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id);
  });

  const evaluation = useMemo(() => {
    if (!evaluationId) return null;
    return store.getEvaluationById(evaluationId) ?? null;
  }, [evaluationId]);

  const linkedDate = evaluation?.date ?? '';

  const [formData, setFormData] = useState<DietaryEvaluation>(() =>
    existingRecord ? { ...existingRecord } : {
      id: crypto.randomUUID(),
      date: linkedDate,
      mealsPerDay: 5,
      excludedFoods: '',
      notes: '',
      recall: [],
      foodFrequency: [],
      foodFrequencyOthers: '',
    }
  );

  useEffect(() => {
    const rec = editingId
      ? patient.dietaryEvaluations.find(d => d.id === editingId) ?? null
      : null;

    if (rec) {
      setFormData({ ...rec });
      const match = patientEvaluations.find(e => e.date === rec.date);
      setEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id));
    } else {
      const selId = store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id);
      const selEv = selId ? store.getEvaluationById(selId) : null;
      setFormData({
        id: crypto.randomUUID(),
        date: selEv?.date ?? '',
        mealsPerDay: 5,
        excludedFoods: '',
        notes: '',
        recall: [],
        foodFrequency: [],
        foodFrequencyOthers: '',
      });
      setEvaluationId(selId);
    }
  }, [editingId]);

  useEffect(() => {
    if (!evaluation) return;
    setFormData(prev => ({ ...prev, date: evaluation.date }));
  }, [evaluation?.date]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const canDelete = showDelete && !!onDelete;

  const addMeal = () =>
    setFormData({ 
      ...formData, 
      recall: [
        ...formData.recall, 
        { 
          id: crypto.randomUUID(), 
          dietaryEvaluationId: formData.id, 
          mealTime: 'Desayuno', 
          time: '', 
          place: '', 
          description: '' 
        }
      ] 
    });

  const updateMeal = (idx: number, field: keyof MealEntry, val: string) => {
    const newRecall = [...formData.recall];
    newRecall[idx] = { ...newRecall[idx], [field]: val };
    setFormData({ ...formData, recall: newRecall });
  };

  const removeMeal = (idx: number) =>
    setFormData({ ...formData, recall: formData.recall.filter((_, i) => i !== idx) });

  const updateFrequency = (food: string, freq: string) => {
    const frequencyArray = Array.isArray(formData.foodFrequency) ? formData.foodFrequency : [];
    const existingIndex = frequencyArray.findIndex(f => f.category === food);
    
    if (existingIndex > -1) {
      const current = frequencyArray[existingIndex];
      if (current.frequency === freq) {
        // Remove if same
        setFormData({ ...formData, foodFrequency: frequencyArray.filter(f => f.category !== food) });
      } else {
        // Update frequency
        const newFreq = [...frequencyArray];
        newFreq[existingIndex] = { ...newFreq[existingIndex], frequency: freq };
        setFormData({ ...formData, foodFrequency: newFreq });
      }
    } else {
      // Add new
      setFormData({ 
        ...formData, 
        foodFrequency: [
          ...frequencyArray, 
          { id: crypto.randomUUID(), dietaryEvaluationId: formData.id, category: food, frequency: freq }
        ] 
      });
    }
  };

  const handleSave = async () => {
    if (!evaluationId) return;
    const ev = store.getEvaluationById(evaluationId);
    if (!ev) return;

    const normalized: DietaryEvaluation = { 
      ...formData, 
      date: ev.date, 
      linkedEvaluationId: evaluationId || '' 
    };

    try {
      await store.saveDietaryEvaluation(evaluationId, normalized);
      onSavePatient({ ...patient, dietaryEvaluations: isEditing
        ? patient.dietaryEvaluations.map(d => d.id === editingId ? normalized : d)
        : [normalized, ...patient.dietaryEvaluations]
      });
    } catch (error) {
      console.error('Error saving dietary evaluation to Supabase:', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {confirmOpen && canDelete && (
        <ConfirmModal
          title="Eliminar evaluación dietética"
          message="¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); onDelete?.(); }}
        />
      )}

      {/* Barra superior */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <Utensils className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Registro Dietético</h2>
              <p className="text-xs text-emerald-600 font-bold tracking-wide uppercase">Evaluación Dietética</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors">
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ EvaluationLink — mismo componente que Somatocarta, Measurements y Menu */}
      <EvaluationLink
        patientId={patient.id}
        patientEvaluations={patientEvaluations}
        evaluationId={evaluationId}
        onChangeEvaluationId={setEvaluationId}
      />

      {/* Datos generales */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-2">
            <GridInput
              label="Comidas al día"
              type="number"
              value={formData.mealsPerDay}
              onChange={(e: any) => setFormData({ ...formData, mealsPerDay: parseInt(e.target.value) })}
            />
          </div>
          <div className="md:col-span-10">
            <GridInput
              label="Alimentos que evita"
              placeholder="Ej: Lácteos, mariscos..."
              value={formData.excludedFoods}
              onChange={(e: any) => setFormData({ ...formData, excludedFoods: e.target.value })}
            />
          </div>
          <div className="md:col-span-12">
            <ModernTextArea
              label="Notas adicionales"
              placeholder="Observaciones importantes sobre la conducta alimentaria..."
              value={formData.notes}
              onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* 24H Recall */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Recordatorio de 24 Horas</h3>
          <button onClick={addMeal} className="bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors">
            <Plus className="w-3 h-3" /> AÑADIR FILA
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <th className="p-4 rounded-l-lg w-[22%]">Tiempo Comida</th>
                <th className="p-4 w-20">Hora</th>
                <th className="p-4 w-[22%]">Lugar</th>
                <th className="p-4 w-[42%]">Alimentos y Cantidad</th>
                <th className="p-4 rounded-r-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {formData.recall.map((meal, idx) => (
                <tr key={idx} className="group hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">
                    <select value={meal.mealTime} onChange={(e) => updateMeal(idx, 'mealTime', e.target.value)} className="w-full bg-transparent font-bold focus:bg-white rounded px-2 py-1 outline-none cursor-pointer">
                      <option value="">Seleccionar...</option>
                      {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">
                    <input type="time" value={meal.time} onChange={(e) => updateMeal(idx, 'time', e.target.value)} className="w-full bg-transparent focus:bg-white rounded px-2 py-1 outline-none text-center" />
                  </td>
                  <td className="p-3 text-slate-500">
                    <input type="text" placeholder="Casa / Oficina" value={meal.place} onChange={(e) => updateMeal(idx, 'place', e.target.value)} className="w-full bg-transparent focus:bg-white rounded px-2 py-1 outline-none" />
                  </td>
                  <td className="p-3 text-slate-600">
                    <textarea placeholder="Describa alimentos..." value={meal.description} onChange={(e) => updateMeal(idx, 'description', e.target.value)} rows={3} className="w-full bg-transparent focus:bg-white rounded px-2 py-1 outline-none resize-none border border-transparent focus:border-slate-100" />
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => removeMeal(idx)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {formData.recall.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl mt-4">
              No hay comidas registradas.
            </div>
          )}
        </div>
      </div>

      {/* Food Frequency */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-6">Frecuencia de Consumo de Alimentos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-left text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100 sticky left-0 bg-white z-10 w-48">Frecuencia</th>
                {FOOD_GROUPS.map(group => (
                  <th key={group} className="p-2 text-center text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 min-w-[80px] break-words max-w-[100px]">{group}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {FREQUENCIES.map(freq => (
                <tr key={freq} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 text-xs uppercase sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{freq}</td>
                  {FOOD_GROUPS.map(group => {
                    const frequencyArray = Array.isArray(formData.foodFrequency) ? formData.foodFrequency : [];
                    const isSelected = frequencyArray.find(f => f.category === group)?.frequency === freq;
                    return (
                      <td
                        key={group}
                        className={`p-2 text-center cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}
                        onClick={() => updateFrequency(group, freq)}
                      >
                        <div className="flex justify-center items-center h-8">
                          {isSelected ? (
                            <span className="text-emerald-500 font-bold text-lg leading-none transform scale-125">
                              <X className="w-4 h-4 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-emerald-200 text-lg leading-none opacity-0 hover:opacity-100">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <ModernTextArea
            label="Otros"
            placeholder="Otros detalles sobre la frecuencia de consumo..."
            value={formData.foodFrequencyOthers || ''}
            onChange={(e: any) => setFormData({ ...formData, foodFrequencyOthers: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      {/* Barra inferior */}
      <div className="flex items-center justify-between pt-2">
        {canDelete ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-sm shadow-lg transition-colors bg-red-50 text-red-700 border border-red-100 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span><span className="sm:hidden">Eliminar</span>
          </button>
        ) : <div />}

        <div className="flex gap-2 sm:gap-3">
          <button type="button" onClick={onCancel} className="px-3 py-2 sm:px-6 sm:py-3 text-sm bg-white text-slate-500 font-bold rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="px-3 py-2 sm:px-6 sm:py-3 text-sm bg-emerald-600 text-white font-bold rounded-full shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Guardar Evaluación</span><span className="sm:hidden">Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};