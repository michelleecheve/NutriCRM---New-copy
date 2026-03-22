import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, Users, TrendingUp } from 'lucide-react';
import { authStore } from '../services/authStore';
import { store } from '../services/store';
import { AppRoute, Appointment, AppUser } from '../types';

interface Props {
  onNavigate: (page: string) => void;
}

export const MainPanelReceptionist: React.FC<Props> = ({ onNavigate }) => {
  const currentUser = authStore.getCurrentUser();
  const [linkedNutris, setLinkedNutris] = useState<AppUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(store.getAppointments());

  useEffect(() => {
    authStore.getLinkedNutritionists().then(setLinkedNutris);
  }, []);

  useEffect(() => {
    const checkInit = setInterval(() => {
      if (store.isInitialized) {
        setAppointments(store.getAppointments());
        clearInterval(checkInit);
      }
    }, 100);
    return () => clearInterval(checkInit);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today);
  const upcomingAppts = appointments.filter(a => a.date > today);

  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    Programada:  { bg: '#dcfce7', color: '#166534', label: 'Programada' },
    Completada:  { bg: '#f3f4f6', color: '#374151', label: 'Completada' },
    Cancelada:   { bg: '#fee2e2', color: '#991b1b', label: 'Cancelada' },
    Reagendada:  { bg: '#fef9c3', color: '#854d0e', label: 'Reagendada' },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Bienvenida, {currentUser?.profile?.name?.split(' ')[0] || 'Usuario'} 👋
        </h1>
        <p className="text-slate-500 mt-1">Vista general de la agenda de tus nutricionistas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Nutricionistas', value: linkedNutris.length },
          { icon: <CalendarDays className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50', label: 'Citas Hoy', value: todayAppts.length },
          { icon: <Clock className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50', label: 'Próximas Citas', value: upcomingAppts.length },
          { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Total Citas', value: appointments.length },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nutricionistas vinculadas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Mis Nutricionistas</h3>
            <button
              onClick={() => onNavigate(AppRoute.CALENDAR)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Ver calendario →
            </button>
          </div>

          {linkedNutris.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tienes nutricionistas vinculadas.</p>
          ) : (
            <div className="space-y-3">
              {linkedNutris.map(n => {
                const nutriAppts = appointments.filter(a => a.patientName);
                return (
                  <div key={n.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {n.profile.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {n.profile.professionalTitle} {n.profile.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{n.profile.specialty}</p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {nutriAppts.length} citas
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Citas recientes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-5">Citas Recientes</h3>
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No hay citas registradas.</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map(appt => {
                const s = statusStyles[appt.status] ?? statusStyles.Programada;
                const d = new Date(appt.date + 'T12:00');
                return (
                  <div key={appt.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="text-center bg-white border border-slate-200 rounded-lg px-2 py-1 min-w-[44px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {d.toLocaleDateString('es', { month: 'short' })}
                      </p>
                      <p className="text-lg font-bold text-slate-800 leading-none">{d.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{appt.patientName}</p>
                      <p className="text-xs text-slate-400">{appt.time} · {appt.type}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};