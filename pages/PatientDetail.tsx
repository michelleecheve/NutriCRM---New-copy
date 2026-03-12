import React, { useEffect, useState } from 'react';
import { Patient } from '../types';
import { store } from '../services/store';
import {
  ArrowLeft, AlertCircle, Activity, Calendar, Utensils, ChefHat,
  Microscope, Image as ImageIcon, Settings
} from 'lucide-react';

import { ClinicalTab } from '../components/patient/ClinicalTab';
import { DietaryTab } from '../components/patient/DietaryTab';
import { MeasurementsTab } from '../components/patient/MeasurementsTab';
import { MenusTab } from '../components/patient/MenusTab';
import { LabsTab } from '../components/patient/LabsTab';
import { PhotosTab } from '../components/patient/PhotosTab';
import { PatientConfigTab } from '../components/patient/PatientConfigTab';

// ✅ Nuevo tab
import { EvaluationsTab } from '../components/patient/EvaluationsTab';

type TabType =
  | 'clinical'
  | 'appointments'
  | 'dietary'
  | 'measurements'
  | 'menus'
  | 'labs'
  | 'photos'
  | 'config';

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('clinical');

  useEffect(() => {
    const p = store.getPatients().find(x => x.id === patientId) || null;
    setPatient(p);
  }, [patientId]);

  const handleUpdatePatient = async (updated: Patient) => {
    setPatient(updated);
    try {
      await store.updatePatient(updated);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>Paciente no encontrado</p>
        <button onClick={onBack} className="mt-4 text-emerald-600 font-bold hover:underline">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'clinical', label: 'Clínica', icon: Activity },
    // ✅ Citas -> Evaluaciones
    { id: 'appointments', label: 'Evaluaciones', icon: Calendar },
    { id: 'dietary', label: 'Evaluación Dietética', icon: Utensils },
    { id: 'measurements', label: 'Medidas', icon: Activity },
    { id: 'menus', label: 'Menús', icon: ChefHat },
    { id: 'labs', label: 'Laboratorios', icon: Microscope },
    { id: 'photos', label: 'Fotos', icon: ImageIcon },
    { id: 'config', label: 'Config.', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {patient.firstName} {patient.lastName}
          </h1>
        </div>
        <div className="ml-auto flex gap-3">
          {/* Actions */}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'clinical' && <ClinicalTab patient={patient} onUpdate={handleUpdatePatient} />}

        {/* ✅ Aquí cambia el tab */}
        {activeTab === 'appointments' && (
          <EvaluationsTab patientId={patient.id} patient={patient} onUpdate={handleUpdatePatient} />
        )}

        {activeTab === 'dietary' && <DietaryTab patient={patient} onUpdate={handleUpdatePatient} />}
        {activeTab === 'measurements' && <MeasurementsTab patient={patient} onUpdate={handleUpdatePatient} />}
        {activeTab === 'menus' && <MenusTab patient={patient} onUpdate={handleUpdatePatient} />}
        {activeTab === 'labs' && <LabsTab patient={patient} onUpdate={handleUpdatePatient} />}
        {activeTab === 'photos' && <PhotosTab patient={patient} onUpdate={handleUpdatePatient} />}
        {activeTab === 'config' && <PatientConfigTab patient={patient} onUpdate={handleUpdatePatient} />}
      </div>
    </div>
  );
};