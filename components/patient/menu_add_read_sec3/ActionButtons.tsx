import React, { useRef, useState, useEffect } from 'react';
import { Eraser, ChevronDown, AlertTriangle } from 'lucide-react';
import { Patient, VetCalculation } from '../../../types';
import { MenuPlanData } from '../../menus_components/MenuDesignTemplates';
import { buildBlankMenuPlanData, getNutritionistData } from './helpers';

interface ActionButtonsProps {
  patient: Patient;
  vetData: VetCalculation;
  evaluationId: string | null;
  menuPreviewData: MenuPlanData | null;
  onMenuDataChange: (data: MenuPlanData | null) => void;
  onRemountTable: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  patient,
  vetData,
  evaluationId,
  menuPreviewData,
  onMenuDataChange,
  onRemountTable,
}) => {
  const deleteDropdownRef = useRef<HTMLDivElement>(null);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | 'all' | null>(null);

  useEffect(() => {
    if (!showDeleteDropdown) return;
    const handler = (e: MouseEvent) => {
      if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(e.target as Node)) {
        setShowDeleteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDeleteDropdown]);

  const getDeleteablePageCount = () => {
    if (!menuPreviewData) return 0;
    let count = 2;
    if (menuPreviewData.eatingOutPage) count++;
    return count;
  };

  const confirmLabel = pendingDelete === 'all'
    ? 'todas las páginas'
    : `la página ${pendingDelete}`;

  const executeDelete = () => {
    if (!menuPreviewData) return;
    if (pendingDelete === 'all') {
      onMenuDataChange(null);
    } else if (pendingDelete === 1) {
      const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
      onMenuDataChange({ ...menuPreviewData, weeklyMenu: blank.weeklyMenu, portions: blank.portions });
      onRemountTable();
    } else if (pendingDelete === 2) {
      onMenuDataChange({ ...menuPreviewData, recommendations: { preparacion: [], restricciones: [], habitos: [], organizacion: [] } });
      onRemountTable();
    } else if (pendingDelete === 3) {
      const { eatingOutPage: _removed, ...rest } = menuPreviewData as any;
      onMenuDataChange(rest);
      onRemountTable();
    }
    setPendingDelete(null);
  };

  return (
    <>
      <div className="relative" ref={deleteDropdownRef}>
        <button
          onClick={() => setShowDeleteDropdown(prev => !prev)}
          disabled={!menuPreviewData}
          title="Borrar páginas del menú"
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${
            !menuPreviewData
              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
              : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <Eraser className="w-4 h-4" />
          Borrar página
          <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${showDeleteDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDeleteDropdown && menuPreviewData && (
          <div className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 min-w-[210px]">
            <button
              onClick={() => { setShowDeleteDropdown(false); setPendingDelete('all'); }}
              className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              Borrar todas las páginas
            </button>
            <div className="border-t border-slate-100 my-1" />
            {Array.from({ length: getDeleteablePageCount() }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => { setShowDeleteDropdown(false); setPendingDelete(page); }}
                className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Borrar página {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {pendingDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-2xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">¿Estás segura?</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Se borrará {confirmLabel} del menú. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-2.5 rounded-2xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-2xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
