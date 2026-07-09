import React from 'react';
import { Compass } from 'lucide-react';
import { tourService } from '../../services/tourService';

interface TourResumeChipProps {
  onResume: () => void;
}

// Pill flotante y discreto: aparece cuando el recorrido guiado quedó pendiente
// (pausado, capítulo saltado, o el usuario dijo "ahora no") y todavía no se
// terminó del todo — para que siempre haya una forma de retomarlo.
export const TourResumeChip: React.FC<TourResumeChipProps> = ({ onResume }) => {
  const started = tourService.hasAnyProgress();
  const label = started
    ? `Continuar recorrido — Capítulo ${tourService.getCurrentChapterId()} de ${tourService.totalChapters}`
    : 'Iniciar recorrido guiado';

  return (
    <button
      onClick={onResume}
      className="fixed bottom-6 right-6 z-[9990] bg-slate-900 hover:bg-slate-800 text-white pl-3 pr-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold transition-all"
    >
      <Compass className="w-4 h-4 text-emerald-400" />
      {label}
    </button>
  );
};
