import React from 'react';
import { Patient } from '../../types';
import { BioimpedanciaTable } from './BioimpedanciaTable';
import { BioimpedanciaHistory } from './BioimpedanciaHistory';

export const BioimpedanciaSection: React.FC<{ 
  patient: Patient; 
  onUpdate: (p: Patient) => void;
  onEdit?: (id: string) => void;
}> = ({ patient, onUpdate, onEdit }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 1. Tabla de Comparación */}
      <BioimpedanciaTable patient={patient} />

      {/* 2. Historial de Medidas */}
      <div className="space-y-4">
        <div className="px-1">
          <h3 className="font-bold text-lg text-slate-800">Historial de Medidas</h3>
          <p className="text-xs text-slate-400">Haga clic en un registro para ver detalles</p>
        </div>
        <BioimpedanciaHistory patient={patient} onEdit={onEdit} />
      </div>
    </div>
  );
};
