import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Save, X,
  ClipboardList
} from 'lucide-react';
import { MenuRecommendationRecord, MenuRecommendationData, DEFAULT_SECTION_TITLES, MenuSectionTitles } from '../../types';
import { store } from '../../services/store';

const emptyRecData = (): MenuRecommendationData => ({
  preparacion: [],
  restricciones: [],
  habitos: [],
  organizacion: [],
});

// Returns the active titles: from the rec's own data, or from the template, or the defaults
function resolveRecTitles(recData?: MenuRecommendationData): MenuSectionTitles {
  const stored = recData?.sectionTitles;
  const template = store.getMenuTemplate()?.sectionTitles;
  return { ...DEFAULT_SECTION_TITLES, ...template, ...stored };
}

export const MenuRecommendations: React.FC<{ hideHeader?: boolean; hideContainer?: boolean }> = ({ hideHeader, hideContainer }) => {
  const [recs, setRecs] = useState<MenuRecommendationRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Partial<MenuRecommendationRecord> | null>(null);
  const [editingSectionTitles, setEditingSectionTitles] = useState<MenuSectionTitles>(DEFAULT_SECTION_TITLES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRecs(store.getMenuRecommendations());
  }, []);

  const handleOpenAdd = () => {
    const baseTitles = resolveRecTitles();
    setEditingSectionTitles(baseTitles);
    setEditingRec({
      name: '',
      data: emptyRecData(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: MenuRecommendationRecord) => {
    setEditingSectionTitles(resolveRecTitles(rec.data));
    setEditingRec({ ...rec });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingRec?.name?.trim()) return;
    setIsLoading(true);
    try {
      const recToSave: Partial<MenuRecommendationRecord> = {
        ...editingRec,
        data: {
          ...(editingRec.data || emptyRecData()),
          sectionTitles: editingSectionTitles,
        },
      };
      await store.saveMenuRecommendation(recToSave);
      setIsModalOpen(false);
      setEditingRec(null);
      setRecs([...store.getMenuRecommendations()]);
    } catch (error) {
      console.error("Error saving recommendation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de eliminar esta plantilla?")) return;
    try {
      await store.deleteMenuRecommendation(id);
      setRecs([...store.getMenuRecommendations()]);
    } catch (error) {
      console.error("Error deleting recommendation:", error);
    }
  };

  const addNote = (section: keyof MenuRecommendationData) => {
    if (!editingRec || !editingRec.data) return;
    const newData = { ...editingRec.data };
    newData[section] = [...(newData[section] || []), ''];
    setEditingRec({ ...editingRec, data: newData });
  };

  const updateNote = (section: keyof MenuRecommendationData, index: number, value: string) => {
    if (!editingRec || !editingRec.data) return;
    const newData = { ...editingRec.data };
    const newSection = [...newData[section]];
    newSection[index] = value;
    newData[section] = newSection;
    setEditingRec({ ...editingRec, data: newData });
  };

  const removeNote = (section: keyof MenuRecommendationData, index: number) => {
    if (!editingRec || !editingRec.data) return;
    const newData = { ...editingRec.data };
    const newSection = [...newData[section]];
    newSection.splice(index, 1);
    newData[section] = newSection;
    setEditingRec({ ...editingRec, data: newData });
  };

  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>
      {!hideHeader ? (
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Plantillas de Recomendaciones</h3>
              <p className="text-sm text-slate-500 mt-0.5">Gestiona tus notas predefinidas para la página 2 del menú</p>
            </div>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Nueva Plantilla
          </button>
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 flex justify-end items-center gap-2 bg-slate-50/30">
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Nueva Plantilla
          </button>
        </div>
      )}

      <div className="p-6">
        {recs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No tienes plantillas guardadas</p>
            <button 
              onClick={handleOpenAdd}
              className="text-emerald-600 text-sm font-bold mt-2 hover:underline"
            >
              Crear mi primera plantilla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map(rec => (
              <div 
                key={rec.id}
                onClick={() => handleOpenEdit(rec)}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <FileText className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                  </div>
                  <button 
                    onClick={(e) => handleDelete(rec.id, e)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 line-clamp-1">{rec.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-bold">
                  {new Date(rec.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {(() => {
                    const t = resolveRecTitles(rec.data);
                    return [
                      { key: 'preparacion',   label: t.preparacionTitle,   emoji: t.preparacionEmoji },
                      { key: 'restricciones', label: t.restriccionesTitle, emoji: t.restriccionesEmoji },
                      { key: 'habitos',       label: t.habitosTitle,       emoji: t.habitosEmoji },
                      { key: 'organizacion',  label: t.organizacionTitle,  emoji: t.organizacionEmoji },
                    ].map(({ key, label, emoji }) => {
                      const val = rec.data[key as keyof MenuRecommendationData];
                      if (!Array.isArray(val) || val.length === 0) return null;
                      return (
                        <span key={key} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500 font-bold">
                          {emoji} {label} ({val.length})
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición/Creación */}
      {isModalOpen && editingRec && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingRec.id ? 'Editar Plantilla' : 'Nueva Plantilla de Recomendaciones'}
                  </h3>
                  <p className="text-xs text-slate-500">Define las notas para las 4 secciones de la página 2</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la Plantilla</label>
                <input 
                  type="text"
                  value={editingRec.name}
                  onChange={e => setEditingRec({ ...editingRec, name: e.target.value })}
                  placeholder="Ej: Recomendaciones Generales - Pérdida de Peso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-8">
                {[
                  { key: 'preparacion',   emojiKey: 'preparacionEmoji'   as keyof MenuSectionTitles, titleKey: 'preparacionTitle'   as keyof MenuSectionTitles },
                  { key: 'restricciones', emojiKey: 'restriccionesEmoji' as keyof MenuSectionTitles, titleKey: 'restriccionesTitle' as keyof MenuSectionTitles },
                  { key: 'habitos',       emojiKey: 'habitosEmoji'       as keyof MenuSectionTitles, titleKey: 'habitosTitle'       as keyof MenuSectionTitles },
                  { key: 'organizacion',  emojiKey: 'organizacionEmoji'  as keyof MenuSectionTitles, titleKey: 'organizacionTitle'  as keyof MenuSectionTitles },
                ].map(field => (
                  <div key={field.key} className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editingSectionTitles[field.emojiKey] as string || ''}
                          onChange={e => setEditingSectionTitles(prev => ({ ...prev, [field.emojiKey]: e.target.value }))}
                          className="w-12 text-center text-xl bg-white border border-slate-200 rounded-xl px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                          title="Editar emoji"
                        />
                        <input
                          type="text"
                          value={editingSectionTitles[field.titleKey] as string || ''}
                          onChange={e => setEditingSectionTitles(prev => ({ ...prev, [field.titleKey]: e.target.value }))}
                          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                          title="Editar título de sección"
                        />
                      </div>
                      <button
                        onClick={() => addNote(field.key as keyof MenuRecommendationData)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Nota
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editingRec.data?.[field.key as keyof MenuRecommendationData] || []).map((note, idx) => (
                        <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                          <div className="flex-1 relative group">
                            <textarea
                              value={note}
                              onChange={e => updateNote(field.key as keyof MenuRecommendationData, idx, e.target.value)}
                              placeholder="Escribe una recomendación..."
                              rows={2}
                              className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeNote(field.key as keyof MenuRecommendationData, idx)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {(editingRec.data?.[field.key as keyof MenuRecommendationData] || []).length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-xs italic">
                          No hay notas en esta sección.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading || !editingRec.name?.trim()}
                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
