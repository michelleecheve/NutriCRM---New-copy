import React, { useRef, useEffect, useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export const APPOINTMENT_STATUSES = ['Programada', 'Completada', 'Reagendada', 'Cancelada'] as const;
export type AppointmentStatusValue = typeof APPOINTMENT_STATUSES[number];

export const DEFAULT_STATUS_FILTER: string[] = ['Programada', 'Completada', 'Reagendada'];

export const STATUS_FILTER_STYLES: Record<AppointmentStatusValue, { dot: string; badge: string }> = {
  Programada: { dot: 'bg-blue-500', badge: 'bg-blue-50 border-blue-500 text-blue-800' },
  Completada: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-500 text-emerald-800' },
  Reagendada: { dot: 'bg-amber-500', badge: 'bg-amber-50 border-amber-500 text-amber-800' },
  Cancelada: { dot: 'bg-red-500', badge: 'bg-red-50 border-red-500 text-red-800' },
};

interface StatusFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleStatus = (status: string) => {
    onChange(
      value.includes(status) ? value.filter(s => s !== status) : [...value, status]
    );
  };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(o => !o); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
      >
        <Filter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filtrar</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1 animate-in fade-in zoom-in duration-150">
          {APPOINTMENT_STATUSES.map(status => (
            <label
              key={status}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(status)}
                onChange={() => toggleStatus(status)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30"
              />
              <span className={`w-2 h-2 rounded-full ${STATUS_FILTER_STYLES[status].dot}`} />
              {status}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
