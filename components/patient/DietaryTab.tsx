import React, { useMemo, useState, useEffect } from 'react';
import { Patient, DietaryEvaluation, MealEntry, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import { Utensils, Plus, Clock, FileText, X, Save } from 'lucide-react';
import { GridInput, SectionHeader, ModernTextArea } from './SharedComponents';

const FOOD_GROUPS = [
  'Carne, Pollo, Cerdo', 'Pescado, Mariscos', 'Queso, Huevo', 'Leche/Yogurt', 'Incaparina',
  'Vegetales', 'Frutas', 'Granos', 'Cereales', 'Pan', 'Tortilla', 'Aguacate/semillas', 'Sal', 'Azucar',
  'Café/Té', 'Jugos', 'Gaseosas', 'Chucherias / Frituras', 'Comida Rápida', 'Galletas', 'Postres'
];

const FREQUENCIES = ['Diario', 'Semanal', 'Mensual', 'Rara vez', 'Nunca'];
const MEAL_TYPES = ['Desayuno', 'Refacción', 'Almuerzo', 'Cena'];

type ViewMode = 'list' | 'edit';

export const DietaryTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [view, setView] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const patientEvaluations: PatientEvaluation[] = useMemo(() => store.getEvaluations(patient.id), [patient.id]);
  const selectedEvaluationId = store.getSelectedEvaluationId(patient.id);

  const selectedEvaluation = useMemo(() => {
    if (!selectedEvaluationId) return null;
    return store.getEvaluationById(selectedEvaluationId) ?? null;
  }, [selectedEvaluationId]);

  const canCreateDietaryEvaluation = patientEvaluations.length > 0 && !!selectedEvaluation;

  const [formData, setFormData] = useState<DietaryEvaluation>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    mealsPerDay: 5,
    excludedFoods: '',
    notes: '',
    recall: [],
    foodFrequency: {},
    foodFrequencyOthers: ''
  });

  useEffect(() => {
    if (editingId) {
      const existing = patient.dietaryEvaluations.find(e => e.id === editingId);
      if (existing) setFormData(existing);
      return;
    }

    const baseDate = selectedEvaluation?.date ?? new Date().toISOString().split('T')[0];

    setFormData({
      id: Math.random().toString(36).substring(7),
      date: baseDate,
      mealsPerDay: 5,
      excludedFoods: '',
      notes: '',
      recall: [],
      foodFrequency: {},
      foodFrequencyOthers: ''
    });
  }, [editingId, patient.dietaryEvaluations, selectedEvaluation?.date]);

  const updateDietary = (field: string, value: any) => {
    onUpdate({ ...patient, dietary: { ...patient.dietary, [field]: value } });
  };

  const handleSave = () => {
    if (!selectedEvaluation) {
      alert('Primero selecciona una evaluación en el selector.');
      return;
    }

    const normalizedForm: DietaryEvaluation = {
      ...formData,
      date: selectedEvaluation.date,
    };

    let updatedEvaluations = [...patient.dietaryEvaluations];
    if (editingId) {
      updatedEvaluations = updatedEvaluations.map(e => e.id === editingId ? normalizedForm : e);
    } else {
      updatedEvaluations = [normalizedForm, ...updatedEvaluations];
    }

    onUpdate({ ...patient, dietaryEvaluations: updatedEvaluations });
    store.updatePatient({ ...patient, dietaryEvaluations: updatedEvaluations });

    setView('list');
    setEditingId(null);
  };

  const addMeal = () => {
    setFormData({
      ...formData,
      recall: [...formData.recall, { mealTime: 'Desayuno', time: '', place: '', description: '' }]
    });
  };

  const updateMeal = (idx: number, field: keyof MealEntry, val: string) => {
    const newRecall = [...formData.recall];
    newRecall[idx] = { ...newRecall[idx], [field]: val };
    setFormData({ ...formData, recall: newRecall });
  };

  const removeMeal = (idx: number) => {
    const newRecall = formData.recall.filter((_, i) => i !== idx);
    setFormData({ ...formData, recall: newRecall });
  };

  const updateFrequency = (food: string, freq: string) => {
    const current = formData.foodFrequency[food];
    if (current === freq) {
      const newFreq = { ...formData.foodFrequency };
      delete newFreq[food];
      setFormData({ ...formData, foodFrequency: newFreq });
    } else {
      setFormData({
        ...formData,
        foodFrequency: { ...formData.foodFrequency, [food]: freq }
      });
    }
  };

  const handleSelectEvaluationFromDropdown = (evId: string) => {
    store.setSelectedEvaluationId(patient.id, evId || null);
    setView(v => v);
  };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <SectionHeader icon={Utensils} title="Perfil Dietético Actual" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernTextArea
              label="Preferencias y Aversiones"
              value={patient.dietary.preferences}
              onChange={(e: any) => updateDietary('preferences', e.target.value)}
              rows={4}
            />
            <ModernTextArea
              label="Notas Adicionales"
              value={patient.dietary.notes}
              onChange={(e: any) => updateDietary('notes', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Utensils className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Historial de Evaluaciones Dietéticas</h3>
                <p className="text-xs text-slate-400">
                  El registro dietético se asignará a la evaluación que elijas.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full lg:w-auto">
              <div className="w-full sm:w-[320px]">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Elegir evaluación
                </label>
                <select
                  value={selectedEvaluationId ?? ''}
                  onChange={(e) => handleSelectEvaluationFromDropdown(e.target.value)}
                  className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                  disabled={patientEvaluations.length === 0}
                >
                  {patientEvaluations.length === 0 ? (
                    <option value="">Crea una evaluación primero</option>
                  ) : (
                    <>
                      <option value="">Seleccionar...</option>
                      {patientEvaluations.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title ?? ev.date}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={() => { setEditingId(null); setView('edit'); }}
                disabled={!canCreateDietaryEvaluation}
                className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 h-[42px] ${
                  canCreateDietaryEvaluation
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                }`}
                title={!canCreateDietaryEvaluation ? 'Crea y selecciona una evaluación primero.' : ''}
              >
                <Plus className="w-4 h-4" /> Nueva evaluación dietética
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patient.dietaryEvaluations.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay evaluaciones dietéticas registradas.</p>
            </div>
          ) : (
            patient.dietaryEvaluations.map((evalItem) => (
              <div
                key={evalItem.id}
                onClick={() => { setEditingId(evalItem.id); setView('edit'); }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-emerald-100 text-emerald-700 text-center px-2 py-1 rounded-lg">
                        <div className="text-[10px] font-bold uppercase">
                          {new Date(evalItem.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                        </div>
                        <div className="text-lg font-bold leading-none">{evalItem.date.split('-')[2]}</div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Evaluación Dietética</h4>
                        <span className="text-xs text-slate-400">{evalItem.date.split('-')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" /> Tiempos de Comida:
                    </div>
                    <span className="font-bold text-emerald-600">{evalItem.mealsPerDay} al día</span>
                  </div>

                  {evalItem.excludedFoods && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
                        <X className="w-3 h-3" /> Alimentos que evita
                      </div>
                      <div className="text-sm text-slate-700 font-medium truncate">{evalItem.excludedFoods}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {evalItem.recall.length} registros de comidas
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // EDIT VIEW
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <Utensils className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Registro Dietético</h2>
            <p className="text-xs text-emerald-600 font-bold tracking-wide uppercase">Evaluación Dietética</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Asignada a evaluación: <span className="font-mono font-bold">{selectedEvaluation?.date ?? '—'}</span>
            </p>
          </div>
        </div>
        <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-2">
            {/* ✅ BLOQUEO TOTAL: input directo */}
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</label>
            <input
              type="date"
              value={selectedEvaluation?.date ?? formData.date}
              disabled
              readOnly
              className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600 outline-none cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <GridInput label="Comidas al día" type="number" value={formData.mealsPerDay} onChange={(e: any) => setFormData({ ...formData, mealsPerDay: parseInt(e.target.value) })} />
          </div>
          <div className="md:col-span-8">
            <GridInput label="Alimentos que evita" placeholder="Ej: Lácteos, mariscos..." value={formData.excludedFoods} onChange={(e: any) => setFormData({ ...formData, excludedFoods: e.target.value })} />
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

      {/* resto igual */}
      {/* 24H Recall */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Recordatorio de 24 Horas</h3>
          <button onClick={addMeal} className="bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors">
            <Plus className="w-3 h-3" /> AÑADIR FILA
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <th className="p-4 rounded-l-lg w-1/5">Tiempo Comida</th>
                <th className="p-4 w-24">Hora</th>
                <th className="p-4 w-1/5">Lugar</th>
                <th className="p-4 w-1/3">Alimentos y Cantidad</th>
                <th className="p-4 rounded-r-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {formData.recall.map((meal, idx) => (
                <tr key={idx} className="group hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">
                    <select
                      value={meal.mealTime}
                      onChange={(e) => updateMeal(idx, 'mealTime', e.target.value)}
                      className="w-full bg-transparent font-bold focus:bg-white rounded px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="">Seleccionar...</option>
                      {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">
                    <input
                      type="time"
                      value={meal.time}
                      onChange={(e) => updateMeal(idx, 'time', e.target.value)}
                      className="w-full bg-transparent focus:bg-white rounded px-2 py-1 outline-none text-center"
                    />
                  </td>
                  <td className="p-3 text-slate-500">
                    <input
                      type="text"
                      placeholder="Casa / Oficina"
                      value={meal.place}
                      onChange={(e) => updateMeal(idx, 'place', e.target.value)}
                      className="w-full bg-transparent focus:bg-white rounded px-2 py-1 outline-none"
                    />
                  </td>
                  <td className="p-3 text-slate-600">
                    <textarea
                      placeholder="Describa alimentos..."
                      value={meal.description}
                      onChange={(e) => updateMeal(idx, 'description', e.target.value)}
                      rows={3}
                      className="w-full bg-transparent focus:bg-white rounded px-2 py-1 outline-none resize-none border border-transparent focus:border-slate-100"
                    />
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
                  <th key={group} className="p-2 text-center text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 min-w-[80px] break-words max-w-[100px]">
                    {group}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {FREQUENCIES.map(freq => (
                <tr key={freq} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 text-xs uppercase sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {freq}
                  </td>
                  {FOOD_GROUPS.map(group => {
                    const isSelected = formData.foodFrequency[group] === freq;
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
            value={formData.foodFrequencyOthers}
            onChange={(e: any) => setFormData({ ...formData, foodFrequencyOthers: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 sticky bottom-6 z-20">
        <button onClick={() => setView('list')} className="px-6 py-3 bg-white text-slate-500 font-bold rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-full shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" /> Guardar Evaluación
        </button>
      </div>
    </div>
  );
};