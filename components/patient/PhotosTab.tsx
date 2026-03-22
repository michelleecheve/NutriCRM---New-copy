import React from 'react';
import { Patient } from '../../types';
import { Image as ImageIcon } from 'lucide-react';
import { FileGallery } from './FileGallery';

interface PhotosTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onNavigateToEvaluations: () => void;
}

export const PhotosTab: React.FC<PhotosTabProps> = ({ patient, onUpdate, onNavigateToEvaluations }) => {
  const handleUpdateFiles = (newFiles: any[]) => {
    onUpdate({ ...patient, photos: newFiles });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
        <FileGallery
          patientId={patient.id}
          files={patient.photos}
          onUpdate={handleUpdateFiles}
          title="Galería de Progreso"
          icon={ImageIcon}
          accept="image/*"
          onCreateEvaluation={onNavigateToEvaluations}
        />
      </div>
    </div>
  );
};