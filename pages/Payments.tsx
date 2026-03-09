
import React, { useState, useEffect } from 'react';
import { Invoice, Patient } from '../types';
import { store } from '../services/store';
import { Search, Plus, CreditCard, Edit2, Trash2, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { getTodayStr } from '../src/utils/dateUtils';

export const Payments: React.FC = () => {
  const [user] = useState(store.getUserProfile());
  const [invoices, setInvoices] = useState<Invoice[]>(store.getInvoices());
  const [patients, setPatients] = useState<Patient[]>([]); // To populate the dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  
  // Initialize data
  useEffect(() => {
    setPatients(store.getPatients());
  }, []);

  // State for form
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    patientId: '',
    patientName: '',
    date: getTodayStr(user.timezone),
    amount: 0,
    status: 'Pendiente',
    method: 'Transferencia'
  });

  const filteredInvoices = invoices.filter(i => 
    i.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = invoices
    .filter(i => i.status === 'Pagado')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingAmount = invoices
    .filter(i => i.status === 'Pendiente')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueAmount = invoices
    .filter(i => i.status === 'Vencido')
    .reduce((sum, i) => sum + i.amount, 0);

  // Helper for date formatting
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    
    const months = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun', 
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
    const monthName = months[parseInt(month) - 1] || month;
    
    return `${parseInt(day)} de ${monthName} del ${year}`;
  };

  const handleOpenCreate = () => {
    setCurrentInvoice({
        patientId: '',
        patientName: '',
        date: getTodayStr(user.timezone),
        amount: 0,
        status: 'Pendiente',
        method: 'Transferencia'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice: Invoice) => {
    setCurrentInvoice({ ...invoice });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      store.deleteInvoice(invoiceToDelete);
      setInvoices(store.getInvoices());
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInvoice.id) {
        // Edit
        store.updateInvoice(currentInvoice as Invoice);
    } else {
        // Create
        store.addInvoice(currentInvoice as Omit<Invoice, 'id'>);
    }
    setInvoices(store.getInvoices());
    setIsModalOpen(false);
  };

  // Handle Dropdown Selection
  const handlePatientSelect = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    if (selectedPatient) {
      setCurrentInvoice({
        ...currentInvoice,
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`
      });
    } else {
      // Allow clearing selection or manual override if ever needed (though strict dropdown prevents manual)
      setCurrentInvoice({ ...currentInvoice, patientId: '', patientName: '' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Pagos</h2>
          <p className="text-slate-500 mt-1">Gestiona las facturas e ingresos de la clínica.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          Crear Factura
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Ingresos Totales (Mes)</span>
                <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                   <TrendingUp className="w-3 h-3" /> Real Data
                </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">Q{totalRevenue.toFixed(2)}</div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Facturas Pendientes</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold">
                   {invoices.filter(i => i.status === 'Pendiente').length} Facturas
                </span>
            </div>
            <div className="text-3xl font-bold text-blue-600">Q{pendingAmount.toFixed(2)}</div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Monto Vencido</span>
                <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold">
                   {invoices.filter(i => i.status === 'Vencido').length} Facturas
                </span>
            </div>
            <div className="text-3xl font-bold text-red-600">Q{overdueAmount.toFixed(2)}</div>
         </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border-none text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="px-6 py-5">Invoice ID</th>
                <th className="px-6 py-5">Paciente</th>
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5">Monto</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5">Método</th>
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                   <td className="px-6 py-5 font-bold text-slate-400 text-sm">{inv.id}</td>
                   <td className="px-6 py-5 font-bold text-slate-900">{inv.patientName}</td>
                   <td className="px-6 py-5 text-sm text-slate-500">{formatDate(inv.date)}</td>
                   <td className="px-6 py-5 font-bold text-slate-900">Q{inv.amount.toFixed(2)}</td>
                   <td className="px-6 py-5">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        inv.status === 'Pagado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        inv.status === 'Pendiente' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-red-50 text-red-600 border-red-100'
                     }`}>
                        {inv.status === 'Pagado' && '✓ '} 
                        {inv.status}
                     </span>
                   </td>
                   <td className="px-6 py-5 text-sm text-slate-500">{inv.method}</td>
                   <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(inv)}
                          className="p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all"
                          title="Editar"
                        >
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(inv.id)}
                          className="p-2 text-slate-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                          title="Eliminar"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
             <div className="p-12 text-center text-slate-400">No se encontraron facturas.</div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{currentInvoice.id ? 'Editar Factura' : 'Crear Nueva Factura'}</h3>
                        <p className="text-xs text-slate-500">{currentInvoice.id || 'Nuevo registro'}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSaveInvoice} className="p-8 space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Seleccionar Paciente</label>
                    <select 
                      required
                      value={currentInvoice.patientId || ''}
                      onChange={(e) => handlePatientSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="">Seleccionar de la lista...</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} ({patient.clinical.email})
                        </option>
                      ))}
                    </select>
                    {/* Fallback display if viewing an old invoice with no linked ID but has a name */}
                    {!currentInvoice.patientId && currentInvoice.patientName && (
                       <p className="text-xs text-orange-400 mt-1">
                         * Paciente actual: {currentInvoice.patientName} (No vinculado)
                       </p>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Fecha</label>
                        <input 
                        required
                        type="date" 
                        value={currentInvoice.date}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monto (Q)</label>
                        <input 
                        required
                        type="number" 
                        step="0.01"
                        value={currentInvoice.amount}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, amount: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Estado</label>
                        <select 
                        value={currentInvoice.status}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, status: e.target.value as any})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                           <option value="Pagado">Pagado</option>
                           <option value="Pendiente">Pendiente</option>
                           <option value="Vencido">Vencido</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Método</label>
                        <select 
                        value={currentInvoice.method}
                        onChange={(e) => setCurrentInvoice({...currentInvoice, method: e.target.value as any})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                           <option value="Transferencia">Transferencia</option>
                           <option value="Efectivo">Efectivo</option>
                           <option value="Tarjeta">Tarjeta</option>
                           <option value="Otro">Otro</option>
                        </select>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                    >
                        Guardar Factura
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Confirmar eliminación?</h3>
              <p className="text-slate-500 mb-6">
                ¿Estás seguro que quieres eliminar este registro? No es reversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
