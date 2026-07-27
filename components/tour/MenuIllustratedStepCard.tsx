import React from 'react';
import { ChevronLeft, ChevronRight, EyeOff, X } from 'lucide-react';
import { MenuSheetDiagram } from './MenuSheetDiagram';

interface MenuIllustratedStepCardProps {
  variant: 'hoja1' | 'hoja2' | 'hoja3';
  title: string;
  body: string;
  stepLabel: string;
  canGoBack: boolean;
  nextLabel?: string;
  onNext: () => void;
  onBack: () => void;
  onPauseLater: () => void;
  onCloseCorner: () => void;
}

// Variante ilustrada de la tarjeta de guía: diagrama de la hoja del menú a la
// izquierda, título + descripción a la derecha. Solo se usa en los pasos
// introductorios que explican la estructura del menú (Hoja 1/2/3) — siempre
// centrada, no depende de ningún elemento de la página.
export const MenuIllustratedStepCard: React.FC<MenuIllustratedStepCardProps> = ({
  variant, title, body, stepLabel, canGoBack, nextLabel = 'Siguiente',
  onNext, onBack, onPauseLater, onCloseCorner,
}) => (
  <div
    style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}
    className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[580px] max-w-[94vw]"
  >
    <button
      onClick={onCloseCorner}
      className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>

    <div className="mb-2 pr-6">
      <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">{stepLabel}</span>
    </div>

    <div className="flex gap-4 items-start">
      <MenuSheetDiagram variant={variant} />
      <div className="flex-1 min-w-0 pt-1">
        <h3 className="font-bold text-slate-900 text-base mb-1.5">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
      </div>
    </div>

    <div className={`flex items-center gap-2 mt-4 ${canGoBack ? 'justify-end' : 'justify-between'}`}>
      {!canGoBack && (
        <button
          onClick={onPauseLater}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5" /> Ocultar guías
        </button>
      )}
      <div className="flex items-center gap-2">
        {canGoBack && (
          <button onClick={onBack} className="flex items-center gap-1 px-2 py-2 rounded-lg text-slate-500 hover:bg-slate-100 text-sm font-semibold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
        )}
        <button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all"
        >
          {nextLabel} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);
