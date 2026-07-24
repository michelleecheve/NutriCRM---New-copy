import React from 'react';
import { X } from 'lucide-react';

interface MenuGuideHubProps {
  onPick: (section: 'sec1' | 'sec2' | 'sec3') => void;
  onClose: () => void;
}

const OPTIONS: { key: 'sec1' | 'sec2' | 'sec3'; step: string; label: string }[] = [
  { key: 'sec1', step: 'Paso 1', label: 'Cálculo Nutricional' },
  { key: 'sec2', step: 'Paso 2', label: 'Plantilla + Referencias' },
  { key: 'sec3', step: 'Paso 3', label: 'Edición y Preview' },
];

// Pantalla intermedia del tour de MenuAddRead: al terminar el recorrido introductorio
// (o al volver de cualquier sub-recorrido), el usuario elige qué sección profundizar
// a continuación. No depende de ningún target en la página — siempre se centra.
export const MenuGuideHub: React.FC<MenuGuideHubProps> = ({ onPick, onClose }) => (
  <div
    style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}
    className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[340px] max-w-[90vw]"
  >
    <button
      onClick={onClose}
      className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
    <div className="mb-2 pr-6">
      <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Guía de este formulario</span>
    </div>
    <h3 className="font-bold text-slate-900 text-base mb-1.5">Ahora profundicemos cada sección</h3>
    <p className="text-sm text-slate-600 leading-relaxed mb-4">
      Elige una sección para explorarla en detalle. Al terminar, volverás aquí para continuar con otra.
    </p>
    <div className="space-y-2">
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onPick(opt.key)}
          className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
        >
          <span className="block text-[11px] font-bold text-emerald-600 uppercase tracking-wide">{opt.step}</span>
          <span className="block text-sm font-bold text-slate-800">{opt.label}</span>
        </button>
      ))}
    </div>
    <button
      onClick={onClose}
      className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 font-semibold text-center transition-colors"
    >
      Salir de la guía
    </button>
  </div>
);
