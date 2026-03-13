import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, Patient, AppUser } from '../types';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { getTodayStr } from '../src/utils/dateUtils';
import { CalendarGrid } from '../components/calendar_components/CalendarGrid';
import { CalendarSidebar } from '../components/calendar_components/CalendarSidebar';
import { CalendarAppointmentModal } from '../components/calendar_components/CalendarAppointmentModal';
import { CalendarHistorialTable } from '../components/calendar_components/CalendarHistorialTable';
import { CalendarSelector } from '../components/calendar_components/CalendarSelector';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user] = useState(store.getUserProfile());
  const currentAppUser = authStore.getCurrentUser();
  
  // Calendar selector state for receptionist/admin
  const [selectedNutritionistId, setSelectedNutritionistId] = useState<string | null>(
    authStore.getSelectedNutritionistId()
  );
  
  // Get linked nutritionists for receptionist/admin
  const [linkedNutritionists, setLinkedNutritionists] = useState<AppUser[]>([]);

  useEffect(() => {
    authStore.getLinkedNutritionists().then(nutris => {
      setLinkedNutritionists(nutris);
      // Si no hay nutricionista seleccionada, seleccionar la primera
      if (nutris.length > 0 && !selectedNutritionistId) {
        setSelectedNutritionistId(nutris[0].id);
      }
    });
  }, []);
  
  // Check if calendar selector should be visible based on module permissions
  const showCalendarSelector = authStore.canAccessModule('calendar', 'calendar-selector');

  // ── Determinar de quién cargar los appointments ───────────────────────────
  // Reemplaza el useMemo completo:
  const targetNutritionistId = useMemo(() => {
    if (currentAppUser?.role === 'nutricionista') {
      return currentAppUser.id;
    }
    if (showCalendarSelector && linkedNutritionists.length > 0) {
      return selectedNutritionistId || linkedNutritionists[0].id;
    }
    return currentAppUser?.id || 'guest';
  }, [currentAppUser, showCalendarSelector, selectedNutritionistId, linkedNutritionists]);

  // ── Cargar appointments de la nutricionista target ────────────────────────
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (targetNutritionistId === currentAppUser?.id) {
          // Cargar las propias
          setAppointments(store.getAppointments());
          setPatients(store.getPatients());
        } else {
          // Cargar las de otra nutricionista
          const appts = await store.getAppointmentsForNutritionist(targetNutritionistId);
          setAppointments(appts);
          setPatients(store.getPatientsForNutritionist(targetNutritionistId));
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      }
    };
    fetchData();
  }, [targetNutritionistId, currentAppUser?.id]);

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

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1));

  const handleCreateAppointment = (day?: number) => {
    const dateStr = day
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : todayStr;
    setSelectedAppointment({ date: dateStr, time: '09:00', duration: 60, type: 'Primera Cita', modality: 'Presencial', status: 'Programada' });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      if (targetNutritionistId === currentAppUser?.id) {
        setAppointments(store.getAppointments());
        setPatients(store.getPatients());
      } else {
        const appts = await store.getAppointmentsForNutritionist(targetNutritionistId);
        setAppointments(appts);
        setPatients(store.getPatientsForNutritionist(targetNutritionistId));
      }
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
    }
  };

  const handleNutritionistChange = (nutritionistId: string) => {
    setSelectedNutritionistId(nutritionistId);
    authStore.setSelectedNutritionistId(nutritionistId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              Calendario
            </h1>
            <p className="text-slate-500 mt-1">Gestiona tus citas y agenda</p>
          </div>
          <button
            onClick={() => handleCreateAppointment()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nueva Cita
          </button>
        </div>

        {/* Calendar Selector for receptionist/admin */}
        {showCalendarSelector && linkedNutritionists.length > 0 && (
          <CalendarSelector 
            linkedNutritionists={linkedNutritionists}
            selectedNutritionistId={targetNutritionistId}
            onNutritionistChange={handleNutritionistChange}
          />
        )}

        {/* Calendar + Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CalendarGrid
            currentDate={currentDate}
            appointments={appointments}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onDayClick={handleCreateAppointment}
            onAppointmentClick={(e, appt) => {
              e.stopPropagation();
              handleEditAppointment(appt);
            }}
          />
          <CalendarSidebar
            todayStr={todayStr}
            fiveDaysFromNowStr={fiveDaysFromNowStr}
            appointments={appointments}
            onAppointmentClick={handleEditAppointment}
          />
        </div>

        {/* Historial Table */}
        <CalendarHistorialTable
          appointments={appointments}
          currentYear={year}
          currentMonth={month + 1}
          todayStr={todayStr}
          targetNutritionistId={targetNutritionistId}
          isManagingForOtherNutritionist={targetNutritionistId !== currentAppUser?.id}
          onEditClick={handleEditAppointment}
          onRefresh={handleRefresh}
        />

        {/* Modal */}
        {isModalOpen && (
          <CalendarAppointmentModal
            mode={modalMode}
            appointment={selectedAppointment}
            patients={patients}
            targetNutritionistId={targetNutritionistId}
            isManagingForOtherNutritionist={targetNutritionistId !== currentAppUser?.id}
            onClose={() => setIsModalOpen(false)}
            onSaved={handleRefresh}
          />
        )}
      </div>
    </div>
  );
};