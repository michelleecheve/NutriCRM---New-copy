import React, { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { Plus, Calculator } from 'lucide-react';
import { store } from '../../services/store';
import { MenuAddRead } from './MenuAddRead';
import { MenuCard } from './MenuCard';
import { PatientDigitalMenu } from './PatientDigitalMenu';

export const MenusTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void; onNavigateToEvaluations: () => void }> = ({ patient, onUpdate, onNavigateToEvaluations }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const patientEvaluations = useMemo(() => store.getEvaluations(patient.id), [patient.id]);

  const menus = useMemo(() => {
    const rootMenus = patient.menus || [];
    return [...rootMenus].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [patient]);

  const handleStartNew = () => {
    setEditingMenuId(null);
    setIsStarted(true);
  };

  const handleEditMenu = (menu: any) => {
    setEditingMenuId(menu.id);
    setIsStarted(true);
  };

  if (!isStarted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">Menús del Paciente</h2>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <button
              onClick={handleStartNew}
              disabled={patientEvaluations.length === 0}
              className={`font-bold px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                patientEvaluations.length === 0
                  ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                  : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
              }`}
            >
              <Plus className="w-5 h-5" /> Nuevo Menú
            </button>
            {patientEvaluations.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Para crear un menú primero debes crear una fecha de evaluación.</span>
                <button
                  type="button"
                  onClick={onNavigateToEvaluations}
                  className="flex-shrink-0 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                  Crear evaluación
                </button>
              </div>
            )}
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="bg-emerald-50 p-12 rounded-3xl border border-emerald-100 text-center">
            <Calculator className="w-16 h-16 text-emerald-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">No hay menús creados</h3>
            <p className="text-slate-500 text-sm">
              Comienza creando el primer plan nutricional para este paciente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onClick={() => handleEditMenu(menu)}
              />
            ))}
          </div>
        )}

        {/* Portal digital */}
        <PatientDigitalMenu patient={patient} onUpdate={onUpdate} />
      </div>
    );
  }

  return (
    <MenuAddRead
      patient={patient}
      onUpdate={onUpdate}
      editingMenuId={editingMenuId}
      onClose={() => {
        setIsStarted(false);
        setEditingMenuId(null);
      }}
    />
  );
};