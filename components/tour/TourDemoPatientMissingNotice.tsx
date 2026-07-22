import React from 'react';

interface TourDemoPatientMissingNoticeProps {
  onCreateNew: () => void;
  onPauseLater: () => void;
}

// Se muestra cuando el recorrido necesita saltar automáticamente al paciente de
// prueba (autoNavigate) pero ese paciente ya no existe (fue eliminado desde su
// pestaña Configuración). Sin este aviso, el overlay del tour simplemente
// desaparecía sin explicación. No depende de ni modifica ninguna otra página.
export const TourDemoPatientMissingNotice: React.FC<TourDemoPatientMissingNoticeProps> = ({
  onCreateNew, onPauseLater,
}) => (
  <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
      <h3 className="font-bold text-slate-900 text-base mb-2">Tu paciente de prueba ya no existe</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        Parece que eliminaste al paciente de prueba que creaste en el Capítulo 1. Crea uno nuevo para poder continuar el recorrido.
      </p>
      <button
        onClick={onCreateNew}
        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all mb-2"
      >
        Crear un nuevo paciente de prueba
      </button>
      <button
        onClick={onPauseLater}
        className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors"
      >
        Continuar después
      </button>
    </div>
  </div>
);
