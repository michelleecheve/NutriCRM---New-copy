import React from 'react';
import { Patient } from '../../types';
import { Image as ImageIcon } from 'lucide-react';
import { FileGallery } from './FileGallery';
import { store } from '../../services/store';

interface PhotosTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
}

export const PhotosTab: React.FC<PhotosTabProps> = ({ patient, onUpdate }) => {
  const handleUpdateFiles = (newFiles: any[]) => {
    const updated = { ...patient, photos: newFiles };
    onUpdate(updated);
    store.updatePatient(updated);
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
        />
      </div>
    </div>
  );
};
