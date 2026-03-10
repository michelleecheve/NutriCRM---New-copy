import React from 'react';
import { Calculator, Plus } from 'lucide-react';

export const MenuCard: React.FC<{
  menu: any;
  onClick: () => void;
}> = ({ menu, onClick }) => {
  const createdAt = menu?.createdAt ? new Date(menu.createdAt) : null;
  const createdAtLabel = createdAt && !isNaN(createdAt.getTime())
    ? createdAt.toLocaleDateString()
    : '';

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-emerald-100 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <Calculator className="w-5 h-5" />
        </div>
        {createdAtLabel && (
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {createdAtLabel}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">
        {menu?.name || 'Sin nombre'}
      </h3>

      <p className="text-sm text-slate-500 mb-4">
        {menu?.vet?.kcalToWork} kcal · {menu?.macros?.cho?.pct}/{menu?.macros?.chon?.pct}/{menu?.macros?.fat?.pct}
      </p>

      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
        <span>Ver detalles</span>
        <Plus className="w-3 h-3 rotate-45" />
      </div>
    </div>
  );
};