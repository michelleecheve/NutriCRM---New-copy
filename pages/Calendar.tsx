import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import { store } from '../services/store';
import { Plus } from 'lucide-react';
import { getTodayStr } from '../src/utils/dateUtils';
import { CalendarGrid } from '../components/calendar_components/CalendarGrid';
import { CalendarSidebar } from '../components/calendar_components/CalendarSidebar';
import { CalendarAppointmentModal } from '../components/calendar_components/CalendarAppointmentModal';
import { CalendarHistorialTable } from '../components/calendar_components/CalendarHistorialTable';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user] = useState(store.getUserProfile());
  const [appointments, setAppointments] = useState<Appointment[]>(store.getAppointments());
  const [patients] = useState<Patient[]>(store.getPatients());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<Appointment>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayStr = getTodayStr(user.timezone);

  const fiveDaysFromNowDate = new Date();
  fiveDaysFromNowDate.setDate(fiveDaysFromNowDate.getDate() + 5);
  const d = fiveDaysFromNowDate;
  const fiveDaysFromNowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openCreateModal = (dateStr?: string) => {
    setModalMode('create');
    setSelectedAppointment({
      patientId: '',
      date: dateStr || getTodayStr(user.timezone),
      time: '09:00',
      duration: 60,
      type: 'Seguimiento',
      modality: 'Presencial',
      status: 'Programada',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (appt: Appointment) => {
    setModalMode('edit');
    setSelectedAppointment({ ...appt });
    setIsModalOpen(true);
  };

  // ── Calendar handlers ─────────────────────────────────────────────────────
  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    openCreateModal(dateStr);
  };

  const handleAppointmentClick = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation();
    openEditModal(appt);
  };

  const handleSaved = () => {
    setAppointments([...store.getAppointments()]);
  };

  return (
    <div className="flex flex-col space-y-6 pb-12 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Calendario de Citas</h2>
          <p className="text-slate-500 mt-1">Gestiona tu agenda y visualiza el registro de movimientos.</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" /> Nueva Cita
        </button>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <CalendarGrid
          currentDate={currentDate}
          appointments={appointments}
          onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
          onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
          onDayClick={handleDayClick}
          onAppointmentClick={handleAppointmentClick}
        />

        <CalendarSidebar
          todayStr={todayStr}
          fiveDaysFromNowStr={fiveDaysFromNowStr}
          appointments={appointments}
          onAppointmentClick={(appt) => openEditModal(appt)}
        />
      </div>

      {/* Historial */}
      <CalendarHistorialTable
        appointments={appointments}
        currentYear={year}
        currentMonth={month + 1}
        todayStr={todayStr}
        onEditClick={openEditModal}
        onRefresh={handleSaved}
      />

      {/* Modal */}
      {isModalOpen && (
        <CalendarAppointmentModal
          mode={modalMode}
          appointment={selectedAppointment}
          patients={patients}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};