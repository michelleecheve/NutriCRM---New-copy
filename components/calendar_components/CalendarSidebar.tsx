import React from 'react';
import { Appointment } from '../../types';
import { Clock, Video, MapPin, CalendarDays, AlertCircle } from 'lucide-react';
import { getStatusStyles } from './CalendarAppointmentModal';

interface CalendarSidebarProps {
  todayStr: string;
  fiveDaysFromNowStr: string;
  appointments: Appointment[];
  onAppointmentClick: (appt: Appointment) => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  todayStr,
  fiveDaysFromNowStr,
  appointments,
  onAppointmentClick,
}) => {
  const todaysAppointments = appointments
    .filter(a => a.date === todayStr && a.status !== 'Cancelada')
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingAppointments = appointments
    .filter(a => a.date > todayStr && a.date <= fiveDaysFromNowStr && a.status !== 'Cancelada')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="lg:col-span-1 flex flex-col gap-6">

      {/* Today's List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col max-h-[400px]">
        <div className="p-5 border-b border-slate-100 bg-white z-10 rounded-t-2xl flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            Agenda de Hoy
          </h3>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {todaysAppointments.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {todaysAppointments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
              <Clock className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No hay citas para hoy</p>
            </div>
          ) : (
            todaysAppointments.map(appt => (
              <div
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800 text-sm">{appt.time}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusStyles(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-700 text-sm mb-1">{appt.patientName}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    {appt.modality === 'Video' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {appt.modality}
                  </span>
                  <span>•</span>
                  <span>{appt.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming List (Next 5 Days) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col max-h-[400px]">
        <div className="p-5 border-b border-slate-100 bg-white z-10 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Próximas Citas
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">5 Días</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {upcomingAppointments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No hay citas en los próximos 5 días.
            </div>
          ) : (
            upcomingAppointments.map(appt => (
              <div
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="bg-slate-100 p-2 rounded-lg text-center min-w-[50px]">
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    {new Date(appt.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                  </div>
                  <div className="text-lg font-bold text-slate-800 leading-none">
                    {new Date(appt.date + 'T12:00:00').getDate()}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-slate-700 text-sm truncate">{appt.patientName}</h4>
                    {appt.status === 'Reagendada' && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Reag.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" /> {appt.time}
                    <span>•</span>
                    <span className="truncate">{appt.type}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};