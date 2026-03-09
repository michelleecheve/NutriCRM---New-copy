import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff, Plus, X, Check } from 'lucide-react';
import { MenuReferencesStorage, MenuReferenceRecord } from '../menus_components/Menu_References_Components/MenuReferencesStorage';

interface MenuAddReadSec2Props {
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selectedReferenceIds: string[];
  setSelectedReferenceIds: (ids: string[]) => void;
}

export const MenuAddReadSec2: React.FC<MenuAddReadSec2Props> = ({
  selectedTemplateId,
  setSelectedTemplateId,
  selectedReferenceIds,
  setSelectedReferenceIds
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  const allReferences = MenuReferencesStorage.list();
  
  const selectedReferences = allReferences.filter(r => selectedReferenceIds.includes(r.id));

  const handleOpenSelector = () => {
    setTempSelectedIds(selectedReferenceIds);
    setShowSelector(true);
  };

  const handleToggleTempId = (id: string) => {
    setTempSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmSelection = () => {
    setSelectedReferenceIds(tempSelectedIds);
    setShowSelector(false);
  };

  const handleRemoveReference = (id: string) => {
    setSelectedReferenceIds(selectedReferenceIds.filter(i => i !== id));
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Plantilla + Referencias</h2>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
          >
            {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
          {/* A) Plantilla */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Elegir plantilla de menú</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none"
            >
              <option value="base_v1">Plantilla Base V1</option>
            </select>
          </div>

          {/* B) Referencias Seleccionadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Referencias seleccionadas</label>
              <button 
                onClick={handleOpenSelector}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar referencias
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {selectedReferences.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aún no has seleccionado referencias</p>
              ) : (
                selectedReferences.map(ref => (
                  <div 
                    key={ref.id}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm animate-in zoom-in duration-200"
                  >
                    <span className="text-xs font-bold text-slate-700">{ref.data.kcal} kcal</span>
                    <button 
                      onClick={() => handleRemoveReference(ref.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* C) Panel Selector Inline */}
          {showSelector && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Seleccionar Referencias</h3>
                <button 
                  onClick={() => setShowSelector(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allReferences.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                    No hay referencias guardadas en el sistema.
                  </div>
                ) : (
                  allReferences.map(ref => {
                    const isSelected = tempSelectedIds.includes(ref.id);
                    return (
                      <button
                        key={ref.id}
                        onClick={() => handleToggleTempId(ref.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                            : 'bg-white border-slate-200 hover:border-indigo-200'
                        }`}
                      >
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {ref.data.kcal} kcal
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">{ref.data.type}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'border-slate-200 group-hover:border-indigo-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button 
                  onClick={() => setShowSelector(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmSelection}
                  className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                >
                  Agregar seleccionadas
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};