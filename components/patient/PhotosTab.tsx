
import React from 'react';
import { Patient } from '../../types';
import { Image as ImageIcon } from 'lucide-react';
import { FileGallery } from './FileGallery';

interface PhotosTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
}

export const PhotosTab: React.FC<PhotosTabProps> = ({ patient, onUpdate }) => {
  const handleUpdateFiles = (newFiles: any[]) => {
    onUpdate({
      ...patient,
      photos: newFiles
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">
      <FileGallery 
        files={patient.photos} 
        onUpdate={handleUpdateFiles} 
        title="Galería de Progreso" 
        icon={ImageIcon} 
        accept="image/*"
      />
    </div>
  );
};
