
import React, { useState } from 'react';
import { Patient } from '../types';
import { store } from '../services/store';
import { Search, Plus, User, ChevronRight, Filter, Check, Settings, Trash2, X as CloseIcon } from 'lucide-react';

interface DashboardProps {
  onSelectPatient: (patientId: string, tab?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>(store.getPatients());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [statusList, setStatusList] = useState<string[]>(store.getPatientStatuses());
  const [newStatusName, setNewStatusName] = useState('');
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  // New Patient Form State - Added status default and dob
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', email: '', phone: '', status: 'Cita Agendada', dob: '' });

  // Format Helper moved up for Search Logic usage
  // CHANGED: Format to dd/mm/yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Assumes input is YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${month}/${day}/${year}`; 
  };

  // Enhanced Search & Filter Logic
  const filteredPatients = patients.filter(p => {
    // 1. Search Logic
    const term = searchTerm.toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const email = p.clinical.email.toLowerCase();
    const phone = p.clinical.phone.toLowerCase();
    const dobRaw = p.clinical.dob || '';
    const dobFormatted = formatDate(dobRaw);

    const matchesSearch = fullName.includes(term) || 
                          email.includes(term) || 
                          phone.includes(term) || 
                          dobRaw.includes(term) ||
                          dobFormatted.includes(term);

    // 2. Filter Logic
    const currentStatus = p.clinical.status || '-';
    const matchesFilter = filterStatus === 'Todos' || currentStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const created = store.addPatient(newPatient);
    setPatients(store.getPatients());
    setIsModalOpen(false);
    // Reset with default status
    setNewPatient({ firstName: '', lastName: '', email: '', phone: '', status: statusList[0] || '-', dob: '' });
  };

  const handleAddStatus = () => {
    if (newStatusName.trim() && !statusList.includes(newStatusName.trim())) {
      const updated = [...statusList, newStatusName.trim()];
      setStatusList(updated);
      store.updatePatientStatuses(updated);
      setNewStatusName('');
    }
  };

  const handleRemoveStatus = (status: string) => {
    const updated = statusList.filter(s => s !== status);
    setStatusList(updated);
    store.updatePatientStatuses(updated);
  };

  const getStatusStyles = (status?: string) => {
      switch(status) {
          case 'Cita Agendada': return 'bg-blue-50 text-blue-700 border-blue-100';
          case 'Cita Cancelada': return 'bg-red-50 text-red-700 border-red-100';
          case 'Menú Pendiente': return 'bg-amber-50 text-amber-700 border-amber-100';
          case 'Menú Entregado': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
          default: return 'bg-slate-50 text-slate-500 border-slate-200';
      }
  };

  const filterOptions = ['Todos', ...statusList, '-'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500" onClick={() => setIsFilterMenuOpen(false)}>
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Directorio de Pacientes</h2>
          <p className="text-slate-500 mt-1">Gestión clínica y seguimiento personalizado.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-600 p-3 rounded-xl border border-slate-200 shadow-sm transition-all"
            title="Configurar Status"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nuevo Paciente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, teléfono o fecha nacimiento (mm/dd/aaaa)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium"
            />
          </div>

          {/* Filter Button */}
          <div className="relative z-10">
             <button 
                onClick={(e) => { e.stopPropagation(); setIsFilterMenuOpen(!isFilterMenuOpen); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border transition-all ${filterStatus !== 'Todos' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
             >
                <Filter className="w-4 h-4" />
                <span>{filterStatus === 'Todos' ? 'Filtrar Status' : filterStatus}</span>
             </button>

             {isFilterMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                   <div className="p-2 border-b border-slate-50 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                      Seleccionar Estado
                   </div>
                   {filterOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => setFilterStatus(option)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex justify-between items-center"
                      >
                         <span>{option === '-' ? 'Sin Estado (-)' : option}</span>
                         {filterStatus === option && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                   ))}
                </div>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="px-8 py-5">Información del Paciente</th>
                <th className="px-6 py-5">Meta</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onSelectPatient(patient.id)}
                >
                  <td className="px-8 py-5">
                    <div>
                      <div className="font-bold text-slate-900 text-base mb-1">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>{patient.clinical.email}</span>
                        {patient.clinical.phone && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{patient.clinical.phone}</span>
                            </>
                        )}
                        {patient.clinical.dob && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{formatDate(patient.clinical.dob)}</span>
                            </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-slate-600 font-medium text-sm">{patient.clinical.goals || 'Sin especificar'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(patient.clinical.status)}`}>
                      {patient.clinical.status || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                     <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                       <ChevronRight className="w-5 h-5" />
                     </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                       <User className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-1">No hay pacientes encontrados</h3>
                    <p className="text-slate-500 text-sm">Prueba con otra búsqueda o cambia el filtro de estado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-bold text-slate-900">Nuevo Paciente</h3>
                 <p className="text-slate-500 text-sm mt-1">Ingresa la información básica para comenzar.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddPatient} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
                  <input
                    required
                    value={newPatient.firstName}
                    onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                    placeholder="Ej. Maria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Apellido</label>
                  <input
                    required
                    value={newPatient.lastName}
                    onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                    placeholder="Ej. Gonzalez"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      required
                      value={newPatient.phone}
                      onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                      placeholder="+56 9 1234 5678"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Nacimiento (Opcional)</label>
                    <input
                      type="date"
                      value={newPatient.dob}
                      onChange={e => setNewPatient({...newPatient, dob: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email (Opcional)</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Status Inicial</label>
                 <select 
                    value={newPatient.status}
                    onChange={e => setNewPatient({...newPatient, status: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 cursor-pointer"
                 >
                    {statusList.map(status => (
                       <option key={status} value={status}>{status}</option>
                    ))}
                    <option value="-">-</option>
                 </select>
              </div>

              <div className="pt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Crear Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Config Status Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Configurar lista de status</h3>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Status Actuales</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {statusList.map((status) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-all">
                      <span className="text-sm font-medium text-slate-700">{status}</span>
                      <button 
                        onClick={() => handleRemoveStatus(status)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {statusList.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4 italic">No hay estados personalizados.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Agregar Nuevo Status</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                    placeholder="Ej. En Seguimiento"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                  />
                  <button
                    onClick={handleAddStatus}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
