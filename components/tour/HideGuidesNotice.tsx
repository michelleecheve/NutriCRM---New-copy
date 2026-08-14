import React from 'react';

interface HideGuidesNoticeProps {
  onClose: () => void;
}

// Nota informativa que aparece al hacer clic en "Quitar botones de guía" dentro de
// una guía de página: no oculta nada por sí misma, solo indica dónde hacerlo (el
// switch real vive en la página de Ayuda, ver TourProfileSection). No depende de ni
// modifica ninguna otra página.
export const HideGuidesNotice: React.FC<HideGuidesNoticeProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        Si ya conoces muy bien NutriFollow, puedes ocultar estos botones desde la página de <span className="font-bold text-slate-800">Ayuda</span>.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all"
      >
        Entendido
      </button>
    </div>
  </div>
);
