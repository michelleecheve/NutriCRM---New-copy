import React, { useState } from 'react';
import { Appointment, Patient } from '../../types';
import { store } from '../../services/store';
import { Calendar as CalendarIcon, X, MapPin, Video } from 'lucide-react';

// ─── Shared helper ────────────────────────────────────────────────────────────
export const getStatusStyles = (status: string): string => {
  switch (status) {
    case 'Programada': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'Completada': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'Cancelada':  return 'bg-red-50 text-red-600 border-red-100';
    case 'Reagendada': return 'bg-amber-50 text-amber-600 border-amber-100';
    default:           return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface CalendarAppointmentModalProps {
  mode:        'create' | 'edit';
  appointment: Partial<Appointment>;
  patients?:   Patient[];
  targetNutritionistId?: string;
  isManagingForOtherNutritionist?: boolean;
  onClose:     () => void;
  onSaved:     () => void;
}

// ─── Reusable label ───────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
    {children}
  </label>
);

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm";

// ─── Component ────────────────────────────────────────────────────────────────
export const CalendarAppointmentModal: React.FC<CalendarAppointmentModalProps> = ({
  mode,
  appointment,
  patients = [],
  targetNutritionistId,
  isManagingForOtherNutritionist = false,
  onClose,
  onSaved,
  }) => {
  const [formData, setFormData] = useState<Partial<Appointment>>({ ...appointment });
  const [manualPatientName, setManualPatientName] = useState(appointment.patientName || '');
  const [tempPhone, setTempPhone] = useState('');

  const isEdit = mode === 'edit';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualPatientName.trim()) return;
    if (!formData.date || !formData.time) return;

    const now = new Date().toISOString();
    const patientName = manualPatientName.trim();

    try {
      const appointmentData = { 
        ...formData, 
        patientName, 
        createdAt: now, 
        updatedAt: now 
      };

      // Determinar si estamos manejando citas de otra nutricionista
      if (isManagingForOtherNutritionist && targetNutritionistId) {
        if (isEdit) {
          await store.updateAppointmentForNutritionist(
            targetNutritionistId,
            { ...appointmentData as Appointment } as any
          );
        } else {
          await store.addAppointmentForNutritionist(
            targetNutritionistId,
            { ...appointmentData as any }
          );
        }
      } else {
        // Operaciones normales (propias citas)
        if (isEdit) {
          await store.updateAppointment({ ...appointmentData as Appointment } as any);
        } else {
          await store.addAppointment({ ...appointmentData as any });
        }
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  return (
    // Overlay — cubre toda la pantalla sin cortes
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 border border-slate-100 my-auto">

        {/* ── Header ── */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Detalles de la Cita' : 'Agendar Nueva Cita'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Modifica los detalles o el estado' : 'Complete los detalles de la sesión'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body: 2 columns ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

            {/* ── LEFT: Paciente ── */}
            <div className="p-6 space-y-4">
              <div>
                <Label>Paciente</Label>
                <input
                  type="text" 
                  required
                  placeholder="Nombre del paciente..."
                  value={manualPatientName}
                  onChange={e => setManualPatientName(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Tel */}
              <div>
                <Label>Tel.</Label>
                <input
                  type="tel"
                  placeholder="Número de celular..."
                  value={tempPhone}
                  onChange={e => setTempPhone(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Status — edit only */}
              {isEdit && (
                <div>
                  <Label>Estado de la Cita</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Programada', 'Completada', 'Reagendada', 'Cancelada'] as const).map(status => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setFormData({ ...formData, status })}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          formData.status === status
                            ? getStatusStyles(status)
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Detalles de la cita ── */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalles de la Cita</p>

              {/* Date & Time */}
              <div className="space-y-3">
                <div className="min-w-0">
                  <Label>Fecha</Label>
                  <input
                    type="date" required
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className={inputCls + ' max-w-full'}
                  />
                </div>
                <div className="min-w-0">
                  <Label>Hora Inicio</Label>
                  <input
                    type="time" required
                    value={formData.time || ''}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className={inputCls + ' max-w-full'}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label>Duración (min)</Label>
                <select
                  value={formData.duration || 60}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className={inputCls}
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>

              {/* Modality */}
              <div>
                <Label>Modalidad</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Presencial', 'Video'] as const).map(mod => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setFormData({ ...formData, modality: mod })}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all border flex items-center justify-center gap-1.5 ${
                        formData.modality === mod
                          ? mod === 'Presencial'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {mod === 'Presencial'
                        ? <><MapPin className="w-3.5 h-3.5" /> Presencial</>
                        : <><Video className="w-3.5 h-3.5" /> Video</>
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <Label>Tipo de Consulta</Label>
                <select
                  value={formData.type || 'Seguimiento'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className={inputCls}
                >
                  <option value="Primera Consulta">Primera Consulta</option>
                  <option value="Seguimiento">Consulta de Seguimiento</option>
                </select>
              </div>
            </div>
          </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-white rounded-xl font-semibold shadow-lg transition-all text-sm ${
                isEdit
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {isEdit ? 'Guardar Cambios' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};