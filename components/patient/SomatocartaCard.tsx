import React from 'react';
import { Calendar, Eye, Edit2, Trash2, Link2 } from 'lucide-react';
import type { SomatotypeRecord } from '../../types';
import { SomatocartaLogic } from './SomatocartaLogic';

const formatSomatoDate = (yyyyMmDd: string) => {
  const d = new Date(`${yyyyMmDd}T12:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const SomatocartaCard: React.FC<{
  record: SomatotypeRecord;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onLink?: () => void;
  showDelete?: boolean;
}> = ({ record, onView, onEdit, onDelete, onLink, showDelete = true }) => {
  return (
    <div className="border rounded-xl p-4 hover:shadow-md transition-all bg-white relative group border-slate-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-bold text-slate-700 text-sm truncate">{formatSomatoDate(record.date)}</span>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onLink}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            title="Vincular A Evaluación"
          >
            <Link2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            title="Ver Gráfico"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {showDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        <div className="flex-1 bg-slate-50 rounded p-2 text-center">
          <div className="text-xs text-slate-400 uppercase font-bold">Coord X</div>
          <div className="font-bold text-slate-800">{record.x}</div>
        </div>
        <div className="flex-1 bg-slate-50 rounded p-2 text-center">
          <div className="text-xs text-slate-400 uppercase font-bold">Coord Y</div>
          <div className="font-bold text-slate-800">{record.y}</div>
        </div>
      </div>

      <div className="h-32 w-full opacity-50 group-hover:opacity-100 transition-opacity">
        <SomatocartaLogic x={record.x} y={record.y} />
      </div>
    </div>
  );
};