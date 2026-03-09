import React, { useState, useMemo } from 'react';
import { Appointment, Patient } from '../types';
import { store } from '../services/store';
import { authStore } from '../services/authStore';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { getTodayStr } from '../src/utils/dateUtils';
import { CalendarGrid } from '../components/calendar_components/CalendarGrid';
import { CalendarSidebar } from '../components/calendar_components/CalendarSidebar';
import { CalendarAppointmentModal } from '../components/calendar_components/CalendarAppointmentModal';
import { CalendarHistorialTable } from '../components/calendar_components/CalendarHistorialTable';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user] = useState(store.getUserProfile());
  const currentAppUser = authStore.getCurrentUser();
  
  // Calendar selector state for receptionist/admin
  const [selectedNutritionistId, setSelectedNutritionistId] = useState<string | null>(
    authStore.getSelectedNutritionistId()
  );
  
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

  // Get linked nutritionists for receptionist/admin
  const linkedNutritionists = authStore.getLinkedNutritionists();
  
  // Check if calendar selector should be visible based on module permissions
  const showCalendarSelector = authStore.canAccessModule('calendar', 'calendar-selector');

  // Filter appointments based on selected nutritionist
  const filteredAppointments = useMemo(() => {
    // Si no debe mostrar el selector, mostrar las citas correspondientes
    if (!showCalendarSelector) {
      // Si es nutricionista, mostrar solo sus citas
      if (currentAppUser?.role === 'nutricionista') {
        return appointments.filter(appt => 
          appt.nutritionistId === currentAppUser.id || !appt.nutritionistId
        );
      }
      return appointments;
    }
    
    // Para quienes tienen acceso al selector (admin/recepcionista configurado)
    // Si no hay nutricionista seleccionada pero hay vinculadas, seleccionar la primera
    if (!selectedNutritionistId && linkedNutritionists.length > 0) {
      const firstId = linkedNutritionists[0].id;
      setSelectedNutritionistId(firstId);
      authStore.setSelectedNutritionistId(firstId);
      // Filtrar por la primera nutricionista
      return appointments.filter(appt => 
        appt.nutritionistId === firstId || !appt.nutritionistId
      );
    }
    
    // Filtrar por nutricionista seleccionada
    if (selectedNutritionistId) {
      return appointments.filter(appt => 
        appt.nutritionistId === selectedNutritionistId || !appt.nutritionistId
      );
    }
    
    return appointments;
  }, [appointments, selectedNutritionistId, showCalendarSelector, linkedNutritionists, currentAppUser]);

  // ── Calendar selector handler ─────────────────────────────────────────────
  const handleNutritionistChange = (nutritionistId: string) => {
    setSelectedNutritionistId(nutritionistId);
    authStore.setSelectedNutritionistId(nutritionistId);
  };

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openCreateModal = (dateStr?: string) => {
    setModalMode('create');
    
    // Determinar qué nutritionistId usar
    let nutritionistId = currentAppUser?.id;
    if (showCalendarSelector) {
      // Si tiene acceso al selector, usar la nutricionista seleccionada
      nutritionistId = selectedNutritionistId || undefined;
    }
    
    setSelectedAppointment({
      patientId: '',
      date: dateStr || getTodayStr(user.timezone),
      time: '09:00',
      duration: 60,
      type: 'Seguimiento',
      modality: 'Presencial',
      status: 'Programada',
      nutritionistId,
      receptionistId: currentAppUser?.role === 'recepcionista' ? currentAppUser.id : undefined,
      createdBy: currentAppUser?.id,
      createdByRole: currentAppUser?.role,
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

      {/* Calendar Selector - Visible based on module permissions */}
      {showCalendarSelector && linkedNutritionists.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50">
                <CalendarIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Calendario de</h3>
                <p className="text-xs text-slate-500">Selecciona la nutricionista para ver su agenda</p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <select
                value={selectedNutritionistId || ''}
                onChange={(e) => handleNutritionistChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 font-medium transition-all"
              >
                {linkedNutritionists.map((nutritionist) => (
                  <option key={nutritionist.id} value={nutritionist.id}>
                    {nutritionist.profile.name} - {nutritionist.profile.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

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
          appointments={filteredAppointments}
          onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
          onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
          onDayClick={handleDayClick}
          onAppointmentClick={handleAppointmentClick}
        />

        <CalendarSidebar
          todayStr={todayStr}
          fiveDaysFromNowStr={fiveDaysFromNowStr}
          appointments={filteredAppointments}
          onAppointmentClick={(appt) => openEditModal(appt)}
        />
      </div>

      {/* Historial */}
      <CalendarHistorialTable
        appointments={filteredAppointments}
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