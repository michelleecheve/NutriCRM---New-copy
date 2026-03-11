import React, { useState } from 'react';
import { CalendarDays, ChevronDown, Check } from 'lucide-react';
import { AppUser } from '../../types';

interface CalendarSelectorProps {
  linkedNutritionists: AppUser[];
  selectedNutritionistId: string;
  onNutritionistChange: (nutritionistId: string) => void;
}

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  linkedNutritionists,
  selectedNutritionistId,
  onNutritionistChange,
}) => {
  const [open, setOpen] = useState(false);

  if (linkedNutritionists.length === 0) return null;

  const selected = linkedNutritionists.find(n => n.id === selectedNutritionistId) ?? linkedNutritionists[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap shadow-sm">
      {/* Icon + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Viendo calendario de</p>
          <p className="text-sm font-bold text-slate-800 truncate">
            {selected.profile.professionalTitle} {selected.profile.name}
          </p>
        </div>
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
        >
          Elegir Calendario
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

            {/* Dropdown panel */}
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-slate-200 rounded-2xl shadow-xl min-w-[220px] overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-2">
                Nutricionistas Vinculadas
              </p>
              {linkedNutritionists.map(nutri => {
                const isSelected = nutri.id === selectedNutritionistId;
                return (
                  <button
                    key={nutri.id}
                    onClick={() => {
                      onNutritionistChange(nutri.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {nutri.profile.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{nutri.profile.name}</p>
                      <p className="text-xs text-slate-500">{nutri.profile.specialty}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};