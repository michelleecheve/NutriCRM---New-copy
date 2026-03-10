import React from 'react';
import { DietaryEvaluation, MealEntry, PatientEvaluation } from '../../types';
import { Utensils, Plus, X, Save, Pencil } from 'lucide-react';
import { GridInput, ModernTextArea } from './SharedComponents';
import { store } from '../../services/store';

const FOOD_GROUPS = [
  'Carne, Pollo, Cerdo', 'Pescado, Mariscos', 'Queso, Huevo', 'Leche/Yogurt', 'Incaparina',
  'Vegetales', 'Frutas', 'Granos', 'Cereales', 'Pan', 'Tortilla', 'Aguacate/semillas', 'Sal', 'Azucar',
  'Café/Té', 'Jugos', 'Gaseosas', 'Chucherias / Frituras', 'Comida Rápida', 'Galletas', 'Postres'
];
const FREQUENCIES = ['Diario', 'Semanal', 'Mensual', 'Rara vez', 'Nunca'];
const MEAL_TYPES = ['Desayuno', 'Refacción', 'Almuerzo', 'Cena'];

export const DietaryForm: React.FC<{
  formData: DietaryEvaluation;
  setFormData: React.Dispatch<React.SetStateAction<DietaryEvaluation>>;

  patientEvaluations: PatientEvaluation[];

  formEvaluationId: string | null;
  setFormEvaluationId: React.Dispatch<React.SetStateAction<string | null>>;

  evalSelectorOpen: boolean;
  setEvalSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;

  onCancel: () => void;
  onSave: () => void;
}> = ({
  formData,
  setFormData,
  patientEvaluations,
  formEvaluationId,
  setFormEvaluationId,
  evalSelectorOpen,
  setEvalSelectorOpen,
  onCancel,
  onSave,
}) => {
  const formEvaluation = formEvaluationId ? store.getEvaluationById(formEvaluationId) : null;

  // Cuando el usuario cambia la evaluación asignada, jalar su date
  const handleChangeFormEvaluation = (evId: string) => {
    const ev = store.getEvaluationById(evId);
    setFormEvaluationId(evId || null);
    if (ev) setFormData(prev => ({ ...prev, date: ev.date }));
    setEvalSelectorOpen(false);
  };

  const addMeal = () => {
    setFormData({ ...formData, recall: [...formData.recall, { mealTime: 'Desayuno', time: '', place: '', description: '' }] });
  };

  const updateMeal = (idx: number, field: keyof MealEntry, val: string) => {
    const newRecall = [...formData.recall];
    newRecall[idx] = { ...newRecall[idx], [field]: val };
    setFormData({ ...formData, recall: newRecall });
  };

  const removeMeal = (idx: number) => {
    setFormData({ ...formData, recall: formData.recall.filter((_, i) => i !== idx) });
  };

  const updateFrequency = (food: string, freq: string) => {
    const current = formData.foodFrequency[food];
    if (current === freq) {
      const newFreq = { ...formData.foodFrequency };
      delete newFreq[food];
      setFormData({ ...formData, foodFrequency: newFreq });
    } else {
      setFormData({ ...formData, foodFrequency: { ...formData.foodFrequency, [food]: freq } });
    }
  };

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
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* Evaluación asignada — discreta */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Evaluación asignada</p>
          {!evalSelectorOpen ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600">
                {formEvaluation ? `${formEvaluation.title ?? formEvaluation.date} — ${formEvaluation.date}` : '—'}
              </span>
              <button
                type="button"
                onClick={() => setEvalSelectorOpen(true)}
                className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                title="Cambiar evaluación asignada"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={formEvaluationId ?? ''}
                onChange={(e) => handleChangeFormEvaluation(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                autoFocus
              >
                <option value="">Seleccionar...</option>
                {patientEvaluations.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title ?? ev.date} — {ev.date}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setEvalSelectorOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</label>
            <input
              type="date"
              value={formData.date}
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
                    const isSelected = formData.foodFrequency[group] === freq;
                    return (
                      <td key={group} className={`p-2 text-center cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`} onClick={() => updateFrequency(group, freq)}>
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
        <button onClick={onCancel} className="px-6 py-3 bg-white text-slate-500 font-bold rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button onClick={onSave} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-full shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" /> Guardar Evaluación
        </button>
      </div>
    </div>
  );
};