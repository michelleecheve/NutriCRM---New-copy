
import React from 'react';
import { Patient } from '../../types';
import { Microscope } from 'lucide-react';
import { FileGallery } from './FileGallery';

interface LabsTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
}

export const LabsTab: React.FC<LabsTabProps> = ({ patient, onUpdate }) => {
  const handleUpdateFiles = (newFiles: any[]) => {
    onUpdate({
      ...patient,
      labs: newFiles
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">
      <FileGallery 
        files={patient.labs} 
        onUpdate={handleUpdateFiles} 
        title="Resultados de Laboratorio" 
        icon={Microscope} 
      />
    </div>
  );
};
