
import React from 'react';
import { Edit2 } from 'lucide-react';

export const GridInput = ({ label, value, onChange, type = "text", placeholder = "-", readOnly=false }: any) => (
  <div className="flex flex-col min-w-0">
    <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full max-w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 ${readOnly ? 'cursor-default' : 'focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
    />
  </div>
);

export const SectionHeader = ({ icon: Icon, title, onEdit }: any) => (
  <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
    <div className="flex items-center gap-2 text-emerald-800">
      <Icon className="w-5 h-5" />
      <h3 className="font-bold text-base">{title}</h3>
    </div>
    {onEdit && (
      <button className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:text-emerald-700 transition-colors">
        <Edit2 className="w-3 h-3" /> Editar Datos
      </button>
    )}
  </div>
);

export const ModernTextArea = ({ label, value, onChange, rows = 3 }: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-slate-500 mb-1.5">{label}</label>
    <textarea 
      rows={rows}
      value={value} 
      onChange={onChange}
      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none" 
    />
  </div>
);
