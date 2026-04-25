import React, { useEffect, useState, useMemo } from 'react';
import { History, Search, ExternalLink, Download, User, Calendar, Flame, FileText, Eye, ClipboardList } from 'lucide-react';
import { store } from '../../services/store';
import { GeneratedMenu, Patient } from '../../types';
import { MenuPreview } from './MenuPreview';
import { MenuExportPDF } from './MenuExportPDF';

interface HistoryEntry {
  patient: Patient;
  menu: GeneratedMenu;
}

interface MenuHistoryProps {
  onSelectPatient?: (id: string, tab?: string) => void;
  hideHeader?: boolean;
  hideContainer?: boolean;
  onAddAsReference?: (menu: GeneratedMenu, patient: Patient) => Promise<void>;
  onAddAsRecommendation?: (menu: GeneratedMenu, patient: Patient, name: string) => Promise<void>;
}

export const MenuHistory: React.FC<MenuHistoryProps> = ({ onSelectPatient, hideHeader, hideContainer, onAddAsReference, onAddAsRecommendation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [refStatus, setRefStatus] = useState<Record<string, 'loading' | 'success' | 'error' | 'nodata'>>({});
  const [recStatus, setRecStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({});
  const [recModal, setRecModal] = useState<{ menu: GeneratedMenu; patient: Patient } | null>(null);
  const [recModalName, setRecModalName] = useState('');
  const [recModalLoading, setRecModalLoading] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const checkInit = setInterval(() => {
      if (store.isInitialized) {
        setPatients(store.getPatients());
        clearInterval(checkInit);
      }
    }, 100);
    return () => clearInterval(checkInit);
  }, []);

  const historyEntries = useMemo(() => {
    const entries: HistoryEntry[] = [];
    
    patients.forEach(patient => {
      const rootMenus = patient.menus || [];
      
      rootMenus.forEach(menu => {
        entries.push({ patient, menu });
      });
    });

    // Sort by date descending
    return entries.sort((a, b) => 
      new Date(b.menu.date).getTime() - new Date(a.menu.date).getTime()
    );
  }, [patients]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return historyEntries;
    const term = searchTerm.toLowerCase();
    return historyEntries.filter(entry => {
      const kcal = String(entry.menu.menuPreviewData?.kcal ?? entry.menu.kcalToWork ?? '');
      const date = new Date(entry.menu.date).toLocaleDateString();
      return (
        entry.patient.firstName.toLowerCase().includes(term) ||
        entry.patient.lastName.toLowerCase().includes(term) ||
        (entry.menu.name && entry.menu.name.toLowerCase().includes(term)) ||
        kcal.includes(term) ||
        date.includes(term)
      );
    });
  }, [historyEntries, searchTerm]);

  const handleOpenMenu = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
  };

  const clearRefStatus = (menuId: string) =>
    setTimeout(() => setRefStatus(prev => { const n = { ...prev }; delete n[menuId]; return n; }), 2200);

  const clearRecStatus = (menuId: string) =>
    setTimeout(() => setRecStatus(prev => { const n = { ...prev }; delete n[menuId]; return n; }), 2200);

  const handleAddRef = async (entry: HistoryEntry) => {
    if (!onAddAsReference) return;
    if (!entry.menu.menuData) {
      setRefStatus(prev => ({ ...prev, [entry.menu.id]: 'nodata' }));
      clearRefStatus(entry.menu.id);
      return;
    }
    setRefStatus(prev => ({ ...prev, [entry.menu.id]: 'loading' }));
    try {
      await onAddAsReference(entry.menu, entry.patient);
      setRefStatus(prev => ({ ...prev, [entry.menu.id]: 'success' }));
      clearRefStatus(entry.menu.id);
    } catch {
      setRefStatus(prev => ({ ...prev, [entry.menu.id]: 'error' }));
      clearRefStatus(entry.menu.id);
    }
  };

  const handleOpenRecModal = (entry: HistoryEntry) => {
    setRecModal({ menu: entry.menu, patient: entry.patient });
    setRecModalName('');
  };

  const handleConfirmRec = async () => {
    if (!recModal || !recModalName.trim() || !onAddAsRecommendation) return;
    setRecModalLoading(true);
    const menuId = recModal.menu.id;
    try {
      await onAddAsRecommendation(recModal.menu, recModal.patient, recModalName.trim());
      setRecStatus(prev => ({ ...prev, [menuId]: 'success' }));
      setRecModal(null);
      clearRecStatus(menuId);
    } catch {
      setRecStatus(prev => ({ ...prev, [menuId]: 'error' }));
      setRecModal(null);
      clearRecStatus(menuId);
    } finally {
      setRecModalLoading(false);
    }
  };

  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>
      {!hideHeader ? (
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Historial de Menús</h3>
              <p className="text-sm text-slate-500 mt-0.5">Visualiza y exporta menús creados anteriormente para tus pacientes</p>
            </div>
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente, fecha o Kcal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full"
            />
          </div>
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente, fecha o Kcal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Paciente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Fecha</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Kcal</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <tr key={entry.menu.id} onClick={() => handleOpenMenu(entry)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-slate-900">{entry.patient.firstName} {entry.patient.lastName}</div>
                      <div className="text-xs text-slate-500">{entry.menu.name || 'Menú Personalizado'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{new Date(entry.menu.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium">
                        {entry.menu.menuPreviewData?.kcal ?? entry.menu.kcalToWork ?? 'N/A'} kcal
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* Always visible: import as reference */}
                      {onAddAsReference && (
                        refStatus[entry.menu.id] === 'loading' ? (
                          <span className="text-xs text-slate-400 px-2">Guardando...</span>
                        ) : refStatus[entry.menu.id] === 'success' ? (
                          <span className="text-xs text-emerald-600 font-bold px-2">✓ Guardada</span>
                        ) : refStatus[entry.menu.id] === 'error' ? (
                          <span className="text-xs text-red-500 px-2">✗ Error</span>
                        ) : refStatus[entry.menu.id] === 'nodata' ? (
                          <span className="text-xs text-amber-600 px-2">Sin datos estructurados</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddRef(entry); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            title={!entry.menu.menuData ? 'Este menú no tiene datos estructurados' : 'Usar como referencia (Hoja 1)'}
                          >
                            <FileText className="w-3.5 h-3.5" /> Usar como referencia
                          </button>
                        )
                      )}
                      {/* Always visible: import as recommendation */}
                      {onAddAsRecommendation && (
                        recStatus[entry.menu.id] === 'loading' ? (
                          <span className="text-xs text-slate-400 px-2">Guardando...</span>
                        ) : recStatus[entry.menu.id] === 'success' ? (
                          <span className="text-xs text-emerald-600 font-bold px-2">✓ Guardada</span>
                        ) : recStatus[entry.menu.id] === 'error' ? (
                          <span className="text-xs text-red-500 px-2">✗ Error</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenRecModal(entry); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            title={!entry.menu.menuData ? 'Este menú no tiene datos estructurados' : 'Usar como recomendación (Hoja 2)'}
                          >
                            <ClipboardList className="w-3.5 h-3.5" /> Usar como recomendación
                          </button>
                        )
                      )}
                      {/* Always visible: preview + navigate */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenMenu(entry); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Previsualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectPatient?.(entry.patient.id, 'menus'); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver Detalles"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileText className="w-8 h-8 opacity-20" />
                    <p className="text-sm">No se encontraron registros en el historial</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mini-modal: nombre para guardar como recomendación */}
      {recModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">Guardar como Recomendación</h3>
              </div>
              <button
                onClick={() => setRecModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Menú de <span className="font-semibold text-slate-700">{recModal.patient.firstName} {recModal.patient.lastName}</span>
              {recModal.menu.name ? ` · ${recModal.menu.name}` : ''}
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la plantilla</label>
              <input
                type="text"
                value={recModalName}
                onChange={e => setRecModalName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmRec()}
                placeholder="Ej: Recomendaciones Generales - Mantenimiento"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setRecModal(null)}
                className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRec}
                disabled={!recModalName.trim() || recModalLoading}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recModalLoading ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver el menú */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Vista Previa del Menú</h3>
                  <p className="text-sm text-slate-500">Paciente: {selectedEntry.patient.firstName} {selectedEntry.patient.lastName} · {new Date(selectedEntry.menu.date).toLocaleDateString()}</p>
                  {/* PDF button — visible only on mobile, below patient name */}
                  <div className="mt-2 sm:hidden">
                    <MenuExportPDF
                      elementId={`menu-history-${selectedEntry.menu.id}`}
                      filename={`Menu_${selectedEntry.patient.firstName}_${selectedEntry.patient.lastName}_${selectedEntry.menu.date}`}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-sm shadow-emerald-600/20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* PDF button — visible only on desktop */}
                  <div className="hidden sm:block">
                    <MenuExportPDF
                      elementId={`menu-history-${selectedEntry.menu.id}`}
                      filename={`Menu_${selectedEntry.patient.firstName}_${selectedEntry.patient.lastName}_${selectedEntry.menu.date}`}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
                    />
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
              <div className="max-w-[800px] mx-auto">
                {selectedEntry.menu.menuData ? (
                  <MenuPreview
                    data={selectedEntry.menu.menuData}
                    elementId={`menu-history-${selectedEntry.menu.id}`}
                    selectedTemplate={selectedEntry.menu.designConfig?.templateDesign || selectedEntry.menu.templateId || 'plantilla_v1'}
                    hideTemplateSelector={true}
                    visualTheme={selectedEntry.menu.designConfig?.visualTheme}
                    pageLayout={selectedEntry.menu.designConfig?.pageLayout}
                  />
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <p className="text-slate-500 italic">Este menú no tiene datos de vista previa estructurados.</p>
                    <div className="mt-4 text-left whitespace-pre-wrap font-mono text-xs bg-slate-50 p-4 rounded-lg border border-slate-100">
                      {selectedEntry.menu.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
