import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Plus, Trash2, ChevronDown, ChevronUp, UtensilsCrossed } from 'lucide-react';
import { MenuPlanData } from '../MenuDesignTemplates';
import { EatingOutPageData, EatingOutColumn, DEFAULT_EATING_OUT_PAGE } from '../menudesigntemplates_components/menuTemplateTypes';

// ─── Auto-resize textarea ──────────────────────────────────────────────────────
const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  onChange,
  className,
  ...props
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
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
      rows={5}
      onChange={(e) => { onChange?.(e); resize(); }}
      className={`${className ?? ''} overflow-hidden`}
      {...props}
    />
  );
};

// ─── Generate unique column id ─────────────────────────────────────────────────
function genId() {
  return `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
}

export const MenuPage3Sec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData }) => {
  const [open, setOpen] = useState(true);
  const page: EatingOutPageData = menuPreviewData.eatingOutPage ?? DEFAULT_EATING_OUT_PAGE;

  function update(patch: Partial<EatingOutPageData>) {
    setMenuPreviewData({
      ...menuPreviewData,
      eatingOutPage: { ...page, ...patch },
    });
  }

  // ── Visibility ────────────────────────────────────────────────────────────────
  function toggleVisible() {
    update({ visible: !page.visible });
  }

  // ── Title ─────────────────────────────────────────────────────────────────────
  const [localTitle, setLocalTitle] = useState(page.title);
  useEffect(() => { setLocalTitle(page.title); }, [page.title]);

  // ── Free text ─────────────────────────────────────────────────────────────────
  const [localText, setLocalText] = useState(page.freeText);
  useEffect(() => { setLocalText(page.freeText); }, [page.freeText]);

  // ── Table: columns ─────────────────────────────────────────────────────────────
  function addColumn() {
    const newCol: EatingOutColumn = { id: genId(), label: 'Nueva columna' };
    const newCols = [...page.columns, newCol];
    const newRows = page.rows.map(row => ({ ...row, [newCol.id]: '' }));
    update({ columns: newCols, rows: newRows });
  }

  function removeColumn(colId: string) {
    const newCols = page.columns.filter(c => c.id !== colId);
    const newRows = page.rows.map(row => {
      const r = { ...row };
      delete r[colId];
      return r;
    });
    update({ columns: newCols, rows: newRows });
  }

  function updateColumnLabel(colId: string, label: string) {
    update({
      columns: page.columns.map(c => c.id === colId ? { ...c, label } : c),
    });
  }

  // ── Table: rows ────────────────────────────────────────────────────────────────
  function addRow() {
    const emptyRow: Record<string, string> = {};
    page.columns.forEach(c => { emptyRow[c.id] = ''; });
    update({ rows: [...page.rows, emptyRow] });
  }

  function removeRow(idx: number) {
    update({ rows: page.rows.filter((_, i) => i !== idx) });
  }

  function updateCell(rowIdx: number, colId: string, value: string) {
    const newRows = page.rows.map((row, i) =>
      i === rowIdx ? { ...row, [colId]: value } : row
    );
    update({ rows: newRows });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="w-full bg-slate-50 border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
            Sección Recomendaciones al Comer Fuera
            {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Visibility toggle */}
          <button
            onClick={toggleVisible}
            title={page.visible ? 'Hoja visible en vista previa y portal' : 'Hoja oculta (no aparece en vista previa ni portal)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              page.visible
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {page.visible
              ? <><Eye className="w-3.5 h-3.5" /> Visible</>
              : <><EyeOff className="w-3.5 h-3.5" /> Oculta</>
            }
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-5">
          {/* ── Title ─────────────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Título de la hoja
            </label>
            <input
              type="text"
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              onBlur={() => update({ title: localTitle })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all"
            />
          </div>

          {/* ── Free text ─────────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Texto libre / notas generales
            </label>
            <AutoResizeTextarea
              value={localText}
              onChange={e => setLocalText(e.target.value)}
              onBlur={() => update({ freeText: localText })}
              placeholder="Escribe recomendaciones generales para comer fuera de casa..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          {/* ── Table ─────────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tabla de restaurantes
              </label>
              <button
                onClick={addColumn}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-orange-600 rounded-lg text-[11px] font-bold border border-slate-200 hover:border-orange-200 transition-all"
              >
                <Plus className="w-3 h-3" /> Columna
              </button>
            </div>

            {page.columns.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs">
                Sin columnas. Agrega una para comenzar.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs border-collapse min-w-max">
                  {/* Column header row — editable labels */}
                  <thead>
                    <tr className="bg-slate-50">
                      {page.columns.map((col, ci) => (
                        <th key={col.id} className="border-b border-slate-200 p-0 text-left font-normal min-w-[140px]">
                          <div className="flex items-center gap-1 px-2 py-1.5">
                            <input
                              type="text"
                              value={col.label}
                              onChange={e => updateColumnLabel(col.id, e.target.value)}
                              className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-slate-600 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400 rounded px-1 py-0.5 transition-all"
                            />
                            {page.columns.length > 1 && (
                              <button
                                onClick={() => removeColumn(col.id)}
                                className="flex-shrink-0 p-0.5 text-slate-300 hover:text-red-400 transition-colors"
                                title="Eliminar columna"
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

                  {/* Data rows */}
                  <tbody>
                    {page.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        {page.columns.map((col) => (
                          <td key={col.id} className="border-b border-slate-100 p-0 align-top">
                            <AutoResizeTextarea
                              value={row[col.id] ?? ''}
                              onChange={e => updateCell(ri, col.id, e.target.value)}
                              placeholder="—"
                              rows={1}
                              className="w-full bg-transparent text-[12px] text-slate-700 font-medium px-2 py-1.5 outline-none focus:bg-orange-50/30 focus:ring-1 focus:ring-orange-300 rounded transition-all resize-none leading-relaxed"
                            />
                          </td>
                        ))}
                        <td className="border-b border-slate-100 w-8 align-middle text-center">
                          <button
                            onClick={() => removeRow(ri)}
                            className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Empty state */}
                    {page.rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={page.columns.length + 1}
                          className="text-center py-5 text-slate-300 text-[11px] font-medium"
                        >
                          Sin filas. Agrega una fila para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add row button */}
            {page.columns.length > 0 && (
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all border border-orange-100"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar fila
              </button>
            )}
          </div>

          {/* Visibility hint */}
          {!page.visible && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-600 font-medium">
              <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
              Esta hoja está oculta. No aparecerá en la vista previa, PDF ni en el portal del paciente.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
