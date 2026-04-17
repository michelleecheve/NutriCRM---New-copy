import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { MenuPlanData } from '../MenuDesignTemplates';
import { DEFAULT_SECTION_TITLES } from '../../../types';

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
}

export const MenuTableHeaderSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData }) => {
  const [open, setOpen] = useState(true);
  const st = menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES;

  const [planTitle, setPlanTitle] = useState(st.planTitle);
  const [name, setName]           = useState(menuPreviewData.patient.name);
  const [age, setAge]             = useState(menuPreviewData.patient.age);
  const [weight, setWeight]       = useState(menuPreviewData.patient.weight);
  const [fatPct, setFatPct]       = useState(menuPreviewData.patient.fatPct);
  const [kcal, setKcal]           = useState(menuPreviewData.kcal);

  const commit = () => {
    setMenuPreviewData({
      ...menuPreviewData,
      kcal,
      patient: { ...menuPreviewData.patient, name, age, weight, fatPct },
      sectionTitles: { ...(menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES), planTitle },
    });
  };

  const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <User className="w-4 h-4 text-indigo-600" />
          Encabezado — Título del Plan y Paciente
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="p-4">
          <div className="flex items-start gap-2">
            <div className="space-y-1 w-44 flex-shrink-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título del Plan</label>
              <textarea
                rows={2}
                value={planTitle}
                onChange={e => setPlanTitle(e.target.value)}
                onBlur={commit}
                className={`${inp} resize-none`}
              />
              <p className="text-[10px] text-slate-400 italic">Enter = 2 líneas</p>
            </div>
            <div className="w-64 flex-shrink-0 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} onBlur={commit} className={inp} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Edad</label>
              <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} onBlur={commit}
                onWheel={e => (e.target as HTMLInputElement).blur()} className={inp} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))} onBlur={commit}
                onWheel={e => (e.target as HTMLInputElement).blur()} className={inp} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% Grasa</label>
              <input type="number" step="0.1" value={fatPct} onChange={e => setFatPct(Number(e.target.value))} onBlur={commit}
                onWheel={e => (e.target as HTMLInputElement).blur()} className={inp} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kcal</label>
              <input type="number" value={kcal} onChange={e => setKcal(Number(e.target.value))} onBlur={commit}
                onWheel={e => (e.target as HTMLInputElement).blur()} className={inp} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
