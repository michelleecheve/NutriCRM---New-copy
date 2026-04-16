import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { FileText, Download, CalendarDays, History, Video, MapPin, Edit2, Trash2, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getStatusStyles } from './CalendarAppointmentModal';
import { store } from '../../services/store';
import { DateFilter, DatePreset, getPresetRange, PRESET_LABELS } from './DateFilter';

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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState<Appointment | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset>('1m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [activePreset, customFrom, customTo]);

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

  const isFiltered = activePreset !== 'all' && activePreset !== '1m';

  const historyAppointments = [...appointments]
    .filter(appt => {
      const range = activePreset === 'custom'
        ? (customFrom && customTo ? { from: customFrom, to: customTo } : null)
        : getPresetRange(activePreset);
      if (!range) return true;
      return appt.date >= range.from && appt.date <= range.to;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.date + 'T00:00:00');
      const dateB = new Date(b.updatedAt || b.createdAt || b.date + 'T00:00:00');
      return dateB.getTime() - dateA.getTime();
    });

  const totalPages = Math.max(1, Math.ceil(historyAppointments.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAppointments = historyAppointments.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleExportCSV = (scope: 'filtered' | 'all') => {
    const headers = ['Ultima Modificacion', 'Estado', 'Paciente', 'Fecha Cita', 'Hora', 'Tipo', 'Modalidad'];

    // 'filtered' uses the already-filtered list; 'all' uses every appointment unsorted
    const dataToExport = scope === 'filtered'
      ? historyAppointments
      : [...appointments].sort((a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt || b.date + 'T00:00:00').getTime() -
          new Date(a.updatedAt || a.createdAt || a.date + 'T00:00:00').getTime()
        );

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
    link.setAttribute('download', `historial_citas_${scope}_${todayStr}.csv`);
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
      <div
        className={`p-6 ${!isCollapsed ? 'border-b border-slate-100' : ''} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer select-none`}
        onClick={(e) => { e.stopPropagation(); setIsCollapsed(v => !v); }}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 sm:flex-none">
            <h3 className="font-bold text-slate-900 text-lg">Registro Completo del calendario</h3>
            <p className="text-xs text-slate-400">Ordenado por última actividad realizada</p>
          </div>
          <ChevronDown className={`sm:hidden w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${!isCollapsed ? 'rotate-180' : ''}`} />
        </div>
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <>
              <DateFilter
                activePreset={activePreset}
                onPresetChange={(p) => { setActivePreset(p); if (p !== 'custom') setIsFilterOpen(false); }}
                customFrom={customFrom}
                customTo={customTo}
                onCustomFromChange={setCustomFrom}
                onCustomToChange={setCustomTo}
                isOpen={isFilterOpen}
                onToggle={() => { setIsFilterOpen(v => !v); setIsExportMenuOpen(false); }}
                onClose={() => setIsFilterOpen(false)}
                isFiltered={isFiltered}
              />
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExportMenuOpen(!isExportMenuOpen); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wide text-center">
                      Exportar CSV
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExportCSV('filtered'); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>
                        Exportar filtro
                        {activePreset !== 'all' && (
                          <span className="block text-[10px] text-emerald-600 font-bold leading-tight">{PRESET_LABELS[activePreset]}</span>
                        )}
                        {activePreset === 'all' && (
                          <span className="block text-[10px] text-slate-400 leading-tight">Sin filtro activo</span>
                        )}
                      </span>
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
            </>
          )}
          <ChevronDown className={`hidden sm:block w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${!isCollapsed ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {!isCollapsed && <div className="overflow-x-auto">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
            <tr>
              <th className="px-6 py-4 bg-slate-50">Estado Actual</th>
              <th className="px-6 py-4 bg-slate-50">Paciente</th>
              <th className="px-6 py-4 bg-slate-50 min-w-[140px]">Fecha Cita</th>
              <th className="px-6 py-4 bg-slate-50">Hora</th>
              <th className="px-6 py-4 bg-slate-50">Tipo</th>
              <th className="px-6 py-4 bg-slate-50">Modalidad</th>
              <th className="px-6 py-4 text-right bg-slate-50">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAppointments.map((appt, idx) => (
              <tr
                key={appt.id}
                className={`hover:bg-slate-50 transition-colors group ${idx === 0 && safePage === 1 ? 'bg-emerald-50/20' : ''} ${appt.status === 'Cancelada' ? 'opacity-60 bg-slate-50' : ''}`}
              >
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(appt.status)}`}>
                    {appt.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-800">{appt.patientName}</span>
                </td>
                <td className="px-6 py-4 text-slate-600 min-w-[140px]">
                  {new Date(appt.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{appt.time.slice(0, 5)}</td>
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
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No hay historial disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>}

      {!isCollapsed && historyAppointments.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-400 font-medium">
            {historyAppointments.length} registro{historyAppointments.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[90px] text-center">
              Página {safePage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
