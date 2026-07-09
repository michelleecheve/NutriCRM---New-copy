import React, { useState } from 'react';
import { Sparkles, Compass } from 'lucide-react';
import { TourResumeNotice } from './TourResumeNotice';

interface WelcomeAnnouncementProps {
  onStartTour: () => void;
  onLater: () => void;
  onNeverShowAgain: () => void;
}

// Anuncio de bienvenida en Inicio: se muestra cada vez que se carga la página
// hasta que el usuario elige "No volver a preguntar" (o completa el recorrido).
// No depende de ni modifica ninguna página existente.
export const WelcomeAnnouncement: React.FC<WelcomeAnnouncementProps> = ({
  onStartTour, onLater, onNeverShowAgain,
}) => {
  const [dismissNote, setDismissNote] = useState<'later' | 'forever' | null>(null);

  const handleFinishDismiss = () => {
    if (dismissNote === 'forever') onNeverShowAgain();
    else onLater();
    setDismissNote(null);
  };

  if (dismissNote) {
    return <TourResumeNotice onClose={handleFinishDismiss} />;
  }

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">¡Bienvenido a NutriFollow!</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Para empezar a familiarizarte con el sistema te recomendamos presionar el botón <span className="font-bold text-slate-800">"Guía de esta página"</span> cada vez que entres a una página nueva, para saber cómo funciona.
        </p>

        <div className="flex justify-center mb-4">
          <div className="pointer-events-none flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-sm">
            <Compass className="w-4 h-4 text-emerald-400" />
            Guía de esta página
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          También te recomendamos hacer el recorrido guiado para aprender el flujo completo: desde registrar un paciente con su información, medidas y archivos, hasta completar su menú y compartir el link de su menú digital, en pocos pasos.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onStartTour}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> Iniciar recorrido guiado
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setDismissNote('later')}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
            >
              Tal vez más tarde
            </button>
            <button
              onClick={() => setDismissNote('forever')}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all"
            >
              No volver a preguntar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
