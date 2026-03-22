import React from 'react';
import { Patient } from '../../types';
import { History } from 'lucide-react';
import { BioimpedanciaCard } from './BioimpedanciaCard';

export const BioimpedanciaHistory: React.FC<{ 
  patient: Patient;
  onEdit?: (id: string) => void;
}> = ({ patient, onEdit }) => {
  const records = [...(patient.bioimpedancias || [])].sort((a, b) => b.date.localeCompare(a.date));

  if (records.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-blue-800 mb-4">
          <History className="w-5 h-5" />
          <h3 className="font-bold text-base">Historial de Medidas Bioimpedancia</h3>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm italic">
          No hay registros de bioimpedancia para este paciente.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-blue-800 mb-6">
        <History className="w-5 h-5" />
        <h3 className="font-bold text-base">Medidas Bioimpedancia</h3>
      </div>
      
      <div className="space-y-6">
        {records.map((record) => (
          <BioimpedanciaCard 
            key={record.id} 
            record={record} 
            onEdit={onEdit} 
          />
        ))}
      </div>
    </div>
  );
};
