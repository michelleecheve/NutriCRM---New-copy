
import React, { useEffect } from 'react';
import { Patient } from '../../types';
import { store } from '../../services/store';
import { User, Activity, History as HistoryIcon, Flag, Plus, Trash2, Save } from 'lucide-react';
import { GridInput, SectionHeader, ModernTextArea } from './SharedComponents';

export const ClinicalTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const statusList = store.getPatientStatuses();

  const updateClinical = (field: string, value: any) => {
    onUpdate({ ...patient, clinical: { ...patient.clinical, [field]: value } });
  };

  const addSport = () => {
    const current = patient.sportsProfile || [];
    const newEntry = { 
      id: Math.random().toString(36).substring(7),
      patientId: patient.id,
      sport: '', 
      daysPerWeek: '', 
      schedule: '', 
      hoursPerDay: '' 
    };
    onUpdate({ ...patient, sportsProfile: [...current, newEntry] });
  };

  const removeSport = (id: string) => {
    const current = patient.sportsProfile || [];
    onUpdate({ ...patient, sportsProfile: current.filter(s => s.id !== id) });
  };

  const updateSport = (id: string, field: string, value: string) => {
    const current = (patient.sportsProfile || []).map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    onUpdate({ ...patient, sportsProfile: current });
  };

  useEffect(() => {
    if (patient.clinical.birthdate) {
      const today = new Date();
      const birth = new Date(patient.clinical.birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      updateClinical('age', age);
    }
  }, [patient.clinical.birthdate]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      
      {/* 0. Status Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <SectionHeader icon={Flag} title="Status del Paciente" />
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Status Actual</label>
                <select 
                  value={patient.clinical.status || '-'}
                  onChange={(e) => updateClinical('status', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer font-bold"
                >
                    <option value="-">-</option>
                    {statusList.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      {/* 1. Información Personal */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <SectionHeader icon={User} title="Información Personal" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-6">
           {/* ROW 1 */}
           <div className="lg:col-span-1">
             <GridInput label="ID" value={patient.id} onChange={() => {}} readOnly={true} />
           </div>
           <div className="lg:col-span-3">
             <GridInput label="Nombre" value={patient.firstName} onChange={(e: any) => onUpdate({ ...patient, firstName: e.target.value })} />
           </div>
           <div className="lg:col-span-3">
             <GridInput label="Apellido" value={patient.lastName} onChange={(e: any) => onUpdate({ ...patient, lastName: e.target.value })} />
           </div>
           <div className="lg:col-span-2">
             <GridInput label="CUI/DPI" value={patient.clinical.cui} onChange={(e: any) => updateClinical('cui', e.target.value)} />
           </div>
           <div className="lg:col-span-2">
             <GridInput label="Fecha de Nacimiento" type="date" value={patient.clinical.birthdate} onChange={(e: any) => updateClinical('birthdate', e.target.value)} />
           </div>
           <div className="lg:col-span-1">
             <GridInput label="Edad" type="number" value={patient.clinical.age} onChange={() => {}} readOnly={true} />
           </div>

            {/* ROW 2 */}
            <div className="lg:col-span-2">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Género</label>
                <select 
                  value={patient.clinical.sex || ''}
                  onChange={(e) => updateClinical('sex', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Femenino">Mujer</option>
                  <option value="Masculino">Hombre</option>
                  <option value="Otro">Otros</option>
                </select>
              </div>
            </div>
           <div className="lg:col-span-4">
             <GridInput label="Email" value={patient.clinical.email} onChange={(e: any) => updateClinical('email', e.target.value)} />
           </div>
           <div className="lg:col-span-2">
             <GridInput label="Teléfono" value={patient.clinical.phone} onChange={(e: any) => updateClinical('phone', e.target.value)} />
           </div>
           <div className="lg:col-span-2">
             <GridInput label="Trabajo" value={patient.clinical.occupation} onChange={(e: any) => updateClinical('occupation', e.target.value)} />
           </div>
           <div className="lg:col-span-2">
             <GridInput label="Estudio" value={patient.clinical.study} onChange={(e: any) => updateClinical('study', e.target.value)} />
           </div>

           {/* ADDED MOTIVOS Y ANTECEDENTES FIELD */}
           <div className="md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
             <ModernTextArea 
               label="Motivos de Consulta" 
               value={patient.clinical.consultmotive} 
               onChange={(e: any) => updateClinical('consultmotive', e.target.value)} 
               rows={4}
               placeholder="Ej. Reducir porcentaje de grasa y aumentar masa muscular..."
             />
             <ModernTextArea 
               label="Antecedentes" 
               value={patient.clinical.clinicalbackground} 
               onChange={(e: any) => updateClinical('clinicalbackground', e.target.value)} 
               rows={4}
               placeholder="Historia clínica detallada..."
             />
           </div>
        </div>
      </div>

      {/* 2. Perfil Deportivo - CRUD Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-800">
            <Activity className="w-5 h-5" />
            <h3 className="font-bold text-base">Perfil Deportivo</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdate(patient)}
              className="text-slate-600 text-xs font-bold flex items-center gap-1 hover:text-slate-700 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              <Save className="w-3 h-3" /> Guardar Cambios
            </button>
            <button 
              onClick={addSport}
              className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-3 h-3" /> Agregar Deporte/Actividad Física
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Deporte/Activ Física</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wide w-32">Dias/Sem</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Horario</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wide w-32">Horas al día</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(patient.sportsProfile || []).map((entry) => (
                <tr key={entry.id} className="border-b border-slate-50 group">
                  <td className="py-3 px-2 align-top">
                    <input 
                      type="text"
                      value={entry.sport}
                      onChange={(e) => updateSport(entry.id, 'sport', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Ej. Natación"
                    />
                  </td>
                  <td className="py-3 px-2 align-top">
                    <input 
                      type="text"
                      value={entry.daysPerWeek}
                      onChange={(e) => updateSport(entry.id, 'daysPerWeek', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Ej. 3"
                    />
                  </td>
                  <td className="py-3 px-2 align-top">
                    <textarea 
                      value={entry.schedule}
                      onChange={(e) => updateSport(entry.id, 'schedule', e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                      placeholder="Ej. Lunes, Miércoles y Viernes de 18:00 a 20:00..."
                    />
                  </td>
                  <td className="py-3 px-2 align-top">
                    <input 
                      type="text"
                      value={entry.hoursPerDay}
                      onChange={(e) => updateSport(entry.id, 'hoursPerDay', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Ej. 2"
                    />
                  </td>
                  <td className="py-3 px-2 align-top">
                    <button 
                      onClick={() => removeSport(entry.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(patient.sportsProfile || []).length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              No hay deportes o actividades físicas registradas. Haga clic en el botón superior para agregar uno.
            </div>
          )}
        </div>
      </div>

      {/* 4. Historia Clínica */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <SectionHeader icon={HistoryIcon} title="Historia Clínica" />
        <div className="grid grid-cols-1 gap-6">
           <ModernTextArea label="Diagnóstico médico" value={patient.clinical.diagnosis} onChange={(e: any) => updateClinical('diagnosis', e.target.value)} rows={2} />
           <ModernTextArea label="Antecedentes familiares de enfermedades" value={patient.clinical.familyHistory} onChange={(e: any) => updateClinical('familyHistory', e.target.value)} rows={2} />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <ModernTextArea label="Medicamentos" value={patient.clinical.medications} onChange={(e: any) => updateClinical('medications', e.target.value)} rows={2} />
             <ModernTextArea label="Suplementos" value={patient.clinical.supplements} onChange={(e: any) => updateClinical('supplements', e.target.value)} rows={2} />
           </div>
           <ModernTextArea label="Alergias y/o Intolerancias" value={patient.clinical.allergies} onChange={(e: any) => updateClinical('allergies', e.target.value)} rows={2} />
           
           <div className="mt-4 pt-4 border-t border-slate-100">
             <h4 className="text-sm font-bold text-emerald-800 mb-4">Periodo Menstrual (Si aplica)</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <GridInput label="Periodo Menstrual regular" value={patient.clinical.regularPeriod} onChange={(e: any) => updateClinical('regularPeriod', e.target.value)} />
               <GridInput label="Duración" value={patient.clinical.periodDuration} onChange={(e: any) => updateClinical('periodDuration', e.target.value)} />
               <GridInput label="Fecha y/o edad de primera menstruación" value={patient.clinical.firstperiodage} onChange={(e: any) => updateClinical('firstperiodage', e.target.value)} />
             </div>
             <div className="mt-6">
               <ModernTextArea label="Otros" value={patient.clinical.menstrualOthers} onChange={(e: any) => updateClinical('menstrualOthers', e.target.value)} rows={2} placeholder="Otros detalles del periodo menstrual..." />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
