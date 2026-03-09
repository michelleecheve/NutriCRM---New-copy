
import React, { useState, useEffect } from 'react';
import { Patient, Measurement } from '../../types';
import { store } from '../../services/store';
import { Plus, Save, X, Trash2, ChevronRight, History, Calculator, Info, Star } from 'lucide-react';
import { GridInput, SectionHeader, ModernTextArea } from './SharedComponents';

const DIAGNOSTIC_OPTIONS = [
  "% de grasa adecuado, buen desarrollo muscular, EN normal según IMC",
  "% de grasa adecuado, bajo desarrollo muscular, EN normal según IMC",
  "% de grasa elevado, buen desarrollo muscular, EN normal según IMC",
  "% de grasa bajo, buen desarrollo muscular, EN normal según IMC",
  "% de grasa adecuado, desarrollo muscular elevado, EN sobrepeso según IMC",
  "Deshidratado",
  "Bien hidratado",
  "Hidratado",
  "Peso corporal total adecuado para etapa",
  "Peso corporal total alto para etapa",
  "Peso corporal total bajo para etapa",
  "Sobrepeso según IMC, % de grasa elevado y desarrollo muscular adecuado",
  "Obesidad según IMC, % de grasa elevado y desarrollo muscular adecuado",
  "Obesidad según IMC, % de grasa y desarrollo muscular elevado.",
  "Bajo peso para estatura según percentiles OMS",
  "Peso normal para estatura según percentiles OMS",
  "Sobrepeso para estatura según percentiles OMS",
  "% de grasa bajo, bajo desarrollo muscular, EN bajo peso según IMC",
  "% de grasa elevado, desarrollo muscular elevado, EN obesidad según IMC",
  "% de grasa adecuado, bajo desarrollo muscular, EN bajo peso según IMC"
];

const FORM_SECTIONS = [
  {
    title: 'DATOS GENERALES',
    fields: [
      { key: 'date', label: 'Fecha de Evaluación', type: 'date', isManual: true },
      { key: 'gender', label: 'Género', isSelect: true, options: ['M', 'F'], isManual: true },
      { key: 'age', label: 'Edad', type: 'number', isManual: true },
      { key: 'weight', label: 'Peso (kg)', type: 'number', isManual: true },
      { key: 'height', label: 'Talla (cm)', type: 'number', isManual: true },
      { key: 'metaComplied', label: 'Meta Cumplida', isStar: true, isManual: true },
    ]
  },
  {
    title: 'PLIEGUES CUTÁNEOS (MM)',
    fields: [
      { key: 'biceps', label: 'Bíceps', type: 'number', isManual: true },
      { key: 'triceps', label: 'Tríceps', type: 'number', isManual: true },
      { key: 'subscapular', label: 'Subescapular', type: 'number', isManual: true },
      { key: 'supraspinal', label: 'Supraespinal', type: 'number', isManual: true },
      { key: 'abdomen', label: 'Abdomen', type: 'number', isManual: true },
      { key: 'thigh', label: 'Muslo', type: 'number', isManual: true },
      { key: 'calf', label: 'Pantorrilla', type: 'number', isManual: true },
      { key: 'iliacCrest', label: 'Cresta Ilíaca', type: 'number', isManual: true },
      { key: 'skinfoldSum', label: 'SUM. PLIEGUES', isCalculated: true, formula: 'Suma de los 8 pliegues' },
    ]
  },
  {
    title: 'DIÁMETROS ÓSEOS (CM)',
    fields: [
      { key: 'wrist', label: 'Muñeca', type: 'number', isManual: true },
      { key: 'humerus', label: 'Húmero', type: 'number', isManual: true },
      { key: 'femur', label: 'Fémur', type: 'number', isManual: true },
    ]
  },
  {
    title: 'PERÍMETROS CORPORALES (CM)',
    fields: [
      { key: 'armRelaxed', label: 'Brazo', type: 'number', isManual: true },
      { key: 'armContracted', label: 'Brazo cont.', type: 'number', isManual: true },
      { key: 'calfGirth', label: 'Pantorrilla', type: 'number', isManual: true },
      { key: 'waist', label: 'Cintura', type: 'number', isManual: true },
      { key: 'umbilical', label: 'Umbilical', type: 'number', isManual: true },
      { key: 'hip', label: 'Cadera', type: 'number', isManual: true },
      { key: 'abdominalLow', label: '3 cm abajo umb.', type: 'number', isManual: true },
      { key: 'thighRight', label: 'Muslo der.', type: 'number', isManual: true },
      { key: 'thighLeft', label: 'Muslo izq.', type: 'number', isManual: true },
    ]
  },
  {
    title: 'COMPOSICIÓN CORPORAL',
    fields: [
      { key: 'imc', label: 'IMC', isCalculated: true, formula: 'Peso / (Talla/100)²' },
      { key: 'bodyFat', label: '% Grasa', isCalculated: true, formula: 'M: (Σ 6 Pliegues * 0.097) + 3.64 | F: (Σ 6 Pliegues * 0.143) + 4.56' },
      { key: 'fatKg', label: 'Peso Grasa (kg)', isCalculated: true, formula: '(% Grasa * Peso) / 100' },
      { key: 'leanMassKg', label: 'Peso Libre de Grasa (kg)', isCalculated: true, formula: 'Peso - Peso Grasa' },
      { key: 'leanMassPct', label: '% Peso Libre de Grasa', isCalculated: true, formula: '(Peso Libre Grasa / Peso) * 100' },
      { key: 'aks', label: 'AKS', isCalculated: true, formula: '(Peso Libre Grasa * 1000) / (Talla³ * 0.01)' },
      { key: 'boneMass', label: 'Masa Ósea (kg)', isCalculated: true, formula: '3.02 * ((Talla² * Muñeca * Húmero * 4) / 10⁶)^0.712' },
      { key: 'residualMass', label: 'PesRES (kg)', isCalculated: true, formula: 'M: Peso * 0.241 | F: Peso * 0.209' },
      { key: 'muscleKg', label: 'Peso Músculo (kg)', isCalculated: true, formula: 'Peso - (Masa Ósea + Peso Grasa + PesRES)' },
    ]
  },
  {
    title: 'SOMATOTIPO',
    fields: [
      { key: 'endomorfo', label: 'Endomorfo', isCalculated: true, formula: 'Carter & Heath (1990) - Coef: 0.145' },
      { key: 'mesomorfo', label: 'Mesomorfo', isCalculated: true, formula: 'Carter & Heath (1990)' },
      { key: 'ectomorfo', label: 'Ectomorfo', isCalculated: true, formula: 'Carter & Heath (1990) - 2 Rangos' },
      { key: 'x', label: 'X', isCalculated: true, formula: 'Ecto - Endo' },
      { key: 'y', label: 'Y', isCalculated: true, formula: '(2 * Meso) - (Endo + Ecto)' },
    ]
  },
  {
    title: 'DIAGNÓSTICO NUTRICIONAL',
    fields: [
      { key: 'diagnosticN', label: 'Diagnóstico N', isSelect: true, options: DIAGNOSTIC_OPTIONS, isManual: true, isFullWidth: true },
      { key: 'subjectiveValuation', label: 'Valoración Subjetiva (1-10)', type: 'number', isManual: true, isFullWidth: true },
    ]
  }
];

export const NewMeasurementForm: React.FC<{ 
  patient: Patient; 
  onUpdate: (p: Patient) => void;
  onViewChange?: (view: 'list' | 'detail' | 'new') => void;
}> = ({ patient, onUpdate, onViewChange }) => {
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  const [formData, setFormData] = useState<Measurement>({
    date: new Date().toISOString().split('T')[0],
    metaComplied: false,
    weight: 0,
    height: 0
  });

  const fmt = (n: number | undefined | null) => {
    if (n === undefined || n === null || isNaN(n)) return undefined;
    return parseFloat(n.toFixed(3));
  };

  const calculateAnthropometry = (m: Measurement): Measurement => {
    const get = (key: keyof Measurement) => Number(m[key]) || 0;
    
    const h = get('height');
    const w = get('weight');
    const gender = m.gender;
    const wrist = get('wrist');
    const femur = get('femur');
    const humerus = get('humerus');
    const armContracted = get('armContracted');
    const calfGirth = get('calfGirth');
    const triceps = get('triceps');
    const calfSkin = get('calf');

    const sumSixSkinfolds = get('biceps') + get('thigh') + get('calf') + 
                            get('triceps') + get('subscapular') + get('supraspinal');

    const sumSkinfolds = get('biceps') + get('triceps') + get('subscapular') +
                         get('supraspinal') + get('abdomen') + get('thigh') +
                         get('calf') + get('iliacCrest');

    let imc = 0;
    if (h > 0) imc = w / ((h/100) * (h/100));

    const bodyFat = gender === 'F' 
      ? (sumSixSkinfolds * 0.143) + 4.56 
      : (sumSixSkinfolds * 0.097) + 3.64;
    const fatKg = (bodyFat * w) / 100;
    const leanMassKg = w - fatKg;
    let leanMassPct = 0;
    if (w > 0) leanMassPct = (leanMassKg / w) * 100;

    let aks = 0;
    if (h > 0) aks = (leanMassKg * 1000) / (Math.pow(h, 3) * 0.01);

    let boneMass = 0;
    if (h > 0 && wrist > 0 && humerus > 0) {
       boneMass = 3.02 * Math.pow(((h * h * wrist * humerus * 4) / 1000000), 0.712);
    }

    let residualMass = 0;
    if (gender === 'M') residualMass = w * 0.241;
    else if (gender === 'F') residualMass = w * 0.209;

    const muscleKg = w - (boneMass + fatKg + residualMass);

    let endo = 0, meso = 0, ecto = 0;
    const sumEndo = get('triceps') + get('subscapular') + get('supraspinal');
    if (h > 0) {
       const X = sumEndo * (170.18 / h);
       endo = -0.7182 + (0.145 * X) - (0.00068 * Math.pow(X, 2)) + (0.0000014 * Math.pow(X, 3));
    }

    if (h > 0) {
        const correctedArm = armContracted - (triceps / 10);
        const correctedCalf = calfGirth - (calfSkin / 10);
        meso = (0.858 * humerus) + (0.601 * femur) + (0.188 * correctedArm) + (0.161 * correctedCalf) - (0.131 * h) + 4.5;
    }

    if (w > 0 && h > 0) {
        const hwr = h / Math.cbrt(w);
        if (hwr > 40.75) ecto = (0.732 * hwr) - 28.58;
        else ecto = (0.463 * hwr) - 17.63;
    }

    const x = ecto - endo;
    const y = (2 * meso) - (endo + ecto);

    return {
      ...m,
      skinfoldSum: fmt(sumSkinfolds),
      imc: fmt(imc),
      bodyFat: fmt(bodyFat),
      fatKg: fmt(fatKg),
      leanMassKg: fmt(leanMassKg),
      leanMassPct: fmt(leanMassPct),
      aks: fmt(aks),
      boneMass: fmt(boneMass),
      residualMass: fmt(residualMass),
      muscleKg: fmt(muscleKg),
      endomorfo: fmt(endo),
      mesomorfo: fmt(meso),
      ectomorfo: fmt(ecto),
      x: fmt(x),
      y: fmt(y)
    };
  };

  const handleFieldChange = (key: keyof Measurement, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(calculateAnthropometry(updated));
  };

  const handleSave = () => {
    let newMeasurements = [...patient.measurements];
    if (editingId) {
      newMeasurements = newMeasurements.map(m => m.date === editingId ? formData : m);
    } else {
      newMeasurements.push(formData);
    }
    onUpdate({ ...patient, measurements: newMeasurements });
    store.updatePatient({ ...patient, measurements: newMeasurements });
    setView('list');
    setEditingId(null);
  };

  const handleDelete = () => {
    if (window.confirm('¿Seguro que quiere eliminar este registro?')) {
      const newMeasurements = patient.measurements.filter(m => m.date !== editingId);
      onUpdate({ ...patient, measurements: newMeasurements });
      store.updatePatient({ ...patient, measurements: newMeasurements });
      setView('list');
      setEditingId(null);
    }
  };

  const handleEdit = (m: Measurement) => {
    setFormData(m);
    setEditingId(m.date);
    setView('detail');
  };

  const handleNew = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      metaComplied: false,
      weight: 0,
      height: 0
    });
    setEditingId(null);
    setView('new');
  };

  if (view === 'detail' || view === 'new') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('list')}
              className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              title="Volver"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">
                {view === 'detail' ? 'Detalle del Registro' : 'Nuevo Registro Antropométrico'}
              </h3>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Guardar Registro
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {FORM_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                {section.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {section.fields.map((field: any) => {
                  const fieldWrapperClass = field.isFullWidth ? "col-span-full" : "";
                  
                  if (field.isCalculated) {
                    const val = (formData as any)[field.key];
                    const displayVal = (val === undefined || val === null || isNaN(val)) ? '-' : val.toFixed(3);
                    return (
                      <div key={field.key} className={`bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 ${fieldWrapperClass}`}>
                        <label className="text-xs font-bold text-emerald-800 mb-1 block uppercase">{field.label}</label>
                        <div className="text-lg font-bold text-emerald-700">{displayVal}</div>
                        <div className="text-[10px] text-emerald-600/60 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {field.formula}
                        </div>
                      </div>
                    );
                  }

                  if (field.isStar) {
                    const isChecked = !!(formData as any)[field.key];
                    return (
                      <div key={field.key} className={`flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 ${fieldWrapperClass}`}>
                        <button 
                          onClick={() => handleFieldChange(field.key, !isChecked)}
                          className="focus:outline-none group transition-transform hover:scale-110"
                        >
                          <Star className={`w-6 h-6 transition-colors ${isChecked ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 group-hover:text-yellow-200'}`} />
                        </button>
                        <label className="text-sm font-bold text-slate-700">{field.label}</label>
                      </div>
                    );
                  }

                  if (field.isCheckbox) {
                    return (
                      <div key={field.key} className={`flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 ${fieldWrapperClass}`}>
                        <input 
                          type="checkbox" 
                          checked={!!(formData as any)[field.key]} 
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label className="text-sm font-bold text-slate-700">{field.label}</label>
                      </div>
                    );
                  }

                  if (field.isSelect) {
                    return (
                      <div key={field.key} className={`flex flex-col ${fieldWrapperClass}`}>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase">{field.label}</label>
                        <select 
                          value={(formData as any)[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                          <option value="">Seleccionar...</option>
                          {field.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className={fieldWrapperClass}>
                      <GridInput 
                        label={field.label}
                        type={field.type}
                        value={(formData as any)[field.key] ?? ''}
                        onChange={(e: any) => handleFieldChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-between items-center">
          {view === 'detail' ? (
            <button onClick={handleDelete} className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors ml-auto md:ml-0">
              <Trash2 className="w-4 h-4" /> Eliminar Registro
            </button>
          ) : <div></div>}
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Guardar Registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Historial de Registros</h3>
            <p className="text-xs text-slate-400">Haga clic en un registro para ver detalles</p>
          </div>
        </div>
        <button 
          onClick={handleNew}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Nuevo Registro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Peso</th>
                <th className="px-6 py-4">Talla</th>
                <th className="px-6 py-4">IMC</th>
                <th className="px-6 py-4 text-center">Meta</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patient.measurements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No hay registros antropométricos aún.</p>
                  </td>
                </tr>
              ) : (
                [...patient.measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((m) => (
                  <tr 
                    key={m.date}
                    onClick={() => handleEdit(m)}
                    className="group hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-1.5 rounded group-hover:bg-emerald-100 transition-colors">
                          <Calculator className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                        </div>
                        <span className="font-bold text-slate-700">
                          {new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{m.weight} kg</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{m.height} cm</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 font-bold">{m.imc || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {m.metaComplied ? (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <span className="text-slate-200">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
