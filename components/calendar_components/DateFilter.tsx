import React, { useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export type DatePreset = '1m' | '3m' | '6m' | 'year' | 'custom' | 'all';

export const PRESET_LABELS: Record<DatePreset, string> = {
  all:    'Todas',
  '1m':   'Mes Actual',
  '3m':   'Últimos 3 meses',
  '6m':   'Últimos 6 meses',
  year:   `Año ${new Date().getFullYear()}`,
  custom: 'Rango personalizado',
};

export const getPresetRange = (preset: DatePreset): { from: string; to: string } | null => {
  if (preset === 'all' || preset === 'custom') return null;
  const to   = new Date();
  const from = new Date();
  if (preset === '1m')   { from.setDate(1); }
  if (preset === '3m')   { from.setMonth(from.getMonth() - 2); from.setDate(1); }
  if (preset === '6m')   { from.setMonth(from.getMonth() - 5); from.setDate(1); }
  if (preset === 'year') { from.setMonth(0); from.setDate(1); }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
};

interface DateFilterProps {
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** Whether a non-default filter is active (used to highlight the button) */
  isFiltered?: boolean;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  activePreset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  isOpen,
  onToggle,
  onClose,
  isFiltered = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
          isFiltered
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Fecha: </span>{PRESET_LABELS[activePreset]}
        <ChevronDown className={`hidden sm:block w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-150">
          <div className="p-1">
            {(['all', '1m', '3m', '6m', 'year'] as DatePreset[]).map(p => (
              <button
                key={p}
                onClick={() => { onPresetChange(p); if (p !== 'custom') onClose(); }}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                  activePreset === p ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
            <button
              onClick={() => onPresetChange('custom')}
              className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                activePreset === 'custom' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {PRESET_LABELS['custom']}
            </button>
          </div>

          {activePreset === 'custom' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
              <div className="min-w-0">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => onCustomFromChange(e.target.value)}
                  className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => onCustomToChange(e.target.value)}
                  className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                onClick={onClose}
                className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
