
import React, { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { Plus, Calculator } from 'lucide-react';
import { MenuAddRead } from './MenuAddRead';

export const MenusTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  const menus = useMemo(() => {
    const rootMenus = patient.menus || [];
    const dietaryMenus = patient.dietary?.menus || [];
    const uniqueMenus = new Map<string, any>();
    [...rootMenus, ...dietaryMenus].forEach(m => {
      if (m && m.id) uniqueMenus.set(m.id, m);
    });
    return Array.from(uniqueMenus.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Menús del Paciente</h2>
          <button 
            onClick={handleStartNew}
            className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nuevo Menú
          </button>
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
              <div 
                key={menu.id}
                onClick={() => handleEditMenu(menu)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-100 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(menu.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{menu.name || 'Sin nombre'}</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {menu.vet?.kcalToWork} kcal · {menu.macros?.cho.pct}/{menu.macros?.chon.pct}/{menu.macros?.fat.pct}
                </p>
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <span>Ver detalles</span>
                  <Plus className="w-3 h-3 rotate-45" />
                </div>
              </div>
            ))}
          </div>
        )}
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
