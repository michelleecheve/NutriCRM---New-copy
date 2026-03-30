
import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Patient } from '../types';
import { store } from '../services/store';
import { Search, Plus, CreditCard, Edit2, Trash2, X, TrendingUp, AlertTriangle, Filter, ChevronDown, CheckCircle } from 'lucide-react';
import { getTodayStr } from '../src/utils/dateUtils';

type StatusFilter = 'all' | 'Pendiente' | 'Pagado' | 'Vencido';

type DatePreset = '1m' | '3m' | '6m' | 'year' | 'custom' | 'all';

const getPresetRange = (preset: DatePreset): { from: string; to: string } | null => {
  if (preset === 'all' || preset === 'custom') return null;
  const to = new Date();
  const from = new Date();
  if (preset === '1m')   from.setMonth(from.getMonth() - 1);
  if (preset === '3m')   from.setMonth(from.getMonth() - 3);
  if (preset === '6m')   from.setMonth(from.getMonth() - 6);
  if (preset === 'year') { from.setMonth(0); from.setDate(1); }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
};

const PRESET_LABELS: Record<DatePreset, string> = {
  all:    'Todas',
  '1m':   'Último mes',
  '3m':   'Últimos 3 meses',
  '6m':   'Últimos 6 meses',
  year:   `Año ${new Date().getFullYear()}`,
  custom: 'Rango personalizado',
};

export const Payments: React.FC = () => {
  const [user] = useState(store.getUserProfile());
  const currency = user?.currency || '$';
  const [invoices, setInvoices] = useState<Invoice[]>(store.getInvoices());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset>('1m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPatients(store.getPatients());
  }, []);

  // Close filter dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target as Node)) {
        setStatusFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    patientId: '',
    patientName: '',
    date: getTodayStr(user.timezone),
    amount: 0,
    status: 'Pendiente',
    method: 'Transferencia'
  });

  // Apply date filter
  const dateFilteredInvoices = invoices.filter(inv => {
    if (activePreset === 'all') return true;
    const range = activePreset === 'custom'
      ? (customFrom && customTo ? { from: customFrom, to: customTo } : null)
      : getPresetRange(activePreset);
    if (!range) return true;
    return inv.date >= range.from && inv.date <= range.to;
  });

  const filteredInvoices = dateFilteredInvoices.filter(i => {
    const matchesSearch = i.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = dateFilteredInvoices
    .filter(i => i.status === 'Pagado')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingAmount = dateFilteredInvoices
    .filter(i => i.status === 'Pendiente')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueAmount = dateFilteredInvoices
    .filter(i => i.status === 'Vencido')
    .reduce((sum, i) => sum + i.amount, 0);

  const isFiltered = activePreset !== '1m' || (activePreset === 'custom' && (!customFrom || !customTo));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthName = months[parseInt(month) - 1] || month;
    return `${parseInt(day)} ${monthName} ${year}`;
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
    let updatedInvoice = { ...invoice };
    if (!updatedInvoice.patientName && updatedInvoice.patientId) {
      const p = patients.find(p => p.id === updatedInvoice.patientId);
      if (p) updatedInvoice.patientName = `${p.firstName} ${p.lastName}`;
    }
    setCurrentInvoice(updatedInvoice);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await store.deleteInvoice(invoiceToDelete);
        setInvoices(store.getInvoices());
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentInvoice.id) {
        await store.updateInvoice(currentInvoice as Invoice);
      } else {
        await store.addInvoice(currentInvoice as Omit<Invoice, 'id'>);
      }
      setInvoices(store.getInvoices());
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    if (selectedPatient) {
      setCurrentInvoice({
        ...currentInvoice,
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`
      });
    } else {
      setCurrentInvoice({ ...currentInvoice, patientId: '', patientName: '' });
    }
  };

  const getPatientName = (invoice: Invoice) => {
    if (invoice.patientName) return invoice.patientName;
    if (invoice.patientId) {
      const p = patients.find(p => p.id === invoice.patientId);
      if (p) return `${p.firstName} ${p.lastName}`;
    }
    return 'Paciente';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
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
            <span className="text-slate-500 font-medium text-sm">Ingresos Totales</span>
            <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {dateFilteredInvoices.filter(i => i.status === 'Pagado').length} Facturas
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{currency}{totalRevenue.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 font-medium text-sm">Facturas Pendientes</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold">
              {dateFilteredInvoices.filter(i => i.status === 'Pendiente').length} Facturas
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{currency}{pendingAmount.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 font-medium text-sm">Monto Vencido</span>
            <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold">
              {dateFilteredInvoices.filter(i => i.status === 'Vencido').length} Facturas
            </span>
          </div>
          <div className="text-3xl font-bold text-red-600">{currency}{overdueAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Table Toolbar — fuera del overflow-hidden para que el dropdown no se corte */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar facturas por paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
              isFiltered
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Filter className="w-4 h-4" />
            {`Filtrar por fecha: ${PRESET_LABELS[activePreset]}`}
            <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterOpen && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-150">
              <div className="p-1">
                {(['all', '1m', '3m', '6m', 'year'] as DatePreset[]).map(preset => (
                  <button
                    key={preset}
                    onClick={() => { setActivePreset(preset); if (preset !== 'custom') setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      activePreset === preset
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {PRESET_LABELS[preset]}
                  </button>
                ))}
                <button
                  onClick={() => setActivePreset('custom')}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                    activePreset === 'custom'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {PRESET_LABELS['custom']}
                </button>
              </div>

              {activePreset === 'custom' && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status filter dropdown */}
        <div className="relative flex-shrink-0" ref={statusFilterRef}>
          <button
            onClick={() => setStatusFilterOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
              statusFilter !== 'all'
                ? statusFilter === 'Pagado'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : statusFilter === 'Pendiente'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {statusFilter === 'all' ? 'Filtrar por estado' : statusFilter}
            <ChevronDown className={`w-4 h-4 transition-transform ${statusFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {statusFilterOpen && (
            <div className="absolute top-full mt-2 right-0 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-150">
              <div className="p-1">
                {([
                  { value: 'all', label: 'Todos', color: 'text-slate-700' },
                  { value: 'Pendiente', label: 'Pendiente', color: 'text-blue-600' },
                  { value: 'Pagado', label: 'Pagado', color: 'text-emerald-600' },
                  { value: 'Vencido', label: 'Vencido', color: 'text-red-600' },
                ] as { value: StatusFilter; label: string; color: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setStatusFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                      statusFilter === opt.value
                        ? 'bg-slate-100 font-semibold'
                        : 'hover:bg-slate-50'
                    } ${opt.color}`}
                  >
                    {opt.value !== 'all' && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        opt.value === 'Pagado' ? 'bg-emerald-500' :
                        opt.value === 'Pendiente' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {(isFiltered || statusFilter !== 'all') && (
          <button
            onClick={() => { setActivePreset('1m'); setCustomFrom(''); setCustomTo(''); setStatusFilter('all'); }}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="px-6 py-5 min-w-[7rem]">Estado</th>
                <th className="px-6 py-5">Monto</th>
                <th className="px-6 py-5">Paciente</th>
                <th className="px-6 py-5 min-w-[9rem]">Fecha</th>
                <th className="px-6 py-5">Método</th>
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} onClick={() => handleOpenEdit(inv)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      inv.status === 'Pagado'   ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      inv.status === 'Pendiente'? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                  'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {inv.status === 'Pagado' && '✓ '}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-900">{currency}{inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-5 text-slate-700">{getPatientName(inv)}</td>
                  <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
                  <td className="px-6 py-5 text-sm text-slate-500">{inv.method}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(inv); }}
                        className="p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id); }}
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentInvoice.id ? 'Editar Factura' : 'Crear Nueva Factura'}</h3>
                  <p className="text-xs text-slate-500">{currentInvoice.patientName || 'Nuevo registro'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 space-y-5 overflow-y-auto flex-1">
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
                {!currentInvoice.patientId && currentInvoice.patientName && (
                  <p className="text-xs text-orange-400 mt-1">
                    * Paciente actual: {currentInvoice.patientName} (No vinculado)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monto ({currency})</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
