import React, { useMemo } from 'react';
import { Patient, Measurement } from '../../types';
import { History, Calculator } from 'lucide-react';
import { MeasurementsCard } from './MeasurementsCard';

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800 mb-4">
          <History className="w-5 h-5" />
          <h3 className="font-bold text-base">Historial de Medidas Antropométricas</h3>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm italic">
          No hay registros antropométricos aún.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-800 mb-6">
        <History className="w-5 h-5" />
        <h3 className="font-bold text-base">Medidas Antropométricas</h3>
      </div>
      
      <div className="space-y-6">
        {sorted.map((m) => (
          <MeasurementsCard 
            key={m.id} 
            record={m} 
            onEdit={onEdit} 
          />
        ))}
      </div>
    </div>
  );
};
