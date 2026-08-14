import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff, Plus, X, Check, Settings } from 'lucide-react';
import { MenuReferenceRecord } from '../menus_components/Menu_References_Components/MenuReferencesStorage';
import { store } from '../../services/store';
import { authStore } from '../../services/authStore';
import { supabaseService } from '../../services/supabaseService';
import { MenuReferenceCardConfig } from '../../types';
import { SaveButton } from '../SaveButton';

const DEFAULT_CARD_CONFIG: Required<MenuReferenceCardConfig> = {
  kcal: true,
  menuName: true,
  patientName: true,
  menuType: true,
};

interface MenuAddReadSec2Props {
  selectedReferenceIds: string[];
  setSelectedReferenceIds: (ids: string[]) => void;
  selectedRecommendationIds: string[];
  setSelectedRecommendationIds: (ids: string[]) => void;
  isVisible: boolean;
  onToggleVisible: () => void;
  onDirty?: () => void;
}

export const MenuAddReadSec2: React.FC<MenuAddReadSec2Props> = ({
  selectedReferenceIds,
  setSelectedReferenceIds,
  selectedRecommendationIds,
  setSelectedRecommendationIds,
  isVisible,
  onToggleVisible,
  onDirty
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorType, setSelectorType] = useState<'references' | 'recommendations'>('references');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  // Qué info se muestra en cada tarjeta del selector de referencias — se guarda
  // en la config del perfil (profiles.menu_reference_card_config).
  const [cardConfig, setCardConfig] = useState<Required<MenuReferenceCardConfig>>({
    ...DEFAULT_CARD_CONFIG,
    ...(authStore.getCurrentUser()?.profile?.menuReferenceCardConfig || {}),
  });
  const [showCardConfig, setShowCardConfig] = useState(false);
  const [draftCardConfig, setDraftCardConfig] = useState<Required<MenuReferenceCardConfig>>(cardConfig);

  const handleOpenCardConfig = () => {
    setDraftCardConfig(cardConfig);
    setShowCardConfig(true);
  };

  const handleToggleDraftCardConfig = (key: keyof MenuReferenceCardConfig) => {
    setDraftCardConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveCardConfig = async () => {
    const userId = authStore.getCurrentUser()?.id;
    if (!userId) return;
    await supabaseService.updateProfile(userId, { menuReferenceCardConfig: draftCardConfig });
    authStore.patchCurrentUserMenuReferenceCardConfig(draftCardConfig);
    setCardConfig(draftCardConfig);
    setShowCardConfig(false);
  };

  const allReferences = store.menuReferences;
  const allRecommendations = store.menuRecommendations;
  
  const selectedReferences = allReferences.filter(r => selectedReferenceIds.includes(r.id));
  const selectedRecommendations = allRecommendations.filter(r => selectedRecommendationIds.includes(r.id));

  const handleOpenSelector = (type: 'references' | 'recommendations') => {
    setSelectorType(type);
    if (type === 'references') {
      const allRefIds = allReferences.map(r => r.id);
      const validCurrentIds = selectedReferenceIds.filter(id => allRefIds.includes(id));
      setTempSelectedIds(validCurrentIds);
    } else {
      const allRecIds = allRecommendations.map(r => r.id);
      const validCurrentIds = selectedRecommendationIds.filter(id => allRecIds.includes(id));
      setTempSelectedIds(validCurrentIds);
    }
    setShowSelector(true);
  };

  const handleToggleTempId = (id: string) => {
    setTempSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleConfirmSelection = () => {
    if (selectorType === 'references') {
      setSelectedReferenceIds(tempSelectedIds);
    } else {
      setSelectedRecommendationIds(tempSelectedIds);
    }
    setShowSelector(false);
    onDirty?.();
  };

  const handleRemoveReference = (id: string) => {
    setSelectedReferenceIds(selectedReferenceIds.filter(i => i !== id));
    onDirty?.();
  };

  const handleRemoveRecommendation = (id: string) => {
    setSelectedRecommendationIds(selectedRecommendationIds.filter(i => i !== id));
    onDirty?.();
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        data-tour="menu-sec2-header"
        onClick={onToggleVisible}
        className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Plantilla + Referencias</h2>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isVisible && (
        <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
          {/* B) Referencias Seleccionadas */}
          <div data-tour="menu-sec2-referencias" className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Referencias seleccionadas</label>
              <button 
                onClick={() => handleOpenSelector('references')}
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

          {/* C) Recomendaciones Seleccionadas */}
          <div data-tour="menu-sec2-recomendaciones" className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Recomendaciones seleccionadas</label>
              <button 
                onClick={() => handleOpenSelector('recommendations')}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar recomendaciones
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {selectedRecommendations.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aún no has seleccionado recomendaciones</p>
              ) : (
                selectedRecommendations.map(rec => (
                  <div 
                    key={rec.id}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm animate-in zoom-in duration-200"
                  >
                    <span className="text-xs font-bold text-slate-700">{rec.name}</span>
                    <button 
                      onClick={() => handleRemoveRecommendation(rec.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* D) Panel Selector Inline */}
          {showSelector && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {selectorType === 'references' ? 'Elige hasta 3 referencias' : 'Elige hasta 3 recomendaciones'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{tempSelectedIds.length}/3 seleccionadas</p>
                  </div>
                  {selectorType === 'references' && (
                    <button
                      onClick={handleOpenCardConfig}
                      title="Elegir qué información mostrar en las tarjetas"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowSelector(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {selectorType === 'references' ? (
                  allReferences.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                      No hay referencias guardadas en el sistema.
                    </div>
                  ) : (
                    allReferences.map(ref => {
                      const isSelected = tempSelectedIds.includes(ref.id);
                      const isDisabled = !isSelected && tempSelectedIds.length >= 3;
                      return (
                        <button
                          key={ref.id}
                          onClick={() => handleToggleTempId(ref.id)}
                          disabled={isDisabled}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                              : isDisabled
                                ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                                : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div>
                            {cardConfig.kcal && (
                              <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {ref.data.kcal} kcal
                              </div>
                            )}
                            {cardConfig.patientName && ref.data.patientName && (
                              <div className={`text-[11px] font-semibold truncate max-w-[110px] ${isSelected ? 'text-indigo-500' : 'text-slate-500'}`}>
                                {ref.data.patientName}
                              </div>
                            )}
                            {cardConfig.menuType && (
                              <div className="text-[10px] text-slate-400 uppercase font-medium">{ref.data.type}</div>
                            )}
                            {cardConfig.menuName && ref.data.name && (
                              <div className={`text-[11px] font-semibold leading-snug break-words ${isSelected ? 'text-indigo-600' : 'text-slate-600'}`}>
                                {ref.data.name}
                              </div>
                            )}
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
                  )
                ) : (
                  allRecommendations.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                      No hay recomendaciones guardadas en el sistema.
                    </div>
                  ) : (
                    allRecommendations.map(rec => {
                      const isSelected = tempSelectedIds.includes(rec.id);
                      const isDisabled = !isSelected && tempSelectedIds.length >= 3;
                      return (
                        <button
                          key={rec.id}
                          onClick={() => handleToggleTempId(rec.id)}
                          disabled={isDisabled}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                              : isDisabled
                                ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                                : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {rec.name}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-medium">Plantilla</div>
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
                  )
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
                  {selectorType === 'references' ? 'Agregar seleccionadas' : 'Agregar recomendaciones'}
                </button>
              </div>
            </div>
          )}

          {/* E) Modal: qué mostrar en las tarjetas de referencias */}
          {showCardConfig && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    Mostrar en las tarjetas
                  </h3>
                  <button onClick={() => setShowCardConfig(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 space-y-2">
                  {([
                    { key: 'kcal', label: 'KCAL' },
                    { key: 'menuName', label: 'Nombre del menú' },
                    { key: 'patientName', label: 'Nombre del paciente' },
                    { key: 'menuType', label: 'Tipo de menú (semanal / intercambio)' },
                  ] as { key: keyof MenuReferenceCardConfig; label: string }[]).map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={draftCardConfig[key]}
                        onChange={() => handleToggleDraftCardConfig(key)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
                  <SaveButton onSave={handleSaveCardConfig} label="Guardar" size="sm" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};