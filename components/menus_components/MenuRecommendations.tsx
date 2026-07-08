import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Trash2, Save, X,
  ClipboardList, History, UtensilsCrossed, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { MenuRecommendationRecord, MenuRecommendationData, DEFAULT_SECTION_TITLES, MenuSectionTitles, GeneratedMenu, Patient } from '../../types';
import { EatingOutPageData, EatingOutColumn, DEFAULT_EATING_OUT_PAGE } from './menudesigntemplates_components/menuTemplateTypes';
import { store } from '../../services/store';
import { MenuHistory } from './MenuHistory';

// ─── Types ─────────────────────────────────────────────────────────────────────

type RecTab = 'general' | 'eating_out';

interface EatingOutEditState {
  id?:  string;
  name: string;
  data: EatingOutPageData;
}

function genColId() {
  return `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const REC_PAGE_SIZE = 10;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const emptyRecData = (): MenuRecommendationData => ({
  preparacion: [],
  restricciones: [],
  habitos: [],
  organizacion: [],
});

function resolveRecTitles(recData?: MenuRecommendationData): MenuSectionTitles {
  const stored  = recData?.sectionTitles;
  const template = store.getMenuTemplate()?.sectionTitles;
  return { ...DEFAULT_SECTION_TITLES, ...template, ...stored };
}

function emptyEatingOutData(): EatingOutPageData {
  const col1 = genColId();
  const col2 = genColId();
  const col3 = genColId();
  return {
    visible: true,
    title: 'RECOMENDACIONES AL COMER FUERA DE CASA',
    freeText: '',
    columns: [
      { id: col1, label: 'Restaurante / Tipo' },
      { id: col2, label: 'Opciones saludables' },
      { id: col3, label: 'Recomendaciones' },
    ],
    rows: [{ [col1]: '', [col2]: '', [col3]: '' }],
  };
}

// ─── Auto-resize textarea ──────────────────────────────────────────────────────

const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  onChange, className, ...props
}) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };
  useEffect(() => { resize(); }, [props.value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      onChange={e => { onChange?.(e); resize(); }}
      className={`${className ?? ''} overflow-hidden`}
      {...props}
    />
  );
};

// ─── Dropdown "Nueva" button ───────────────────────────────────────────────────

const NewDropdownButton: React.FC<{ onNew: () => void; onFromMenu: () => void }> = ({ onNew, onFromMenu }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
      >
        <Plus className="w-4 h-4" />
        Nueva
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden origin-top-right">
          <button
            onClick={() => { onNew(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Crear plantilla desde cero</span>
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={() => { onFromMenu(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <History className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Crear desde un menú existente</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const MenuRecommendations: React.FC<{ hideHeader?: boolean; hideContainer?: boolean }> = ({ hideHeader, hideContainer }) => {
  const [activeTab, setActiveTab]                   = useState<RecTab>('general');
  const [recs, setRecs]                             = useState<MenuRecommendationRecord[]>([]);
  const [isModalOpen, setIsModalOpen]               = useState(false);
  const [editingRec, setEditingRec]                 = useState<Partial<MenuRecommendationRecord> | null>(null);
  const [editingSectionTitles, setEditingSectionTitles] = useState<MenuSectionTitles>(DEFAULT_SECTION_TITLES);
  const [isLoading, setIsLoading]                   = useState(false);
  const [isImportFromMenuOpen, setIsImportFromMenuOpen] = useState(false);
  const [importContext, setImportContext]               = useState<RecTab>('general');
  const [page, setPage]                              = useState(1);

  // Eating-out state
  const [editingEatingOut, setEditingEatingOut]     = useState<EatingOutEditState | null>(null);

  useEffect(() => {
    setRecs(store.getMenuRecommendations());
  }, []);

  const generalRecs    = recs.filter(r => !r.type || r.type === 'general');
  const eatingOutRecs  = recs.filter(r => r.type === 'eating_out');

  useEffect(() => { setPage(1); }, [activeTab]);

  const activeRecs   = activeTab === 'general' ? generalRecs : eatingOutRecs;
  const totalPages   = Math.max(1, Math.ceil(activeRecs.length / REC_PAGE_SIZE));
  const clampedPage  = Math.min(page, totalPages);
  const pageRecs      = activeRecs.slice((clampedPage - 1) * REC_PAGE_SIZE, clampedPage * REC_PAGE_SIZE);

  // ── General recommendations handlers ───────────────────────────────────────

  const handleOpenAdd = () => {
    const baseTitles = resolveRecTitles();
    setEditingSectionTitles(baseTitles);
    setEditingRec({ name: '', data: emptyRecData() });
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
        type: 'general',
        data: { ...(editingRec.data || emptyRecData()), sectionTitles: editingSectionTitles },
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

  const handleAddAsRecommendation = async (_menu: GeneratedMenu, _patient: Patient, name: string): Promise<void> => {
    const plan = _menu.menuData;
    if (!plan) throw new Error('No menuData');
    const recData: MenuRecommendationData = {
      preparacion:   plan.recommendations?.preparacion   || [],
      restricciones: plan.recommendations?.restricciones || [],
      habitos:       plan.recommendations?.habitos       || [],
      organizacion:  plan.recommendations?.organizacion  || [],
      sectionTitles: plan.sectionTitles || undefined,
    };
    await store.saveMenuRecommendation({ name, type: 'general', data: recData });
    setRecs([...store.getMenuRecommendations()]);
  };

  const handleAddAsEatingOutFromMenu = async (_menu: GeneratedMenu, _patient: Patient, name: string): Promise<void> => {
    const eoPage = _menu.menuData?.eatingOutPage;
    if (!eoPage) throw new Error('No eatingOutPage');
    await store.saveMenuRecommendation({ name, type: 'eating_out', data: eoPage as unknown as MenuRecommendationData });
    setRecs([...store.getMenuRecommendations()]);
  };

  // ── Eating-out handlers ─────────────────────────────────────────────────────

  const handleOpenAddEatingOut = () => {
    setEditingEatingOut({ name: '', data: emptyEatingOutData() });
  };

  const handleOpenEditEatingOut = (rec: MenuRecommendationRecord) => {
    setEditingEatingOut({ id: rec.id, name: rec.name, data: rec.data as unknown as EatingOutPageData });
  };

  const handleSaveEatingOut = async () => {
    if (!editingEatingOut?.name?.trim()) return;
    setIsLoading(true);
    try {
      await store.saveMenuRecommendation({
        id:   editingEatingOut.id,
        name: editingEatingOut.name,
        type: 'eating_out',
        data: editingEatingOut.data as unknown as MenuRecommendationData,
      });
      setEditingEatingOut(null);
      setRecs([...store.getMenuRecommendations()]);
    } catch (error) {
      console.error("Error saving eating-out template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEatingOut = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de eliminar esta plantilla?")) return;
    try {
      await store.deleteMenuRecommendation(id);
      setRecs([...store.getMenuRecommendations()]);
    } catch (error) {
      console.error("Error deleting eating-out template:", error);
    }
  };

  // Eating-out modal helpers
  const eoPage = editingEatingOut?.data;

  const eoUpdate = (patch: Partial<EatingOutPageData>) => {
    if (!editingEatingOut) return;
    setEditingEatingOut({ ...editingEatingOut, data: { ...editingEatingOut.data, ...patch } });
  };

  const eoAddColumn = () => {
    if (!eoPage) return;
    const newCol: EatingOutColumn = { id: genColId(), label: 'Nueva columna' };
    const newCols = [...eoPage.columns, newCol];
    const newRows = eoPage.rows.map(row => ({ ...row, [newCol.id]: '' }));
    eoUpdate({ columns: newCols, rows: newRows });
  };

  const eoRemoveColumn = (colId: string) => {
    if (!eoPage || eoPage.columns.length <= 1) return;
    const newCols = eoPage.columns.filter(c => c.id !== colId);
    const newRows = eoPage.rows.map(row => {
      const r = { ...row };
      delete r[colId];
      return r;
    });
    eoUpdate({ columns: newCols, rows: newRows });
  };

  const eoUpdateColumnLabel = (colId: string, label: string) => {
    if (!eoPage) return;
    eoUpdate({ columns: eoPage.columns.map(c => c.id === colId ? { ...c, label } : c) });
  };

  const eoAddRow = () => {
    if (!eoPage) return;
    const emptyRow: Record<string, string> = {};
    eoPage.columns.forEach(c => { emptyRow[c.id] = ''; });
    eoUpdate({ rows: [...eoPage.rows, emptyRow] });
  };

  const eoRemoveRow = (idx: number) => {
    if (!eoPage) return;
    eoUpdate({ rows: eoPage.rows.filter((_, i) => i !== idx) });
  };

  const eoUpdateCell = (rowIdx: number, colId: string, value: string) => {
    if (!eoPage) return;
    eoUpdate({ rows: eoPage.rows.map((row, i) => i === rowIdx ? { ...row, [colId]: value } : row) });
  };

  // ── Tab switcher ────────────────────────────────────────────────────────────

  const TabSwitcher = () => (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
      <button
        onClick={() => setActiveTab('general')}
        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
          activeTab === 'general' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Generales
      </button>
      <button
        onClick={() => setActiveTab('eating_out')}
        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
          activeTab === 'eating_out' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <UtensilsCrossed className="hidden sm:inline w-3 h-3" /> Comer Afuera
      </button>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={hideContainer ? "" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"}>

      {/* Header */}
      {!hideHeader ? (
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50">
                {activeTab === 'eating_out'
                  ? <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                  : <ClipboardList className="w-5 h-5 text-emerald-600" />
                }
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Plantillas de Recomendaciones</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {activeTab === 'eating_out'
                    ? 'Plantillas de recomendaciones al comer fuera de casa'
                    : 'Gestiona tus notas predefinidas para la página 2 del menú'}
                </p>
              </div>
            </div>
            <NewDropdownButton
              onNew={activeTab === 'general' ? handleOpenAdd : handleOpenAddEatingOut}
              onFromMenu={() => { setImportContext(activeTab); setIsImportFromMenuOpen(true); }}
            />
          </div>
          <TabSwitcher />
        </div>
      ) : (
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <TabSwitcher />
            <NewDropdownButton
              onNew={activeTab === 'general' ? handleOpenAdd : handleOpenAddEatingOut}
              onFromMenu={() => { setImportContext(activeTab); setIsImportFromMenuOpen(true); }}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-6">
        {activeTab === 'general' ? (
          /* ── General Recommendations List ── */
          generalRecs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No tienes plantillas guardadas</p>
              <button onClick={handleOpenAdd} className="text-emerald-600 text-sm font-bold mt-2 hover:underline">
                Crear mi primera plantilla
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Secciones</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecs.map((rec, i) => {
                      const t = resolveRecTitles(rec.data);
                      const badges = [
                        { key: 'preparacion',   label: t.preparacionTitle,   emoji: t.preparacionEmoji },
                        { key: 'restricciones', label: t.restriccionesTitle, emoji: t.restriccionesEmoji },
                        { key: 'habitos',       label: t.habitosTitle,       emoji: t.habitosEmoji },
                        { key: 'organizacion',  label: t.organizacionTitle,  emoji: t.organizacionEmoji },
                      ].map(({ key, label, emoji }) => {
                        const val = rec.data[key as keyof MenuRecommendationData];
                        if (!Array.isArray(val) || val.length === 0) return null;
                        return { key, label, emoji, count: val.length };
                      }).filter(Boolean) as { key: string; label?: string; emoji?: string; count: number }[];
                      return (
                        <tr
                          key={rec.id}
                          onClick={() => handleOpenEdit(rec)}
                          className={`border-b border-slate-100 last:border-0 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-emerald-50/30 transition-colors`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">{rec.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            {badges.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {badges.map(b => (
                                  <span key={b.key} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold">
                                    {b.emoji} {b.label} ({b.count})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {new Date(rec.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(rec); }}
                                className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDelete(rec.id, e)}
                                className="inline-flex items-center justify-center text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Página {clampedPage} / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={clampedPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={clampedPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* ── Eating-Out Templates List ── */
          eatingOutRecs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-emerald-100 rounded-3xl">
              <UtensilsCrossed className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No tienes plantillas de comer afuera guardadas</p>
              <button onClick={handleOpenAddEatingOut} className="text-emerald-600 text-sm font-bold mt-2 hover:underline">
                Crear mi primera plantilla
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contenido</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecs.map((rec, i) => {
                      const d = rec.data as unknown as EatingOutPageData;
                      return (
                        <tr
                          key={rec.id}
                          onClick={() => handleOpenEditEatingOut(rec)}
                          className={`border-b border-slate-100 last:border-0 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-emerald-50/30 transition-colors`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">{rec.name}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[220px] truncate">
                            {d?.title || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(d?.columns?.length || 0) > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold">
                                  {d.columns.length} col · {d.rows?.length || 0} filas
                                </span>
                              )}
                              {d?.freeText?.trim() && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold">
                                  + texto libre
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {new Date(rec.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditEatingOut(rec); }}
                                className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteEatingOut(rec.id, e)}
                                className="inline-flex items-center justify-center text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Página {clampedPage} / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={clampedPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={clampedPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Modal: importar desde menú existente (general) */}
      {isImportFromMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <History className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Agregar Recomendaciones desde Menú Existente</h3>
                  <p className="text-sm text-slate-500">Selecciona un menú del historial para guardar sus recomendaciones como plantilla (Hoja 2)</p>
                </div>
              </div>
              <button onClick={() => setIsImportFromMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MenuHistory
                onAddAsRecommendation={importContext === 'eating_out' ? handleAddAsEatingOutFromMenu : handleAddAsRecommendation}
                filterEatingOut={importContext === 'eating_out'}
                filterRecommendations={importContext === 'general'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: General Recommendations Editor */}
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
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
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
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all">
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

      {/* Modal: Eating-Out Editor */}
      {editingEatingOut && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingEatingOut.id ? 'Editar Plantilla' : 'Nueva Plantilla — Comer Afuera'}
                  </h3>
                  <p className="text-xs text-slate-500">Tabla de restaurantes y recomendaciones reutilizable</p>
                </div>
              </div>
              <button onClick={() => setEditingEatingOut(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre de la Plantilla</label>
                <input
                  type="text"
                  value={editingEatingOut.name}
                  onChange={e => setEditingEatingOut({ ...editingEatingOut, name: e.target.value })}
                  placeholder="Ej: Restaurantes Zona 10 — Pérdida de Peso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                />
              </div>

              {/* Título de la hoja */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Título de la hoja</label>
                <input
                  type="text"
                  value={eoPage?.title || ''}
                  onChange={e => eoUpdate({ title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                />
              </div>

              {/* Texto libre */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Texto libre / notas generales</label>
                <textarea
                  value={eoPage?.freeText || ''}
                  onChange={e => eoUpdate({ freeText: e.target.value })}
                  rows={3}
                  placeholder="Escribe recomendaciones generales para comer fuera..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Tabla */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tabla</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={eoAddColumn}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg text-[11px] font-bold border border-slate-200 hover:border-emerald-200 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Columna
                    </button>
                    {(eoPage?.columns?.length || 0) > 0 && (
                      <button
                        onClick={eoAddRow}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg text-[11px] font-bold border border-slate-200 hover:border-emerald-200 transition-all"
                      >
                        <Plus className="w-3 h-3" /> Fila
                      </button>
                    )}
                  </div>
                </div>

                {(eoPage?.columns?.length || 0) === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-emerald-100 rounded-xl text-slate-400 text-xs">
                    Sin columnas. Agrega una para comenzar.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs border-collapse min-w-max">
                      <thead>
                        <tr className="bg-slate-50">
                          {eoPage!.columns.map(col => (
                            <th key={col.id} className="border-b border-slate-200 p-0 text-left font-normal min-w-[140px]">
                              <div className="flex items-center gap-1 px-2 py-1.5">
                                <input
                                  type="text"
                                  value={col.label}
                                  onChange={e => eoUpdateColumnLabel(col.id, e.target.value)}
                                  className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-slate-600 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 py-0.5 transition-all"
                                />
                                {eoPage!.columns.length > 1 && (
                                  <button
                                    onClick={() => eoRemoveColumn(col.id)}
                                    className="flex-shrink-0 p-0.5 text-slate-300 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="border-b border-slate-200 w-8 bg-slate-50" />
                        </tr>
                      </thead>
                      <tbody>
                        {eoPage!.rows.map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            {eoPage!.columns.map(col => (
                              <td key={col.id} className="border-b border-slate-100 p-0 align-top">
                                <AutoResizeTextarea
                                  value={row[col.id] ?? ''}
                                  onChange={e => eoUpdateCell(ri, col.id, e.target.value)}
                                  placeholder="—"
                                  className="w-full bg-transparent text-[12px] text-slate-700 font-medium px-2 py-1.5 outline-none focus:bg-emerald-50/30 focus:ring-1 focus:ring-emerald-300 rounded transition-all resize-none leading-relaxed"
                                />
                              </td>
                            ))}
                            <td className="border-b border-slate-100 w-8 align-middle text-center">
                              <button onClick={() => eoRemoveRow(ri)} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {eoPage!.rows.length === 0 && (
                          <tr>
                            <td colSpan={eoPage!.columns.length + 1} className="text-center py-5 text-slate-300 text-[11px] font-medium">
                              Sin filas. Agrega una para comenzar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button onClick={() => setEditingEatingOut(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSaveEatingOut}
                disabled={isLoading || !editingEatingOut.name?.trim()}
                className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
