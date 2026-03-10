import React from 'react';
import { DietaryEvaluation } from '../../types';
import { Clock, FileText, X } from 'lucide-react';

export const DietaryCard: React.FC<{
  evalItem: DietaryEvaluation;
  onClick: () => void;
}> = ({ evalItem, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-emerald-100 text-emerald-700 text-center px-2 py-1 rounded-lg">
            <div className="text-[10px] font-bold uppercase">
              {new Date(evalItem.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
            </div>
            <div className="text-lg font-bold leading-none">{evalItem.date.split('-')[2]}</div>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Evaluación Dietética</h4>
            <span className="text-xs text-slate-400">{evalItem.date.split('-')[0]}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" /> Tiempos de Comida:
          </div>
          <span className="font-bold text-emerald-600">{evalItem.mealsPerDay} al día</span>
        </div>

        {evalItem.excludedFoods && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <div className="text-[10px] font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
              <X className="w-3 h-3" /> Alimentos que evita
            </div>
            <div className="text-sm text-slate-700 font-medium truncate">{evalItem.excludedFoods}</div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
            <FileText className="w-3 h-3" /> {evalItem.recall.length} registros de comidas
          </span>
        </div>
      </div>
    </div>
  );
};