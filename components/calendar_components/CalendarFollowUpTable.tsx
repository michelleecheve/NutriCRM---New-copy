import React, { useState, useMemo } from 'react';
import { Appointment } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import {
  Bell, BellOff, CheckCircle2, CalendarClock,
  ChevronDown, ChevronUp, Video, MapPin, XCircle,
} from 'lucide-react';
import { getStatusStyles } from './CalendarAppointmentModal';

interface CalendarFollowUpTableProps {
  appointments: Appointment[];
  todayStr: string;
  onRefresh: () => void;
}

type Tab = 'reconsulta' | 'canceladas';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

// ─── Shared table row ──────────────────────────────────────────────────────────
interface RowProps {
  appt: Appointment;
  futureDate: string | undefined;
  reminderSent: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  extraNote?: React.ReactNode;
}

const FollowUpRow: React.FC<RowProps> = ({
  appt, futureDate, reminderSent, isUpdating, onToggle, extraNote,
}) => {
  const alreadyRescheduled = Boolean(futureDate);
  const suggestedDate = addDays(appt.date, 30);

  return (
    <tr className={`transition-colors hover:bg-slate-50 ${alreadyRescheduled ? 'opacity-55' : ''}`}>
      {/* Tipo */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          {appt.modality === 'Video'
            ? <Video className="w-3 h-3 text-slate-400" />
            : <MapPin className="w-3 h-3 text-slate-400" />}
          <span className="font-medium">{appt.type}</span>
        </div>
      </td>

      {/* Paciente */}
      <td className="px-6 py-4">
        <span className="font-bold text-slate-800">{appt.patientName}</span>
        {appt.phone && (
          <p className="text-xs text-slate-400 font-mono mt-0.5">{appt.phone}</p>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(appt.status)}`}>
          {appt.status}
        </span>
        {extraNote && <div className="mt-1">{extraNote}</div>}
      </td>

      {/* Fecha agendada */}
      <td className="px-6 py-4 text-slate-600 text-xs">
        {formatDate(appt.date)}
      </td>

      {/* Fecha reconsulta sugerida */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarClock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          {formatDate(suggestedDate)}
        </div>
      </td>

      {/* Recordatorio tag */}
      <td className="px-6 py-4">
        <button
          onClick={() => !isUpdating && onToggle()}
          disabled={isUpdating}
          title={reminderSent ? 'Marcar como no enviado' : 'Marcar como enviado'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
            ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}
            ${reminderSent
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
            }`}
        >
          {reminderSent
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Enviado</>
            : <><BellOff className="w-3.5 h-3.5" /> No enviado</>
          }
        </button>
        {reminderSent && appt.reminderSentAt && (
          <p className="text-[10px] text-slate-400 mt-1 pl-1">
            {formatDateShort(appt.reminderSentAt)}
          </p>
        )}
      </td>

      {/* ¿Ya reagendado? */}
      <td className="px-6 py-4">
        {alreadyRescheduled ? (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ya reagendado
            </span>
            <p className="text-[10px] text-slate-400 pl-1">{formatDate(futureDate!)}</p>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Sin cita próxima</span>
        )}
      </td>
    </tr>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────────
export const CalendarFollowUpTable: React.FC<CalendarFollowUpTableProps> = ({
  appointments,
  todayStr,
  onRefresh,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('reconsulta');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localReminders, setLocalReminders] = useState<Record<string, boolean>>({});

  const from = addDays(todayStr, -60);
  const to   = addDays(todayStr, -20);
  const futureLimit = addDays(todayStr, 60);

  // Future non-cancelled appointments per patient (next 60 days)
  const futureApptByPatient = useMemo(() => {
    const map: Record<string, string> = {};
    for (const appt of appointments) {
      if (appt.status === 'Cancelada') continue;
      if (appt.date > todayStr && appt.date <= futureLimit) {
        const key = normalizeName(appt.patientName);
        if (!map[key] || appt.date < map[key]) map[key] = appt.date;
      }
    }
    return map;
  }, [appointments, todayStr, futureLimit]);

  // Recent appointments (last 30 days) by patient — for the "reagendó y también canceló" check
  const recentByPatient = useMemo(() => {
    const last30 = addDays(todayStr, -30);
    const map: Record<string, Appointment[]> = {};
    for (const appt of appointments) {
      if (appt.date >= last30 && appt.date <= todayStr) {
        const key = normalizeName(appt.patientName);
        if (!map[key]) map[key] = [];
        map[key].push(appt);
      }
    }
    return map;
  }, [appointments, todayStr]);

  // ── Tab 1: Reconsulta del mes ────────────────────────────────────────────────
  // Appointments 20–60 days ago, non-cancelled.
  // Also cancelled ones IF they rescheduled recently and that was also cancelled.
  const reconsultaCandidates = useMemo(() => {
    const byPatient: Record<string, Appointment> = {};
    for (const appt of appointments) {
      if (appt.date < from || appt.date > to) continue;
      const key = normalizeName(appt.patientName);
      if (appt.status !== 'Cancelada') {
        if (!byPatient[key] || appt.date > byPatient[key].date) byPatient[key] = appt;
      } else {
        const recent = recentByPatient[key] ?? [];
        const recentAllCancelled = recent.length > 0 && recent.every(a => a.status === 'Cancelada');
        if (recentAllCancelled) {
          if (!byPatient[key] || appt.date > byPatient[key].date) byPatient[key] = appt;
        }
      }
    }
    return Object.values(byPatient).sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, from, to, recentByPatient]);

  // ── Tab 2: Última cita cancelada ─────────────────────────────────────────────
  // Appointments in the last 30 days. Per patient, pick their most recent one in that window.
  // If it's Cancelada → they need a follow-up call.
  const canceladasCandidates = useMemo(() => {
    const last30 = addDays(todayStr, -30);
    const next15 = addDays(todayStr, 15);
    const latestByPatient: Record<string, Appointment> = {};
    for (const appt of appointments) {
      if (appt.date < last30 || appt.date > next15) continue;
      const key = normalizeName(appt.patientName);
      if (!latestByPatient[key] || appt.date > latestByPatient[key].date) {
        latestByPatient[key] = appt;
      }
    }
    return Object.values(latestByPatient)
      .filter(appt => appt.status === 'Cancelada')
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, todayStr]);

  const handleToggleReminder = async (appt: Appointment) => {
    const currentSent = localReminders[appt.id] ?? appt.reminderSent ?? false;
    const newSent = !currentSent;
    setLocalReminders(prev => ({ ...prev, [appt.id]: newSent }));
    setUpdatingId(appt.id);
    try {
      await supabaseService.updateAppointmentReminder(appt.id, newSent);
      onRefresh();
    } catch {
      setLocalReminders(prev => ({ ...prev, [appt.id]: currentSent }));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalCandidates = reconsultaCandidates.length + canceladasCandidates.length;
  if (totalCandidates === 0) return null;

  const activeList = activeTab === 'reconsulta' ? reconsultaCandidates : canceladasCandidates;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Pacientes para Seguimiento</h3>
            <p className="text-xs text-slate-400">
              Identifica a quién contactar para recordatorio de reconsulta
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors self-end sm:self-auto"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-6 pt-3 gap-1">
            <button
              onClick={() => setActiveTab('reconsulta')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors
                ${activeTab === 'reconsulta'
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <CalendarClock className="w-4 h-4" />
              Reconsulta del mes
              {reconsultaCandidates.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === 'reconsulta' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {reconsultaCandidates.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('canceladas')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors
                ${activeTab === 'canceladas'
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <XCircle className="w-4 h-4" />
              Última cita cancelada
              {canceladasCandidates.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === 'canceladas' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {canceladasCandidates.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab description */}
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100">
            {activeTab === 'reconsulta' ? (
              <p className="text-xs text-slate-500">
                Pacientes con cita hace <strong>20–60 días</strong> que no fue cancelada · Ideal para recordarles que este mes les toca
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Pacientes con cita cancelada en los <strong>últimos 30 días o próximos 15</strong> · Incluye cancelaciones de citas futuras próximas
              </p>
            )}
          </div>

          {/* Table */}
          {activeList.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">
              No hay pacientes en esta categoría.
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 bg-slate-50">Tipo</th>
                    <th className="px-6 py-4 bg-slate-50">Paciente</th>
                    <th className="px-6 py-4 bg-slate-50">Status cita</th>
                    <th className="px-6 py-4 bg-slate-50 min-w-[130px]">Fecha agendada</th>
                    <th className="px-6 py-4 bg-slate-50 min-w-[140px]">Fecha reconsulta</th>
                    <th className="px-6 py-4 bg-slate-50 min-w-[160px]">Recordatorio</th>
                    <th className="px-6 py-4 bg-slate-50 min-w-[160px]">¿Ya reagendado?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeList.map(appt => {
                    const normalizedName = normalizeName(appt.patientName);
                    const reminderSent = localReminders[appt.id] ?? appt.reminderSent ?? false;
                    const isUpdating = updatingId === appt.id;
                    const futureDate = futureApptByPatient[normalizedName];

                    // Extra note for tab 1: cancelled original + reschedule also cancelled
                    let extraNote: React.ReactNode = undefined;
                    if (activeTab === 'reconsulta' && appt.status === 'Cancelada') {
                      const recentCancelled = (recentByPatient[normalizedName] ?? [])
                        .filter(a => a.status === 'Cancelada')
                        .sort((a, b) => b.date.localeCompare(a.date));
                      if (recentCancelled.length > 0) {
                        extraNote = (
                          <p className="text-[10px] text-red-500 leading-tight">
                            Reagendó el {formatDate(recentCancelled[0].date)}<br />y también canceló
                          </p>
                        );
                      }
                    }

                    return (
                      <FollowUpRow
                        key={appt.id}
                        appt={appt}
                        futureDate={futureDate}
                        reminderSent={reminderSent}
                        isUpdating={isUpdating}
                        onToggle={() => handleToggleReminder(appt)}
                        extraNote={extraNote}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
