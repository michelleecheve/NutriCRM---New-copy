
import React, { useMemo, useState, useEffect } from 'react';
import { Info, Calculator, Variable, X, ClipboardList } from 'lucide-react';
import { VetCalculation, MacrosRecord, PortionsRecord, MacroRecord } from '../../types';

const ACTIVITY_FACTORS = {
  Femenino: {
    'Muy Leve': 1.3,
    'Leve': 1.5,
    'Moderado': 1.6,
    'Intenso': 1.9,
    'Excepcional': 2.2
  },
  Masculino: {
    'Muy Leve': 1.3,
    'Leve': 1.6,
    'Moderado': 1.7,
    'Intenso': 2.1,
    'Excepcional': 2.4
  }
};

const FORMULAS = {
  TMB_FEM: '665.1 + (9.56 × peso) + (1.85 × talla) - (4.68 × edad)',
  TMB_MASC: '66.47 + (13.7 × peso) + (5 × talla) - (6.76 × edad)',
  GET: 'TMB × Factor de Actividad',
  MACRO_KCAL: 'kcalToWork × % / 100',
  MACRO_G_CHO: 'Kcal / 4',
  MACRO_G_CHON: 'Kcal / 4',
  MACRO_G_FAT: 'Kcal / 9'
};

const EXCHANGE_LIST = {
  lec: { name: 'LEC', kcal: 150, cho: 12, chon: 7, fat: 8 },
  lecDesc: { name: 'LEC DESC', kcal: 90, cho: 12, chon: 7, fat: 1 },
  fru: { name: 'FRU', kcal: 60, cho: 15, chon: 0, fat: 0 },
  veg: { name: 'VEG', kcal: 25, cho: 5, chon: 2, fat: 0 },
  cer: { name: 'CER', kcal: 80, cho: 15, chon: 6, fat: 0 },
  carMagra: { name: 'CAR Magra', kcal: 55, cho: 0, chon: 7, fat: 3 },
  carSemi: { name: 'CAR Semi Grasa', kcal: 75, cho: 0, chon: 7, fat: 5 },
  carAlta: { name: 'CAR Alta en Grasa', kcal: 100, cho: 0, chon: 7, fat: 8 },
  gra: { name: 'GRA', kcal: 45, cho: 0, chon: 0, fat: 5 },
  azu: { name: 'AZU', kcal: 45, cho: 12, chon: 0, fat: 0 },
};

const Tooltip = ({ children, content }: { children: React.ReactNode, content: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1 group">
      <div 
        onMouseEnter={() => setShow(true)} 
        onMouseLeave={() => setShow(false)}
        className="cursor-help text-slate-400 hover:text-emerald-600 transition-colors"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl min-w-[200px] animate-in fade-in zoom-in duration-200">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

interface MenuAddReadSec1Props {
  vetData: VetCalculation;
  setVetData: React.Dispatch<React.SetStateAction<VetCalculation>>;
  macros: MacrosRecord;
  setMacros: React.Dispatch<React.SetStateAction<MacrosRecord>>;
  portions: PortionsRecord;
  setPortions: React.Dispatch<React.SetStateAction<PortionsRecord>>;
}

export const MenuAddReadSec1: React.FC<MenuAddReadSec1Props> = ({
  vetData,
  setVetData,
  macros,
  setMacros,
  portions,
  setPortions
}) => {
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // Recalculate VET in real-time
  const calculatedVet = useMemo(() => {
    const factor = ACTIVITY_FACTORS[vetData.sex][vetData.activityLevel];
    
    let tmb = 0;
    if (vetData.sex === 'Femenino') {
      tmb = 665.1 + (9.56 * vetData.weight) + (1.85 * vetData.height) - (4.68 * vetData.age);
    } else {
      tmb = 66.47 + (13.7 * vetData.weight) + (5 * vetData.height) - (6.76 * vetData.age);
    }

    const kcalReal = tmb * factor;

    return {
      ...vetData,
      activityFactor: factor,
      kcal: tmb,
      kcalReal: kcalReal
    };
  }, [vetData.age, vetData.weight, vetData.height, vetData.sex, vetData.activityLevel]);

  // Sync calculated values back to state if they change (except kcalToWork which is manual)
  useEffect(() => {
    if (
      calculatedVet.activityFactor !== vetData.activityFactor ||
      calculatedVet.kcal !== vetData.kcal ||
      calculatedVet.kcalReal !== vetData.kcalReal
    ) {
      setVetData(prev => ({
        ...prev,
        activityFactor: calculatedVet.activityFactor,
        kcal: calculatedVet.kcal,
        kcalReal: calculatedVet.kcalReal
      }));
    }
  }, [calculatedVet]);

  // Recalculate Macros in real-time
  const calculatedMacros = useMemo(() => {
    const baseKcal = macros.totalKcal || vetData.kcalToWork || 0;
    
    const calculateRow = (pct: number, divisor: number): MacroRecord => {
      const kcal = (baseKcal * pct) / 100;
      const g = kcal / divisor;
      return { pct, kcal, g };
    };

    return {
      cho: { ...macros.cho, ...calculateRow(macros.cho.pct, 4) },
      chon: { ...macros.chon, ...calculateRow(macros.chon.pct, 4) },
      fat: { ...macros.fat, ...calculateRow(macros.fat.pct, 9) },
      totalKcal: macros.totalKcal
    };
  }, [macros.cho.pct, macros.chon.pct, macros.fat.pct, macros.totalKcal, vetData.kcalToWork]);

  // Sync calculated macros back to state
  useEffect(() => {
    if (
      calculatedMacros.cho.kcal !== macros.cho.kcal ||
      calculatedMacros.chon.kcal !== macros.chon.kcal ||
      calculatedMacros.fat.kcal !== macros.fat.kcal
    ) {
      setMacros(prev => ({
        ...prev,
        cho: { ...prev.cho, ...calculatedMacros.cho },
        chon: { ...prev.chon, ...calculatedMacros.chon },
        fat: { ...prev.fat, ...calculatedMacros.fat }
      }));
    }
  }, [calculatedMacros]);

  // Update totalKcal when kcalToWork changes
  useEffect(() => {
    if (vetData.kcalToWork > 0) {
      setMacros(prev => ({ ...prev, totalKcal: vetData.kcalToWork }));
    }
  }, [vetData.kcalToWork]);

  const updateVetField = (field: keyof VetCalculation, value: any) => {
    setVetData(prev => ({ ...prev, [field]: value }));
  };

  const updateMacroField = (macro: 'cho' | 'chon' | 'fat', field: keyof MacroRecord, value: any) => {
    setMacros(prev => ({
      ...prev,
      [macro]: { ...prev[macro], [field]: value }
    }));
  };

  const updatePortionField = (group: keyof PortionsRecord, value: number) => {
    setPortions(prev => ({ ...prev, [group]: value }));
  };

  const totalPct = macros.cho.pct + macros.chon.pct + macros.fat.pct;

  // Portions Calculations
  const portionsTotals = useMemo(() => {
    return Object.entries(portions).reduce((acc, [key, val]) => {
      const ref = EXCHANGE_LIST[key as keyof typeof EXCHANGE_LIST];
      const v = val as number;
      acc.kcal += v * ref.kcal;
      acc.cho += v * ref.cho;
      acc.chon += v * ref.chon;
      acc.fat += v * ref.fat;
      return acc;
    }, { kcal: 0, cho: 0, chon: 0, fat: 0 });
  }, [portions]);

  const adequacy = useMemo(() => {
    const targetKcal = vetData.kcalToWork || 1;
    const targetCho = macros.cho.g || 1;
    const targetChon = macros.chon.g || 1;
    const targetFat = macros.fat.g || 1;

    return {
      kcal: (portionsTotals.kcal / targetKcal) * 100,
      cho: (portionsTotals.cho / targetCho) * 100,
      chon: (portionsTotals.chon / targetChon) * 100,
      fat: (portionsTotals.fat / targetFat) * 100
    };
  }, [portionsTotals, vetData.kcalToWork, macros]);

  const realMacrosPct = useMemo(() => {
    const totalGrams = portionsTotals.cho + portionsTotals.chon + portionsTotals.fat || 1;

    return {
      cho: (portionsTotals.cho * 100) / totalGrams,
      chon: (portionsTotals.chon * 100) / totalGrams,
      fat: (portionsTotals.fat * 100) / totalGrams
    };
  }, [portionsTotals]);

  const getAdequacyColor = (val: number) => (val >= 95 && val <= 105 ? 'text-emerald-600' : 'text-red-500');

  return (
    <div className="p-8 space-y-12 animate-in slide-in-from-top-2 duration-300">
      {/* Sub-sección 1: Cálculo VET */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Sub-sección 1 — Cálculo VET</h3>
          <div className="h-px flex-1 bg-slate-100"></div>
        </div>

        {/* Fila 1: Manual Fields */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Edad</label>
            <input 
              type="number"
              value={vetData.age || ''}
              onChange={(e) => updateVetField('age', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Peso kg</label>
            <input 
              type="number"
              step="0.1"
              value={vetData.weight || ''}
              onChange={(e) => updateVetField('weight', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Talla cm</label>
            <input 
              type="number"
              step="0.1"
              value={vetData.height || ''}
              onChange={(e) => updateVetField('height', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Género</label>
            <select 
              value={vetData.sex}
              onChange={(e) => updateVetField('sex', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nivel de Actividad</label>
            <select 
              value={vetData.activityLevel}
              onChange={(e) => updateVetField('activityLevel', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="Muy Leve">Muy Leve</option>
              <option value="Leve">Leve</option>
              <option value="Moderado">Moderado</option>
              <option value="Intenso">Intenso</option>
              <option value="Excepcional">Excepcional</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Calculated Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 space-y-1">
            <div className="flex items-center">
              <label className="text-xs font-bold text-emerald-800 uppercase">Factor de Actividad</label>
              <Tooltip content={
                <div className="space-y-2">
                  <p className="font-bold border-b border-white/20 pb-1 mb-1">Factores de Actividad</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="opacity-60">Muy Leve:</span> <span>1.3 / 1.3</span>
                    <span className="opacity-60">Leve:</span> <span>1.5 / 1.6</span>
                    <span className="opacity-60">Moderado:</span> <span>1.6 / 1.7</span>
                    <span className="opacity-60">Intenso:</span> <span>1.9 / 2.1</span>
                    <span className="opacity-60">Excepcional:</span> <span>2.2 / 2.4</span>
                  </div>
                  <p className="text-[10px] opacity-40 mt-2">(Femenino / Masculino)</p>
                </div>
              }>
                <Info className="w-3.5 h-3.5" />
              </Tooltip>
            </div>
            <div className="text-2xl font-bold text-emerald-700">{vetData.activityFactor.toFixed(2)}</div>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 space-y-1">
            <div className="flex items-center">
              <label className="text-xs font-bold text-emerald-800 uppercase">KCAL (TMB)</label>
              <div className="flex items-center gap-1">
                <Tooltip content="TMB — Tasa Metabólica Basal según la fórmula Harris-Benedict">
                  <Info className="w-3.5 h-3.5" />
                </Tooltip>
                <Tooltip content={vetData.sex === 'Femenino' ? FORMULAS.TMB_FEM : FORMULAS.TMB_MASC}>
                  <Variable className="w-3.5 h-3.5" />
                </Tooltip>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700">{Math.round(vetData.kcal)}</div>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 space-y-1">
            <div className="flex items-center">
              <label className="text-xs font-bold text-emerald-800 uppercase">KCAL Real (GET)</label>
              <div className="flex items-center gap-1">
                <Tooltip content="Resultado del gasto energético total según nivel de actividad física">
                  <Info className="w-3.5 h-3.5" />
                </Tooltip>
                <Tooltip content={FORMULAS.GET}>
                  <Variable className="w-3.5 h-3.5" />
                </Tooltip>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700">{Math.round(vetData.kcalReal)}</div>
          </div>
        </div>

        {/* Fila 3: KCAL a Trabajar */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">KCAL a Trabajar</label>
          <input 
            type="number"
            placeholder="Ingresa las calorías objetivo..."
            value={vetData.kcalToWork || ''}
            onChange={(e) => updateVetField('kcalToWork', parseInt(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400 ml-1 italic">
            * Este valor será la base para la distribución de macronutrientes y el diseño del menú.
          </p>
        </div>
      </div>

      {/* Sub-sección 2: Distribución de Calorías */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Sub-sección 2 — Distribución de Calorías</h3>
          <div className="h-px flex-1 bg-slate-100"></div>
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nutriente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">%</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kcal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gramos</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* CHO Row */}
              <tr>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">CHO</span>
                    <span className="text-[10px] text-slate-400 font-medium">(Carbohidratos)</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    value={macros.cho.pct}
                    onChange={(e) => updateMacroField('cho', 'pct', parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-600">{Math.round(macros.cho.kcal)}</span>
                    <Tooltip content={FORMULAS.MACRO_KCAL}><Variable className="w-3 h-3 text-slate-300" /></Tooltip>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-600">{macros.cho.g.toFixed(1)}</span>
                    <Tooltip content={FORMULAS.MACRO_G_CHO}><Variable className="w-3 h-3 text-slate-300" /></Tooltip>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text"
                    value={macros.cho.notes || ''}
                    onChange={(e) => updateMacroField('cho', 'notes', e.target.value)}
                    placeholder="Notas..."
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 outline-none text-sm py-1 transition-all"
                  />
                </td>
              </tr>

              {/* CHON Row */}
              <tr>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">CHON</span>
                    <span className="text-[10px] text-slate-400 font-medium">(Proteína)</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    value={macros.chon.pct}
                    onChange={(e) => updateMacroField('chon', 'pct', parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-600">{Math.round(macros.chon.kcal)}</span>
                    <Tooltip content={FORMULAS.MACRO_KCAL}><Variable className="w-3 h-3 text-slate-300" /></Tooltip>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-600">{macros.chon.g.toFixed(1)}</span>
                    <Tooltip content={FORMULAS.MACRO_G_CHON}><Variable className="w-3 h-3 text-slate-300" /></Tooltip>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text"
                    value={macros.chon.notes || ''}
                    onChange={(e) => updateMacroField('chon', 'notes', e.target.value)}
                    placeholder="Notas..."
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 outline-none text-sm py-1 transition-all"
                  />
                </td>
              </tr>

              {/* FAT Row */}
              <tr>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">FAT</span>
                    <span className="text-[10px] text-slate-400 font-medium">(Grasa)</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    value={macros.fat.pct}
                    onChange={(e) => updateMacroField('fat', 'pct', parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-600">{Math.round(macros.fat.kcal)}</span>
                    <Tooltip content={FORMULAS.MACRO_KCAL}><Variable className="w-3 h-3 text-slate-300" /></Tooltip>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-600">{macros.fat.g.toFixed(1)}</span>
                    <Tooltip content={FORMULAS.MACRO_G_FAT}><Variable className="w-3 h-3 text-slate-300" /></Tooltip>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text"
                    value={macros.fat.notes || ''}
                    onChange={(e) => updateMacroField('fat', 'notes', e.target.value)}
                    placeholder="Notas..."
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 outline-none text-sm py-1 transition-all"
                  />
                </td>
              </tr>

              {/* Totals Row */}
              <tr className="bg-slate-50/80 font-bold">
                <td className="px-6 py-4 text-slate-500 uppercase text-[10px]">Totales</td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${totalPct !== 100 ? 'text-orange-500' : 'text-emerald-600'}`}>
                    {totalPct}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    value={macros.totalKcal || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setMacros(prev => ({ ...prev, totalKcal: val }));
                    }}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-400">
                    {(macros.cho.g + macros.chon.g + macros.fat.g).toFixed(1)}g
                  </span>
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sub-sección 3: Distribución de Nutrientes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Sub-sección 3 — Distribución de Nutrientes</h3>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>
          <button 
            onClick={() => setShowExchangeModal(true)}
            className="ml-4 flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" /> 📋 Ver Lista de Intercambio
          </button>
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Porciones</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kcal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CHO</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CHON</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">FAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(EXCHANGE_LIST).map(([key, ref]) => (
                <tr key={key}>
                  <td className="px-6 py-3 text-sm font-bold text-slate-700">{ref.name}</td>
                  <td className="px-6 py-3">
                    <input 
                      type="number"
                      step="0.5"
                      value={portions[key as keyof PortionsRecord] || ''}
                      onChange={(e) => updatePortionField(key as keyof PortionsRecord, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{Math.round((portions[key as keyof PortionsRecord] || 0) * ref.kcal)}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{Math.round((portions[key as keyof PortionsRecord] || 0) * ref.cho)}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{Math.round((portions[key as keyof PortionsRecord] || 0) * ref.chon)}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{Math.round((portions[key as keyof PortionsRecord] || 0) * ref.fat)}</td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-emerald-50/50 font-bold border-t-2 border-emerald-100">
                <td className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase">Total</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm text-emerald-700">{Math.round(portionsTotals.kcal)}</td>
                <td className="px-6 py-4 text-sm text-emerald-700">{Math.round(portionsTotals.cho)}g</td>
                <td className="px-6 py-4 text-sm text-emerald-700">{Math.round(portionsTotals.chon)}g</td>
                <td className="px-6 py-4 text-sm text-emerald-700">{Math.round(portionsTotals.fat)}g</td>
              </tr>

              {/* Adequacy Row */}
              <tr className="bg-emerald-50/50 font-bold">
                <td className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase">% Adecuación</td>
                <td className="px-6 py-4"></td>
                <td className={`px-6 py-4 text-sm ${getAdequacyColor(adequacy.kcal)}`}>{adequacy.kcal.toFixed(1)}%</td>
                <td className={`px-6 py-4 text-sm ${getAdequacyColor(adequacy.cho)}`}>{adequacy.cho.toFixed(1)}%</td>
                <td className={`px-6 py-4 text-sm ${getAdequacyColor(adequacy.chon)}`}>{adequacy.chon.toFixed(1)}%</td>
                <td className={`px-6 py-4 text-sm ${getAdequacyColor(adequacy.fat)}`}>{adequacy.fat.toFixed(1)}%</td>
              </tr>

              {/* Difference Row */}
              <tr className="bg-emerald-50/50 font-bold">
                <td className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase">Diferencia Kcal</td>
                <td className="px-6 py-4"></td>
                <td className={`px-6 py-4 text-sm ${(vetData.kcalToWork - portionsTotals.kcal) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {Math.round(vetData.kcalToWork - portionsTotals.kcal)}
                </td>
                <td colSpan={3} className="px-6 py-4"></td>
              </tr>

              {/* Real Macros Row */}
              <tr className="bg-emerald-50/50 font-bold">
                <td className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase">% Real de Macros</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm text-slate-600">{realMacrosPct.cho.toFixed(1)}%</td>
                <td className="px-6 py-4 text-sm text-slate-600">{realMacrosPct.chon.toFixed(1)}%</td>
                <td className="px-6 py-4 text-sm text-slate-600">{realMacrosPct.fat.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Exchange List Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowExchangeModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Lista de Intercambio</h2>
              </div>
              <button 
                onClick={() => setShowExchangeModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-600 text-white">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-tl-xl">Grupo</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Kcal</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">CHO</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">CHON</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-tr-xl">FAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-xl">
                  {Object.values(EXCHANGE_LIST).map((ref, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-bold text-slate-700">{ref.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{ref.kcal}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{ref.cho}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{ref.chon}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{ref.fat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                onClick={() => setShowExchangeModal(false)}
                className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
