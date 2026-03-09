
import React, { useRef, useState } from 'react';
import { Download, Upload, Settings, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Patient } from '../../types';
import { store } from '../../services/store';
import { getTodayStr } from '../../src/utils/dateUtils';

interface PatientConfigTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
}

export const PatientConfigTab: React.FC<PatientConfigTabProps> = ({ patient, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = () => {
    const dataStr = JSON.stringify(patient, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const user = store.getUserProfile();
    const exportFileDefaultName = `paciente_${patient.firstName}_${patient.lastName}_${getTodayStr(user.timezone)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedPatient = JSON.parse(content) as Patient;

        // Basic validation
        if (!importedPatient.id || !importedPatient.firstName || !importedPatient.lastName) {
          throw new Error('El archivo no tiene un formato de paciente válido.');
        }

        // Ensure the ID matches or handle as update for current patient
        // Usually, we want to update the CURRENT patient with the data from the file
        // but keep the current patient's ID if they differ? 
        // Or just overwrite everything. The user said "import this same format".
        
        const updatedPatient = {
          ...importedPatient,
          id: patient.id // Keep current ID to ensure we are updating the same record in store
        };

        onUpdate(updatedPatient);
        setImportStatus('success');
        
        // Auto-reload after a short delay to show success
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        setImportStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Error al importar el archivo.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="bg-slate-200 p-2 rounded-xl">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Configuración del Paciente</h3>
            <p className="text-sm text-slate-500">Gestiona los datos y la portabilidad de la información clínica.</p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Section */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-800">Exportar Datos</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Descarga una copia completa de toda la información de este paciente (clínica, menús, medidas, laboratorios, etc.) en formato JSON.
              </p>
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold py-3 rounded-xl transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Descargar JSON
              </button>
            </div>

            {/* Import Section */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-800">Importar Datos</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Carga un archivo JSON previamente exportado para actualizar toda la información de este paciente. 
                <span className="block mt-1 font-bold text-amber-600">Atención: Esto sobrescribirá los datos actuales.</span>
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              
              <button
                onClick={handleImportClick}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
              >
                <Upload className="w-4 h-4" />
                Seleccionar Archivo
              </button>

              {importStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold">¡Importación exitosa! Guardando y recargando...</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <div className="bg-amber-100 p-2 h-fit rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h5 className="font-bold text-amber-900 mb-1">Nota sobre la seguridad de los datos</h5>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                Los archivos exportados contienen información sensible del paciente. Asegúrate de almacenarlos en un lugar seguro y cumplir con las normativas de protección de datos locales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
