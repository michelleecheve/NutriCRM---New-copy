
import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Patient } from '../types';
import { store } from '../services/store';
import {
  Search, Plus, CreditCard, Edit2, Trash2, X,
  TrendingUp, TrendingDown, AlertTriangle, Filter,
  ChevronDown, CheckCircle, ArrowUpCircle, ArrowDownCircle,
  Wallet, BarChart2,
} from 'lucide-react';
import { getTodayStr } from '../src/utils/dateUtils';
import { showPlanLimitModal } from '../components/PlanLimitModal';

type Tab         = 'ingresos' | 'egresos' | 'resumen';
type StatusFilter = 'all' | 'Pendiente' | 'Pagado' | 'Vencido';
type DatePreset  = '1m' | '3m' | '6m' | 'year' | 'custom' | 'all';

const EXPENSE_CATEGORIES = [
  'Renta/Oficina',
  'Personal',
  'Equipo',
  'Suministros',
  'Marketing',
  'Otro',
];

const getPresetRange = (preset: DatePreset): { from: string; to: string } | null => {
  if (preset === 'all' || preset === 'custom') return null;
  const to   = new Date();
  const from = new Date();
  if (preset === '1m')   { from.setDate(1); }
  if (preset === '3m')   { from.setMonth(from.getMonth() - 2); from.setDate(1); }
  if (preset === '6m')   { from.setMonth(from.getMonth() - 5); from.setDate(1); }
  if (preset === 'year') { from.setMonth(0); from.setDate(1); }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
};

const PRESET_LABELS: Record<DatePreset, string> = {
  all:    'Todas',
  '1m':   'Mes Actual',
  '3m':   'Últimos 3 meses',
  '6m':   'Últimos 6 meses',
  year:   `Año ${new Date().getFullYear()}`,
  custom: 'Rango personalizado',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Renta/Oficina': 'bg-violet-400',
  'Personal':      'bg-blue-400',
  'Equipo':        'bg-cyan-400',
  'Suministros':   'bg-amber-400',
  'Marketing':     'bg-pink-400',
  'Otro':          'bg-slate-400',
};

export const Payments: React.FC = () => {
  const [user]     = useState(store.getUserProfile());
  const currency   = user?.currency || '$';
  const [invoices, setInvoices] = useState<Invoice[]>(store.getInvoices());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ingresos');

  const [searchTerm,       setSearchTerm]       = useState('');
  const [isModalOpen,      setIsModalOpen]       = useState(false);
  const [isDeleteModalOpen,setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete,  setInvoiceToDelete]   = useState<string | null>(null);

  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset>('1m');
  const [customFrom,   setCustomFrom]   = useState('');
  const [customTo,     setCustomTo]     = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const [statusFilter,     setStatusFilter]     = useState<StatusFilter>('all');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  const emptyIngreso: Partial<Invoice> = {
    patientId:   '',
    patientName: '',
    date:        getTodayStr(user.timezone),
    amount:      0,
    status:      'Pendiente',
    method:      'Transferencia',
    type:        'ingreso',
    category:    undefined,
    description: '',
  };

  const emptyEgreso: Partial<Invoice> = {
    patientId:   '',
    patientName: '',
    date:        getTodayStr(user.timezone),
    amount:      0,
    status:      'Pendiente',
    method:      'Transferencia',
    type:        'egreso',
    category:    EXPENSE_CATEGORIES[0],
    description: '',
  };

  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>(emptyIngreso);

  useEffect(() => {
    setPatients(store.getPatients());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current       && !filterRef.current.contains(e.target as Node))       setFilterOpen(false);
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target as Node)) setStatusFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Date filter ──────────────────────────────────────────────────────────────
  const applyDateFilter = (inv: Invoice) => {
    if (activePreset === 'all') return true;
    const range = activePreset === 'custom'
      ? (customFrom && customTo ? { from: customFrom, to: customTo } : null)
      : getPresetRange(activePreset);
    if (!range) return true;
    return inv.date >= range.from && inv.date <= range.to;
  };

  const dateFiltered        = invoices.filter(applyDateFilter);
  const dateFilteredIngresos = dateFiltered.filter(i => i.type !== 'egreso');
  const dateFilteredEgresos  = dateFiltered.filter(i => i.type === 'egreso');

  // ── Search + status filter per tab ───────────────────────────────────────────
  const filteredIngresos = dateFilteredIngresos.filter(i => {
    const matchSearch = (i.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredEgresos = dateFilteredEgresos.filter(i => {
    const matchSearch = (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (i.category    || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalIngresosCobrados  = dateFilteredIngresos.filter(i => i.status === 'Pagado').reduce((s, i) => s + i.amount, 0);
  const totalIngresosPendientes = dateFilteredIngresos.filter(i => i.status === 'Pendiente').reduce((s, i) => s + i.amount, 0);
  const totalIngresosVencidos  = dateFilteredIngresos.filter(i => i.status === 'Vencido').reduce((s, i) => s + i.amount, 0);

  const totalEgresosPagados   = dateFilteredEgresos.filter(i => i.status === 'Pagado').reduce((s, i) => s + i.amount, 0);
  const totalEgresosPendientes = dateFilteredEgresos.filter(i => i.status === 'Pendiente').reduce((s, i) => s + i.amount, 0);

  const balanceNeto = totalIngresosCobrados - totalEgresosPagados;

  // ── Category breakdown ───────────────────────────────────────────────────────
  const egresosByCategory = (() => {
    const map: Record<string, number> = {};
    for (const e of dateFilteredEgresos) {
      if (e.status !== 'Pagado') continue;
      const key = e.category || 'Sin categoría';
      map[key] = (map[key] || 0) + e.amount;
    }
    return map;
  })();

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const isFiltered = activePreset !== '1m' || (activePreset === 'custom' && (!customFrom || !customTo));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(day)} ${months[parseInt(month) - 1] || month} ${year}`;
  };

  const getPatientName = (inv: Invoice) => {
    if (inv.patientName) return inv.patientName;
    if (inv.patientId) {
      const p = patients.find(p => p.id === inv.patientId);
      if (p) return `${p.firstName} ${p.lastName}`;
    }
    return 'Paciente';
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setCurrentInvoice(activeTab === 'egresos' ? { ...emptyEgreso } : { ...emptyIngreso });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    let updated = { ...inv };
    if (!updated.patientName && updated.patientId) {
      const p = patients.find(p => p.id === updated.patientId);
      if (p) updated.patientName = `${p.firstName} ${p.lastName}`;
    }
    setCurrentInvoice(updated);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await store.deleteInvoice(invoiceToDelete);
      setInvoices(store.getInvoices());
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentInvoice.id) {
        await store.updateInvoice(currentInvoice as Invoice);
      } else {
        await store.addInvoice(currentInvoice as Omit<Invoice, 'id'>);
      }
      setInvoices(store.getInvoices());
      setIsModalOpen(false);
    } catch (err: any) {
      if (err?.message === 'PLAN_LIMIT_INVOICES') {
        setIsModalOpen(false);
        showPlanLimitModal();
      } else {
        console.error('Error saving invoice:', err);
      }
    }
  };

  const handlePatientSelect = (patientId: string) => {
    const p = patients.find(p => p.id === patientId);
    setCurrentInvoice({
      ...currentInvoice,
      patientId:   p?.id || '',
      patientName: p ? `${p.firstName} ${p.lastName}` : '',
    });
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('all');
  };

  const isEgresoModal = currentInvoice.type === 'egreso';

  // ── Tab styles ───────────────────────────────────────────────────────────────
  const tabCls = (tab: Tab) => `flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
    activeTab === tab
      ? tab === 'ingresos' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
        : tab === 'egresos' ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
        : 'bg-slate-800 text-white shadow-md'
      : 'text-slate-500 hover:bg-slate-100'
  }`;

  // ── Shared toolbar JSX ────────────────────────────────────────────────────────
  const renderToolbar = (searchPlaceholder: string, hideVencido = false) => (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Date filter */}
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
          {`Fecha: ${PRESET_LABELS[activePreset]}`}
          <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>

        {filterOpen && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-150">
            <div className="p-1">
              {(['all', '1m', '3m', '6m', 'year'] as DatePreset[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setActivePreset(p); if (p !== 'custom') setFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                    activePreset === p ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
              <button
                onClick={() => setActivePreset('custom')}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                  activePreset === 'custom' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {PRESET_LABELS['custom']}
              </button>
            </div>
            {activePreset === 'custom' && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <button onClick={() => setFilterOpen(false)}
                  className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                  Aplicar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status filter */}
      <div className="relative flex-shrink-0" ref={statusFilterRef}>
        <button
          onClick={() => setStatusFilterOpen(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
            statusFilter !== 'all'
              ? statusFilter === 'Pagado'   ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : statusFilter === 'Pendiente'? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {statusFilter === 'all' ? 'Estado' : statusFilter}
          <ChevronDown className={`w-4 h-4 transition-transform ${statusFilterOpen ? 'rotate-180' : ''}`} />
        </button>

        {statusFilterOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-150">
            <div className="p-1">
              {([
                { value: 'all',      label: 'Todos',     color: 'text-slate-700', dot: ''             },
                { value: 'Pendiente',label: 'Pendiente', color: 'text-blue-600',  dot: 'bg-blue-500'  },
                { value: 'Pagado',   label: 'Pagado',    color: 'text-emerald-600',dot:'bg-emerald-500'},
                ...(!hideVencido ? [{ value: 'Vencido', label: 'Vencido', color: 'text-red-600', dot: 'bg-red-500' }] : []),
              ] as { value: StatusFilter; label: string; color: string; dot: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setStatusFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    statusFilter === opt.value ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                  } ${opt.color}`}
                >
                  {opt.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />}
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
  );

  // ── Shared table actions ──────────────────────────────────────────────────────
  const renderActions = (inv: Invoice) => (
    <div className="flex justify-end gap-2">
      <button onClick={e => { e.stopPropagation(); handleOpenEdit(inv); }}
        className="p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all" title="Editar">
        <Edit2 className="w-4 h-4" />
      </button>
      <button onClick={e => { e.stopPropagation(); handleDeleteClick(inv.id); }}
        className="p-2 text-slate-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all" title="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const statusBadge = (status: Invoice['status']) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
      status === 'Pagado'    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
      status === 'Pendiente' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                               'bg-red-50 text-red-600 border-red-100'
    }`}>
      {status === 'Pagado' && '✓ '}
      {status}
    </span>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Finanzas de la Clínica</h2>
          <p className="text-slate-500 mt-1">Control de ingresos, egresos y balance general.</p>
        </div>
        {activeTab !== 'resumen' && (
          <button
            onClick={handleOpenCreate}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all font-semibold text-white ${
              activeTab === 'ingresos'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
            }`}
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'ingresos' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button onClick={() => handleTabChange('ingresos')} className={tabCls('ingresos')}>
          <ArrowUpCircle className="w-4 h-4" /> Ingresos
        </button>
        <button onClick={() => handleTabChange('egresos')} className={tabCls('egresos')}>
          <ArrowDownCircle className="w-4 h-4" /> Egresos
        </button>
        <button onClick={() => handleTabChange('resumen')} className={tabCls('resumen')}>
          <BarChart2 className="w-4 h-4" /> Resumen
        </button>
      </div>

      {/* ══════════════════════  INGRESOS  ══════════════════════ */}
      {activeTab === 'ingresos' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Ingresos Cobrados</span>
                <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded font-bold flex items-center gap-1 self-start">
                  <TrendingUp className="w-3 h-3" />
                  {dateFilteredIngresos.filter(i => i.status === 'Pagado').length} Facturas
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{currency}{totalIngresosCobrados.toFixed(2)}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Facturas Pendientes</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold self-start">
                  {dateFilteredIngresos.filter(i => i.status === 'Pendiente').length} Facturas
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{currency}{totalIngresosPendientes.toFixed(2)}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Monto Vencido</span>
                <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded font-bold self-start">
                  {dateFilteredIngresos.filter(i => i.status === 'Vencido').length} Facturas
                </span>
              </div>
              <div className="text-3xl font-bold text-red-600">{currency}{totalIngresosVencidos.toFixed(2)}</div>
            </div>
          </div>

          {renderToolbar('Buscar por paciente o ID...')}

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
                  {filteredIngresos.map(inv => (
                    <tr key={inv.id} onClick={() => handleOpenEdit(inv)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-6 py-5">{statusBadge(inv.status)}</td>
                      <td className="px-6 py-5 font-bold text-slate-900">{currency}{inv.amount.toFixed(2)}</td>
                      <td className="px-6 py-5 text-slate-700">{getPatientName(inv)}</td>
                      <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{inv.method}</td>
                      <td className="px-6 py-5 text-right">{renderActions(inv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredIngresos.length === 0 && (
                <div className="p-12 text-center text-slate-400">No se encontraron ingresos.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════  EGRESOS  ══════════════════════ */}
      {activeTab === 'egresos' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Total Egresos Pagados</span>
                <span className="bg-red-50 text-red-500 text-xs px-2 py-1 rounded font-bold flex items-center gap-1 self-start">
                  <TrendingDown className="w-3 h-3" />
                  {dateFilteredEgresos.filter(i => i.status === 'Pagado').length} registros
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{currency}{totalEgresosPagados.toFixed(2)}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Egresos Pendientes</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold self-start">
                  {dateFilteredEgresos.filter(i => i.status === 'Pendiente').length} registros
                </span>
              </div>
              <div className="text-3xl font-bold text-amber-500">{currency}{totalEgresosPendientes.toFixed(2)}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Total de Egresos</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold self-start">
                  {dateFilteredEgresos.length} registros
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{currency}{(totalEgresosPagados + totalEgresosPendientes).toFixed(2)}</div>
            </div>
          </div>

          {renderToolbar('Buscar por categoría o descripción...', true)}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                    <th className="px-6 py-5 min-w-[7rem]">Estado</th>
                    <th className="px-6 py-5">Monto</th>
                    <th className="px-6 py-5">Categoría</th>
                    <th className="px-6 py-5">Descripción</th>
                    <th className="px-6 py-5 min-w-[9rem]">Fecha</th>
                    <th className="px-6 py-5">Método</th>
                    <th className="px-6 py-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEgresos.map(inv => (
                    <tr key={inv.id} onClick={() => handleOpenEdit(inv)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          inv.status === 'Pagado'    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                       'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {inv.status === 'Pagado' && '✓ '}
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-slate-900">{currency}{inv.amount.toFixed(2)}</td>
                      <td className="px-6 py-5">
                        {inv.category && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${CATEGORY_COLORS[inv.category] || 'bg-slate-400'}`}>
                            {inv.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 max-w-xs truncate">{inv.description || '—'}</td>
                      <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{inv.method}</td>
                      <td className="px-6 py-5 text-right">{renderActions(inv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEgresos.length === 0 && (
                <div className="p-12 text-center text-slate-400">No se encontraron egresos.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════  RESUMEN  ══════════════════════ */}
      {activeTab === 'resumen' && (
        <>
          {/* Date filter strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-500">Período:</span>
            {(['1m', '3m', '6m', 'year', 'all'] as DatePreset[]).map(p => (
              <button
                key={p}
                onClick={() => setActivePreset(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activePreset === p
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
            <button
              onClick={() => setActivePreset('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'custom'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Personalizado
            </button>
            {activePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400/20" />
                <span className="text-slate-400 text-xs">—</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400/20" />
              </div>
            )}
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Ingresos Cobrados</span>
                <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-emerald-600">+{currency}{totalIngresosCobrados.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-2">
                {dateFilteredIngresos.filter(i => i.status === 'Pagado').length} facturas cobradas
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 font-medium text-sm">Egresos Pagados</span>
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-500">-{currency}{totalEgresosPagados.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-2">
                {dateFilteredEgresos.filter(i => i.status === 'Pagado').length} egresos registrados
              </p>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm ${balanceNeto >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-600 font-semibold text-sm">Balance Neto</span>
                <Wallet className={`w-5 h-5 ${balanceNeto >= 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div className={`text-3xl font-bold ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                {balanceNeto >= 0 ? '+' : ''}{currency}{balanceNeto.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {balanceNeto >= 0 ? 'Resultado positivo' : 'Resumen'} en el período
              </p>
            </div>
          </div>

          {/* Pending row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Pendiente por cobrar</h4>
              <div className="text-2xl font-bold text-blue-600">{currency}{totalIngresosPendientes.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-1">
                {dateFilteredIngresos.filter(i => i.status === 'Pendiente').length} pendientes
                {dateFilteredIngresos.filter(i => i.status === 'Vencido').length > 0 && (
                  <span className="text-red-400 ml-2">
                    · {dateFilteredIngresos.filter(i => i.status === 'Vencido').length} vencidas ({currency}{totalIngresosVencidos.toFixed(2)})
                  </span>
                )}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Egresos pendientes de pago</h4>
              <div className="text-2xl font-bold text-amber-500">{currency}{totalEgresosPendientes.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-1">
                {dateFilteredEgresos.filter(i => i.status === 'Pendiente').length} pagos pendientes
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(egresosByCategory).length > 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-5">Desglose de Egresos por Categoría</h4>
              <div className="space-y-4">
                {Object.entries(egresosByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => {
                    const pct = totalEgresosPagados > 0 ? (amount / totalEgresosPagados) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-600 font-medium flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat] || 'bg-slate-400'}`} />
                            {cat}
                          </span>
                          <span className="font-bold text-slate-800">
                            {currency}{amount.toFixed(2)}
                            <span className="text-slate-400 font-normal text-xs ml-1">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${CATEGORY_COLORS[cat] || 'bg-slate-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No hay egresos pagados en este período.
            </div>
          )}
        </>
      )}

      {/* ══════════  MODAL CREAR / EDITAR  ══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 border border-slate-100">

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEgresoModal ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {currentInvoice.id
                      ? (isEgresoModal ? 'Editar Egreso' : 'Editar Ingreso')
                      : (isEgresoModal ? 'Nuevo Egreso' : 'Nuevo Ingreso')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEgresoModal ? (currentInvoice.category || 'Egreso de clínica') : (currentInvoice.patientName || 'Nuevo registro')}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* ── INGRESO fields ── */}
              {!isEgresoModal && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Paciente</label>
                  <select
                    required
                    value={currentInvoice.patientId || ''}
                    onChange={e => handlePatientSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.clinical.email})
                      </option>
                    ))}
                  </select>
                  {!currentInvoice.patientId && currentInvoice.patientName && (
                    <p className="text-xs text-orange-400 mt-1">* Paciente actual: {currentInvoice.patientName} (no vinculado)</p>
                  )}
                </div>
              )}

              {/* ── EGRESO fields ── */}
              {isEgresoModal && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Categoría</label>
                    <select
                      required
                      value={currentInvoice.category || ''}
                      onChange={e => setCurrentInvoice({ ...currentInvoice, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-400/20 focus:border-red-400 outline-none transition-all"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Pago renta marzo, sueldo secretaria, laptop nueva..."
                      value={currentInvoice.description || ''}
                      onChange={e => setCurrentInvoice({ ...currentInvoice, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-400/20 focus:border-red-400 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              {/* Shared fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Fecha</label>
                  <input
                    required
                    type="date"
                    value={currentInvoice.date}
                    onChange={e => setCurrentInvoice({ ...currentInvoice, date: e.target.value })}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monto ({currency})</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentInvoice.amount}
                    onChange={e => setCurrentInvoice({ ...currentInvoice, amount: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Estado</label>
                  <select
                    value={currentInvoice.status}
                    onChange={e => setCurrentInvoice({ ...currentInvoice, status: e.target.value as Invoice['status'] })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Pendiente</option>
                    {!isEgresoModal && <option value="Vencido">Vencido</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Método</label>
                  <select
                    value={currentInvoice.method}
                    onChange={e => setCurrentInvoice({ ...currentInvoice, method: e.target.value as Invoice['method'] })}
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
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all ${
                    isEgresoModal
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════  MODAL ELIMINAR  ══════════ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Confirmar eliminación?</h3>
              <p className="text-slate-500 mb-6">Este registro no se puede recuperar.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
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
