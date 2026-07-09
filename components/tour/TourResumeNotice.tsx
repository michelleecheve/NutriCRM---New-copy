import React from 'react';

interface TourResumeNoticeProps {
  onClose: () => void;
}

// Aviso corto reutilizado en varios puntos del tour: confirma dónde retomar
// el recorrido más tarde. No depende de ni modifica ninguna otra página.
export const TourResumeNotice: React.FC<TourResumeNoticeProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        Puedes continuar este recorrido cuando quieras desde la página de <span className="font-bold text-slate-800">Ayuda</span>, en el menú.
      </p>
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all"
      >
        Entendido
      </button>
    </div>
  </div>
);
