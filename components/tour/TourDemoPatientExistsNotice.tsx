import React from 'react';

interface TourDemoPatientExistsNoticeProps {
  patientName: string;
  onSkip: () => void;
  onCreateNew: () => void;
}

// Se muestra al llegar al paso de "crear paciente" del Capítulo 1 cuando ya existe
// un paciente de prueba (ej. el usuario reinició el capítulo sin haberlo eliminado).
// Evita que tenga que crear un paciente duplicado solo para poder avanzar. No
// depende de ni modifica ninguna otra página.
export const TourDemoPatientExistsNotice: React.FC<TourDemoPatientExistsNoticeProps> = ({
  patientName, onSkip, onCreateNew,
}) => (
  <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
      <h3 className="font-bold text-slate-900 text-base mb-2">Ya tienes un paciente de prueba</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        Ya habías creado a <span className="font-bold text-slate-800">{patientName}</span> como paciente de prueba. Puedes seguir usándolo y saltarte este paso, o crear uno nuevo si prefieres.
      </p>
      <button
        onClick={onSkip}
        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all mb-2"
      >
        Ya lo tengo, continuar al siguiente paso
      </button>
      <button
        onClick={onCreateNew}
        className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors"
      >
        Crear un paciente nuevo de todas formas
      </button>
    </div>
  </div>
);
