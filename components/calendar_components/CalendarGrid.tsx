import React from 'react';
import { Appointment } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: number) => void;
  onAppointmentClick: (e: React.MouseEvent, appt: Appointment) => void;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  appointments,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onAppointmentClick,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.date === dateStr && a.status !== 'Cancelada');
  };

  return (
    <div className="lg:col-span-2 lg:order-first flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">

      {/* Controls */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onPrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold text-slate-800 w-48 text-center capitalize">
            {monthNames[month]} {year}
          </h3>
          <button onClick={onNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="hidden sm:flex gap-3 text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Presencial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Video</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <div
              key={day}
              onClick={() => onDayClick(day)}
              className="bg-white p-2 min-h-[100px] hover:bg-slate-50 transition-colors cursor-pointer group relative flex flex-col gap-1"
            >
              <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                {day}
              </div>

              {dayAppointments.map(appt => (
                <div
                  key={appt.id}
                  onClick={(e) => onAppointmentClick(e, appt)}
                  className={`text-[10px] px-2 py-1 rounded border-l-2 cursor-pointer transition-transform hover:scale-[1.02] truncate shadow-sm ${
                    appt.status === 'Reagendada'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : appt.modality === 'Presencial'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-blue-50 border-blue-500 text-blue-800'
                  }`}
                  title={`${appt.time} - ${appt.patientName} (${appt.type})`}
                >
                  <span className="font-bold mr-1">{appt.time}</span>
                  {appt.patientName.split(' ')[0]}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};