import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { Patient, Appointment, Invoice } from '../types';
import { CreditCard, Calendar, ChefHat, Clock, ChevronRight, AlertCircle, CalendarDays, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getTodayStr } from '../src/utils/dateUtils';
import { CalendarAppointmentModal } from '../components/calendar_components/CalendarAppointmentModal';

interface MainPanelProps {
  onSelectPatient: (patientId: string, tab?: string) => void;
}

export const MainPanel: React.FC<MainPanelProps> = ({ onSelectPatient }) => {
  const currentUser = authStore.getCurrentUser();
  const user = currentUser?.profile || store.getUserProfile();

  const currency = (user as any)?.currency || '$';
  const todayStr = user?.timezone ? getTodayStr(user.timezone) : new Date().toISOString().split('T')[0];
  const [currentYear, currentMonth] = todayStr.split('-').map(Number);

  const getFirstDay = () => `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const getLastDay = () => {
    const last = new Date(currentYear, currentMonth, 0);
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  };

  const [dateRange, setDateRange] = useState({ start: getFirstDay(), end: getLastDay() });
  const [patients, setPatients] = useState<Patient[]>(store.getPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(store.getAppointments());
  const [invoices, setInvoices] = useState<Invoice[]>(store.getInvoices());
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Leer datos frescos de Supabase cuando authStore termina de cargar
  useEffect(() => {
    const unsub = authStore.onAuthReady(() => {
      setPatients(store.getPatients());
      setAppointments(store.getAppointments());
      setInvoices(store.getInvoices());
    });
    return unsub;
  }, []);

  const isInPeriod = (dateString: string) =>
    !!dateString && dateString >= dateRange.start && dateString <= dateRange.end;

  const totalPatients = patients.length;

  const totalIncome = invoices
    .filter(inv => inv.status === 'Pagado' && isInPeriod(inv.date))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const appointmentsCount = appointments.filter(a => a.status !== 'Cancelada' && isInPeriod(a.date)).length;
  const pendingMenusCount = patients.filter(p => p.clinical.status === 'Menú Pendiente').length;

  type ChartRange = 'ytd' | '3m' | '6m' | '12m';
  const [chartRange, setChartRange] = useState<ChartRange>('ytd');

  const chartRangeOptions: { value: ChartRange; label: string; tooltip: string }[] = [
    { value: 'ytd', label: String(currentYear), tooltip: 'Datos del año actual' },
    { value: '3m', label: '3M', tooltip: 'Datos de los últimos 3 meses' },
    { value: '6m', label: '6M', tooltip: 'Datos de los últimos 6 meses' },
    { value: '12m', label: '1A', tooltip: 'Datos del último año' },
  ];

  const getChartData = () => {
    const data = [];
    if (chartRange === 'ytd') {
      for (let m = 1; m <= currentMonth; m++) {
        const d = new Date(currentYear, m - 1, 1);
        const monthName = d.toLocaleString('es-ES', { month: 'short' });
        const monthlyTotal = invoices
          .filter(inv => { const [y, mo] = inv.date.split('-').map(Number); return inv.status === 'Pagado' && y === currentYear && mo === m; })
          .reduce((acc, curr) => acc + curr.amount, 0);
        const monthlyAppointments = appointments
          .filter(appt => { const [y, mo] = appt.date.split('-').map(Number); return appt.status !== 'Cancelada' && y === currentYear && mo === m; }).length;
        data.push({ name: monthName, total: monthlyTotal, appointments: monthlyAppointments, isCurrent: m === currentMonth });
      }
    } else {
      const months = chartRange === '3m' ? 3 : chartRange === '6m' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const monthNum = d.getMonth() + 1;
        const yearNum = d.getFullYear();
        const monthName = months <= 6
          ? d.toLocaleString('es-ES', { month: 'short' })
          : d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        const monthlyTotal = invoices
          .filter(inv => { const [y, m] = inv.date.split('-').map(Number); return inv.status === 'Pagado' && y === yearNum && m === monthNum; })
          .reduce((acc, curr) => acc + curr.amount, 0);
        const monthlyAppointments = appointments
          .filter(appt => { const [y, m] = appt.date.split('-').map(Number); return appt.status !== 'Cancelada' && y === yearNum && m === monthNum; }).length;
        data.push({ name: monthName, total: monthlyTotal, appointments: monthlyAppointments, isCurrent: i === 0 });
      }
    }
    return data;
  };
  const chartData = getChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
          <p className="font-bold text-slate-800 mb-2 capitalize">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 text-sm font-bold flex items-center gap-2"><CreditCard className="w-3 h-3" />{currency}{payload[0].value.toLocaleString()}</p>
            <p className="text-blue-600 text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3" />{payload[0].payload.appointments} Citas</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleOpenApptModal = (appt: Appointment) => {
    setEditingAppointment({ ...appt });
    setIsApptModalOpen(true);
  };

  const handleApptSaved = () => {
    setAppointments(store.getAppointments());
  };

  const todaysAppointments = appointments
    .filter(a => a.date === todayStr && a.status !== 'Cancelada')
    .sort((a, b) => a.time.localeCompare(b.time));

  const pendingMenuPatients = patients.filter(p => p.clinical.status === 'Menú Pendiente');

  return (
    <div className="space-y-3 animate-in fade-in duration-500 pb-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hola, {user.name}</h1>
          <p className="text-slate-500 text-xs">Aquí tienes el resumen de tu clínica.</p>
        </div>
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2 border-r border-slate-100">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-400 uppercase">Filtrar:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-emerald-500 transition-colors" />
            <span className="text-slate-300 font-bold">-</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-emerald-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Mobile: Agenda de Hoy */}
      <div className="md:hidden bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[280px]">
        <div className="p-3 bg-slate-900 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Agenda de Hoy</h3>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-slate-400 text-xs">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
          {todaysAppointments.length === 0 ? (
            <div className="h-24 flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-6 h-6 mb-1 opacity-30" />
              <p className="text-xs">Sin citas para hoy</p>
            </div>
          ) : (
            todaysAppointments.map(appt => (
              <div key={appt.id} onClick={() => handleOpenApptModal(appt)} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${appt.status === 'Completada' ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 text-sm">{appt.time}</span>
                    <h4 className="font-bold text-slate-700 text-xs">{appt.patientName}</h4>
                    <p className="text-[10px] text-slate-400">{appt.type}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${appt.modality === 'Video' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{appt.modality}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-0.5 group-hover:text-slate-600 transition-colors">
                      <Calendar className="w-2.5 h-2.5" /> Ver
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile: Atención Prioritaria */}
      <div className="md:hidden bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-slate-800 text-sm">Menús Pendientes</h3>
        </div>
        <div className="divide-y divide-slate-50 overflow-y-auto max-h-[240px]">
          {pendingMenuPatients.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">¡Todo al día! No hay menús pendientes.</div>
          ) : (
            pendingMenuPatients.map(patient => (
              <div key={patient.id} onClick={() => onSelectPatient(patient.id)} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{patient.firstName} {patient.lastName}</h4>
                    <p className="text-[10px] text-slate-400">{patient.clinical.consultmotive || 'Sin objetivo definido'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pendiente</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-indigo-200 transition-all">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-medium block">Total Pacientes</span>
            <span className="text-2xl font-bold text-slate-900">{totalPatients}</span>
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-emerald-200 transition-all">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-slate-400 text-xs font-medium block">Ingresos</span>
            <span className="text-2xl font-bold text-slate-900">{currency}{totalIncome.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-blue-200 transition-all">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-medium block">Citas Agendadas</span>
            <span className="text-2xl font-bold text-slate-900">{appointmentsCount}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 rounded-xl border border-amber-100 shadow-sm flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-amber-500 shadow-sm shrink-0">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <span className="text-amber-800/70 text-xs font-bold block">Menús Pendientes</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-900">{pendingMenusCount}</span>
              {pendingMenusCount > 0 && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Comportamiento de Ingresos</h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {chartRangeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setChartRange(opt.value)}
                    title={opt.tooltip}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${chartRange === opt.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${currency}${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="total" radius={[5, 5, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#10b981' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="hidden md:flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col">
            <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Atención Prioritaria: Menús Pendientes</h3>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[220px]">
              {pendingMenuPatients.length === 0 ? (
                <div className="p-5 text-center text-slate-400 text-sm">¡Todo al día! No hay menús pendientes.</div>
              ) : (
                pendingMenuPatients.map(patient => (
                  <div key={patient.id} onClick={() => onSelectPatient(patient.id)} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{patient.firstName} {patient.lastName}</h4>
                        <p className="text-[10px] text-slate-400">{patient.clinical.consultmotive || 'Sin objetivo definido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pendiente</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="hidden md:block lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(180px + 220px + 0.75rem + 8px + 48px)' }}>
            <div className="p-3 bg-slate-900 text-white">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">Agenda de Hoy</h3>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-slate-400 text-xs">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
              {todaysAppointments.length === 0 ? (
                <div className="h-24 flex flex-col items-center justify-center text-slate-400">
                  <Clock className="w-6 h-6 mb-1 opacity-30" />
                  <p className="text-xs">Sin citas para hoy</p>
                </div>
              ) : (
                todaysAppointments.map(appt => (
                  <div key={appt.id} onClick={() => handleOpenApptModal(appt)} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${appt.status === 'Completada' ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 text-sm">{appt.time}</span>
                        <h4 className="font-bold text-slate-700 text-xs">{appt.patientName}</h4>
                        <p className="text-[10px] text-slate-400">{appt.type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${appt.modality === 'Video' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {appt.modality}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-0.5 group-hover:text-slate-600 transition-colors">
                          <Calendar className="w-2.5 h-2.5" /> Ver
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isApptModalOpen && editingAppointment && (
        <CalendarAppointmentModal
          mode="edit"
          appointment={editingAppointment}
          patients={patients}
          onClose={() => { setIsApptModalOpen(false); setEditingAppointment(null); }}
          onSaved={handleApptSaved}
        />
      )}
    </div>
  );
};