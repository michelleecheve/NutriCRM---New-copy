import React, { useState } from 'react';
import { Appointment } from '../../types';
import { FileText, Download, CalendarDays, History, Video, MapPin, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { getStatusStyles } from './CalendarAppointmentModal';
import { store } from '../../services/store';

interface CalendarHistorialTableProps {
  appointments: Appointment[];
  currentYear: number;
  currentMonth: number;
  todayStr: string;
  targetNutritionistId?: string;
  isManagingForOtherNutritionist?: boolean;
  onEditClick: (appt: Appointment) => void;
  onRefresh: () => void;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return 'Sin cambios';
  const date = new Date(isoString);
  return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const CalendarHistorialTable: React.FC<CalendarHistorialTableProps> = ({
  appointments,
  currentYear,
  currentMonth,
  todayStr,
  targetNutritionistId,
  isManagingForOtherNutritionist = false,
  onEditClick,
  onRefresh,
  }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState<Appointment | null>(null);

  const handleDelete = async () => {
    if (deletingAppt) {
      try {
        if (isManagingForOtherNutritionist && targetNutritionistId) {
          await store.deleteAppointmentForNutritionist(targetNutritionistId, deletingAppt.id);
        } else {
          await store.deleteAppointment(deletingAppt.id);
        }
        setDeletingAppt(null);
        onRefresh();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        // Optional: show error to user
      }
    }
  };

  const historyAppointments = [...appointments].sort((a: any, b: any) => {
    const dateA = new Date(a.updatedAt || a.createdAt || a.date + 'T00:00:00');
    const dateB = new Date(b.updatedAt || b.createdAt || b.date + 'T00:00:00');
    return dateB.getTime() - dateA.getTime();
  });

  const handleExportCSV = (type: 'month' | 'all') => {
    const headers = ['Ultima Modificacion', 'Estado', 'Paciente', 'Fecha Cita', 'Hora', 'Tipo', 'Modalidad'];

    let dataToExport = [...historyAppointments];

    if (type === 'month') {
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      dataToExport = dataToExport.filter(a => {
        const relevantDate = (a as any).updatedAt || a.date;
        return relevantDate.startsWith(currentMonthStr);
      });
    }

    const rows = dataToExport.map(appt => {
      const [y, m, d] = appt.date.split('-');
      return [
        (appt as any).updatedAt ? new Date((appt as any).updatedAt).toLocaleString('es-ES') : 'N/A',
        appt.status,
        appt.patientName,
        `${d}/${m}/${y}`,
        appt.time,
        appt.type,
        appt.modality,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_citas_${type}_${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible relative"
      onClick={() => setIsExportMenuOpen(false)}
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Registro Completo de Movimientos</h3>
            <p className="text-xs text-slate-400">Ordenado por última actividad realizada</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500">
            {historyAppointments.length} Registros
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExportMenuOpen(!isExportMenuOpen); }}
              className="bg-emerald-50 text-emerald-700 p-2 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Exportar Registros"
            >
              <Download className="w-5 h-5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-50 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wide text-center">
                  Exportar CSV
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExportCSV('month'); }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                >
                  <CalendarDays className="w-4 h-4" /> Exportar Mes Actual
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExportCSV('all'); }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                >
                  <History className="w-4 h-4" /> Exportar Todo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 bg-slate-50">Última Modificación</th>
              <th className="px-6 py-4 bg-slate-50">Estado Actual</th>
              <th className="px-6 py-4 bg-slate-50">Paciente</th>
              <th className="px-6 py-4 bg-slate-50">Fecha Cita</th>
              <th className="px-6 py-4 bg-slate-50">Hora</th>
              <th className="px-6 py-4 bg-slate-50">Tipo</th>
              <th className="px-6 py-4 bg-slate-50">Modalidad</th>
              <th className="px-6 py-4 text-right bg-slate-50">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historyAppointments.map((appt, idx) => (
              <tr
                key={appt.id}
                className={`hover:bg-slate-50 transition-colors group ${idx === 0 ? 'bg-emerald-50/20' : ''} ${appt.status === 'Cancelada' ? 'opacity-60 bg-slate-50' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      {(appt as any).updatedAt ? formatDateTime((appt as any).updatedAt) : 'Registro Inicial'}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Reciente</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(appt.status)}`}>
                    {appt.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-800">{appt.patientName}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(appt.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{appt.time}</td>
                <td className="px-6 py-4 text-slate-600 text-xs">{appt.type}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    {appt.modality === 'Video' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {appt.modality}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditClick(appt)}
                      className="text-slate-400 hover:text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAppt(appt)}
                      className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {historyAppointments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  No hay historial disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {deletingAppt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Registro?</h3>
              <p className="text-slate-500 text-sm mb-6">
                ¿Seguro que quiere eliminar este registro de cita de <span className="font-bold text-slate-700">{deletingAppt.patientName}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingAppt(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
