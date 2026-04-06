import React, { useState, useRef, useEffect } from 'react';
import { Appointment } from '../../types';
import { ChevronLeft, ChevronRight, LayoutGrid, CalendarDays } from 'lucide-react';

type ViewMode = 'month' | 'week';

interface CalendarGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onNavigateTo: (date: Date) => void;
  onDayClick?: (dateStr: string) => void;
  onAppointmentClick: (e: React.MouseEvent, appt: Appointment) => void;
  userId?: string;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Week starts on Monday
const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const storageKey = (userId?: string) =>
  userId ? `nutriflow_cal_view_v1_${userId}` : 'nutriflow_cal_view_v1';

// Returns the Monday of the week containing `date`
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // daysFromMonday: Mon->0, Tue->1, ..., Sun->6
  const daysFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  appointments,
  onNavigateTo,
  onDayClick,
  onAppointmentClick,
  userId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(storageKey(userId));
    return saved === 'week' ? 'week' : 'month';
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll horizontally to today's column whenever the view changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const todayColIndex = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
    const colWidth = viewMode === 'month' ? 90 : 100;
    container.scrollLeft = todayColIndex * colWidth;
  }, [viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(storageKey(userId), mode);
  };

  // ── Month data ──────────────────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Adjust firstDay so Monday = column 0: (getDay()+6)%7
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDay = (rawFirstDay + 6) % 7;

  // ── Week data ───────────────────────────────────────────────────────────────
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekEnd = weekDays[6]; // Sunday
  const weekTitle =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getDate()} – ${weekEnd.getDate()} de ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : `${weekStart.getDate()} ${monthNames[weekStart.getMonth()].slice(0, 3)} – ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (viewMode === 'month') {
      onNavigateTo(new Date(year, month - 1));
    } else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      onNavigateTo(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      onNavigateTo(new Date(year, month + 1));
    } else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      onNavigateTo(d);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.date === dateStr && a.status !== 'Cancelada');
  };

  const getAppointmentsForDate = (date: Date) =>
    appointments
      .filter(a => a.date === toDateStr(date) && a.status !== 'Cancelada')
      .sort((a, b) => a.time.localeCompare(b.time));

  const fmtTime = (time: string) => time.slice(0, 5);

  const apptClass = (appt: Appointment) =>
    appt.status === 'Reagendada'
      ? 'bg-amber-50 border-amber-500 text-amber-800'
      : appt.modality === 'Presencial'
        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
        : 'bg-blue-50 border-blue-500 text-blue-800';

  const todayStr = toDateStr(new Date());

  return (
    <div className="lg:col-span-2 lg:order-first flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">

      {/* Controls — stays fixed, no horizontal scroll */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 min-w-[170px] sm:min-w-[220px] text-center capitalize">
            {viewMode === 'month' ? `${monthNames[month]} ${year}` : weekTitle}
          </h3>
          <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Legend */}
          <div className="hidden md:flex gap-3 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Presencial</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Video</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => handleViewModeChange('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Mes
            </button>
            <button
              onClick={() => handleViewModeChange('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable grid area — horizontal scroll on mobile */}
      <div ref={scrollRef} className="overflow-x-auto flex-1 flex flex-col">
        {/* min-w gives each of the 7 columns ~90px on mobile (month) and ~114px (week) */}
        <div className={`flex flex-col flex-1 ${viewMode === 'month' ? 'min-w-[630px]' : 'min-w-[700px]'}`}>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* ── Month View ── */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px flex-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white min-h-[90px]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayAppointments = getAppointmentsForDay(day);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={day}
                    onClick={() => onDayClick?.(dateStr)}
                    className="bg-white p-2 min-h-[90px] hover:bg-slate-50 transition-colors cursor-pointer group relative flex flex-col gap-1"
                  >
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0 ${
                      isToday ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 group-hover:text-slate-600'
                    }`}>
                      {day}
                    </div>

                    {dayAppointments.map(appt => (
                      <div
                        key={appt.id}
                        onClick={(e) => onAppointmentClick(e, appt)}
                        className={`text-[10px] px-1.5 py-1 rounded border-l-2 cursor-pointer transition-transform hover:scale-[1.02] shadow-sm ${apptClass(appt)}`}
                        title={`${fmtTime(appt.time)} - ${appt.patientName} (${appt.type})`}
                      >
                        <span className="font-bold mr-1">{fmtTime(appt.time)}</span>
                        <span className="hidden sm:inline truncate">{appt.patientName.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Week View ── */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 bg-slate-100 gap-px flex-1">
              {weekDays.map((date, idx) => {
                const dateStr = toDateStr(date);
                const dayAppts = getAppointmentsForDate(date);
                const isToday = dateStr === todayStr;
                const isCurrentMonth = date.getMonth() === month;

                return (
                  <div
                    key={idx}
                    onClick={() => onDayClick?.(dateStr)}
                    className={`bg-white p-2 min-h-[200px] hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col gap-1.5 ${
                      isToday ? 'ring-1 ring-inset ring-emerald-200' : ''
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex flex-col items-center mb-1 shrink-0">
                      <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-md'
                          : isCurrentMonth
                            ? 'text-slate-700 group-hover:bg-slate-100'
                            : 'text-slate-300 group-hover:bg-slate-100'
                      }`}>
                        {date.getDate()}
                      </span>
                      {/* Month abbreviation when week spans two months */}
                      {!isCurrentMonth && (
                        <span className="text-[9px] text-slate-300 mt-0.5 font-medium uppercase">
                          {monthNames[date.getMonth()].slice(0, 3)}
                        </span>
                      )}
                    </div>

                    {/* Appointments */}
                    {dayAppts.map(appt => (
                      <div
                        key={appt.id}
                        onClick={(e) => onAppointmentClick(e, appt)}
                        className={`text-[10px] px-2 py-1.5 rounded-md border-l-2 cursor-pointer transition-transform hover:scale-[1.01] shadow-sm ${apptClass(appt)}`}
                        title={`${fmtTime(appt.time)} - ${appt.patientName} (${appt.type})`}
                      >
                        <span className="font-bold block leading-tight">{fmtTime(appt.time)}</span>
                        <span className="block truncate leading-tight">
                          {appt.patientName.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                    ))}
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
