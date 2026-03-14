import React, { useMemo } from 'react';
import { Patient, Measurement } from '../../types';
import { Calculator, ChevronRight, Star } from 'lucide-react';

export const MeasurementsHistory: React.FC<{
  patient: Patient;
  onEdit: (m: Measurement) => void;
}> = ({ patient, onEdit }) => {
  const sorted = useMemo(
    () => [...patient.measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [patient.measurements]
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No hay registros antropométricos aún.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((m) => (
        <button
          key={m.id} // <--- SOLO el id!
          type="button"
          onClick={() => onEdit(m)}
          className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <Calculator className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</div>
                <div className="font-extrabold text-slate-800">
                  {new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors mt-1" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Peso</div>
              <div className="font-bold text-slate-800">{m.weight ?? '-'} kg</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Talla</div>
              <div className="font-bold text-slate-800">{m.height ?? '-'} cm</div>
            </div>

            <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">IMC</div>
              <div className="font-extrabold text-emerald-700">{m.imc !== undefined && m.imc !== null ? m.imc.toFixed(2) : '-'}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500">
              {m.metaComplied ? 'Meta cumplida' : 'Meta no cumplida'}
            </div>
            <div>
              {m.metaComplied ? (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ) : (
                <Star className="w-4 h-4 text-slate-200" />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};