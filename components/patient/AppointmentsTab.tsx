import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { store } from '../../services/store';
import { Calendar, Clock, Video, User } from 'lucide-react';
import { SectionHeader } from './SharedComponents';
import { CalendarAppointmentModal, getStatusStyles } from "../../components/calendar_components/CalendarAppointmentModal";

export const AppointmentsTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const loadAppointments = () => {
    const all = store.getAppointments();
    setAppointments(
      all
        .filter(a => a.patientId === patientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  useEffect(() => {
    loadAppointments();
  }, [patientId]);

  const handleEditClick = (appt: Appointment) => {
    setEditingAppointment(appt);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    loadAppointments();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">
      <SectionHeader icon={Calendar} title="Historial de Citas" />

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="italic">No hay citas registradas para este paciente.</p>
          <p className="text-sm mt-2">Agrega una cita desde el Calendario General.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(appt => (
            <div
              key={appt.id}
              onClick={() => handleEditClick(appt)}
              className="flex flex-col md:flex-row gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 p-3 rounded-lg min-w-[80px]">
                <span className="text-xs font-bold uppercase">
                  {new Date(appt.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                </span>
                <span className="text-xl font-bold">{new Date(appt.date + 'T12:00:00').getDate()}</span>
                <span className="text-xs">{new Date(appt.date + 'T12:00:00').getFullYear()}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{appt.type}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {appt.time} ({appt.duration} min)</span>
                      <span className="flex items-center gap-1">
                        {appt.modality === 'Video' ? <Video className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        {appt.modality}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingAppointment && (
        <CalendarAppointmentModal
          mode="edit"
          appointment={editingAppointment}
          onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};