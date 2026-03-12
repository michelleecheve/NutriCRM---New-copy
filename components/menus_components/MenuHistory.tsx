import React, { useEffect, useState, useMemo } from 'react';
import { History, Search, ExternalLink, Download, User, Calendar, Flame, FileText, Eye } from 'lucide-react';
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
}

export const MenuHistory: React.FC<MenuHistoryProps> = ({ onSelectPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setPatients(store.getPatients());
      } catch (error) {
        console.error('Error fetching patients for menu history:', error);
      }
    };
    fetchPatients();
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
    return historyEntries.filter(entry => 
      entry.patient.firstName.toLowerCase().includes(term) ||
      entry.patient.lastName.toLowerCase().includes(term) ||
      (entry.menu.name && entry.menu.name.toLowerCase().includes(term))
    );
  }, [historyEntries, searchTerm]);

  const handleOpenMenu = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Historial de Menús</h3>
            <p className="text-sm text-slate-500 mt-0.5">Visualiza y exporta menús creados anteriormente para tus pacientes</p>
          </div>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Paciente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Menu ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Fecha</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Kcal</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <tr key={entry.menu.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{entry.patient.firstName} {entry.patient.lastName}</div>
                        <div className="text-xs text-slate-500">{entry.menu.name || 'Menú Personalizado'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">#{entry.menu.id.slice(0, 8)}</span>
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
                        {entry.menu.menuPreviewData?.kcal || entry.menu.vet?.kcalToWork || 'N/A'} kcal
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenMenu(entry)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Previsualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectPatient?.(entry.patient.id, 'menus')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver Detalles"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
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

      {/* Modal para ver el menú */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Vista Previa del Menú</h3>
                <p className="text-sm text-slate-500">Paciente: {selectedEntry.patient.firstName} {selectedEntry.patient.lastName} · {new Date(selectedEntry.menu.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <MenuExportPDF
                  elementId={`menu-history-${selectedEntry.menu.id}`}
                  filename={`Menu_${selectedEntry.patient.firstName}_${selectedEntry.patient.lastName}_${selectedEntry.menu.date}`}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
                />
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
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
              <div className="max-w-[800px] mx-auto">
                {selectedEntry.menu.menuPreviewData ? (
                  <MenuPreview 
                    data={selectedEntry.menu.menuPreviewData} 
                    elementId={`menu-history-${selectedEntry.menu.id}`}
                    selectedTemplate={selectedEntry.menu.selectedTemplateId || 'base_v1'}
                    hideTemplateSelector={true}
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
