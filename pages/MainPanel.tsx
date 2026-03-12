import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { Patient, Appointment, Invoice } from '../types';
import { CreditCard, Calendar, ChefHat, TrendingUp, Clock, ChevronRight, AlertCircle, CalendarDays, Users, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getTodayStr } from '../src/utils/dateUtils';
import { CalendarAppointmentModal } from '../components/calendar_components/CalendarAppointmentModal';

interface MainPanelProps {
  onSelectPatient: (patientId: string, tab?: string) => void;
}

export const MainPanel: React.FC<MainPanelProps> = ({ onSelectPatient }) => {
  const currentUser = authStore.getCurrentUser();
  const user = currentUser?.profile || store.getUserProfile();
  
  // Guard against null user or missing timezone
  if (!user || !user.timezone) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  const todayStr = getTodayStr(user.timezone);
  const [currentYear, currentMonth] = todayStr.split('-').map(Number);

  const getFirstDay = () => `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const getLastDay = () => {
    const last = new Date(currentYear, currentMonth, 0);
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  };

  const [dateRange, setDateRange] = useState({ start: getFirstDay(), end: getLastDay() });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setPatients(store.getPatients());
        setAppointments(store.getAppointments());
        setInvoices(store.getInvoices());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  // Modal state
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const isInPeriod = (dateString: string) =>
    !!dateString && dateString >= dateRange.start && dateString <= dateRange.end;

  // KPI: Total de pacientes (sin filtro)
  const totalPatients = patients.length;

  const totalIncome = invoices
    .filter(inv => inv.status === 'Pagado' && isInPeriod(inv.date))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const appointmentsCount = appointments.filter(a => a.status !== 'Cancelada' && isInPeriod(a.date)).length;
  const pendingMenusCount = patients.filter(p => p.clinical.status === 'Menú Pendiente').length;

  // Chart
  const getLast6MonthsData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthNum = d.getMonth() + 1;
      const yearNum = d.getFullYear();
      const monthName = d.toLocaleString('es-ES', { month: 'short' });
      const monthlyTotal = invoices
        .filter(inv => { const [y, m] = inv.date.split('-').map(Number); return inv.status === 'Pagado' && y === yearNum && m === monthNum; })
        .reduce((acc, curr) => acc + curr.amount, 0);
      const monthlyAppointments = appointments
        .filter(appt => { const [y, m] = appt.date.split('-').map(Number); return appt.status !== 'Cancelada' && y === yearNum && m === monthNum; }).length;
      data.push({ name: monthName, total: monthlyTotal, appointments: monthlyAppointments, isCurrent: i === 0 });
    }
    return data;
  };
  const chartData = getLast6MonthsData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
          <p className="font-bold text-slate-800 mb-2 capitalize">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 text-sm font-bold flex items-center gap-2"><CreditCard className="w-3 h-3" />Q{payload[0].value.toLocaleString()}</p>
            <p className="text-blue-600 text-xs font-bold flex items-center gap-2"><Calendar className="w-3 h-3" />{payload[0].payload.appointments} Citas</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handlers
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hola, {user.name} 👋</h1>
          <p className="text-slate-500 mt-1">Aquí tienes el resumen de tu clínica.</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 border-r border-slate-100">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-400 uppercase">Filtrar:</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-2 py-1 outline-none focus:border-emerald-500 transition-colors" />
            <span className="text-slate-300 font-bold">-</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-2 py-1 outline-none focus:border-emerald-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta Pacientes - TOTAL SIN FILTRO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-sm font-medium block mb-1">Total Pacientes</span>
            <span className="text-3xl font-bold text-slate-900">{totalPatients}</span>
          </div>
        </div>

        {/* Tarjeta Ingresos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${totalIncome > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
              <TrendingUp className="w-3 h-3" /> Reporte
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-sm font-medium block mb-1">Ingresos (Periodo)</span>
            <span className="text-3xl font-bold text-slate-900">Q{totalIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Tarjeta Citas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-sm font-medium block mb-1">Citas Agendadas</span>
            <span className="text-3xl font-bold text-slate-900">{appointmentsCount}</span>
          </div>
        </div>

        {/* Tarjeta Menús Pendientes */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white p-3 rounded-xl text-amber-500 shadow-sm">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <span className="text-amber-800/70 text-sm font-bold block mb-1">Menús Pendientes</span>
            <span className="text-3xl font-bold text-amber-900">{pendingMenusCount}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Comportamiento de Ingresos</h3>
              <span className="text-xs font-bold text-slate-400 uppercase">Últimos 6 Meses</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `Q${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#10b981' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800">Atención Prioritaria: Menús Pendientes</h3>
              </div>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[480px]">
              {pendingMenuPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">¡Todo al día! No hay menús pendientes.</div>
              ) : (
                pendingMenuPatients.map(patient => (
                  <div key={patient.id} onClick={() => onSelectPatient(patient.id)} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{patient.firstName} {patient.lastName}</h4>
                        <p className="text-xs text-slate-400">{patient.clinical.consultmotive || 'Sin objetivo definido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Pendiente</span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full max-h-[600px] flex flex-col">
            <div className="p-6 bg-slate-900 text-white">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-lg">Agenda de Hoy</h3>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {todaysAppointments.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                  <Clock className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Sin citas para hoy</p>
                </div>
              ) : (
                todaysAppointments.map(appt => (
                  <div key={appt.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${appt.status === 'Completada' ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 text-lg">{appt.time}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${appt.modality === 'Video' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {appt.modality}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm">{appt.patientName}</h4>
                    <p className="text-xs text-slate-400 mt-1">{appt.type}</p>
                    <div className="mt-4">
                      <button onClick={() => handleOpenApptModal(appt)} className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Ver Cita
                      </button>
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