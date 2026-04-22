import React, { useState } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronUp, Copy, Upload, X, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { MenuPlanData } from '../MenuDesignTemplates';
import { DEFAULT_SECTION_TITLES, MenuSectionTitles } from '../../../types';

type RecSection = 'preparacion' | 'restricciones' | 'habitos' | 'organizacion';

const SECTION_EMOJI_KEY: Record<RecSection, keyof MenuSectionTitles> = {
  preparacion:   'preparacionEmoji',
  restricciones: 'restriccionesEmoji',
  habitos:       'habitosEmoji',
  organizacion:  'organizacionEmoji',
};
const SECTION_TITLE_KEY: Record<RecSection, keyof MenuSectionTitles> = {
  preparacion:   'preparacionTitle',
  restricciones: 'restriccionesTitle',
  habitos:       'habitosTitle',
  organizacion:  'organizacionTitle',
};

const SECTION_COLORS: Record<RecSection, string> = {
  preparacion:   'indigo',
  restricciones: 'rose',
  habitos:       'emerald',
  organizacion:  'amber',
};

const ALL_SECTIONS: RecSection[] = ['preparacion', 'restricciones', 'habitos', 'organizacion'];

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
}

// ─── Single Recommendation Section ────────────────────────────────────────────
const RecSectionBlock: React.FC<{
  section: RecSection;
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
}> = ({ section, menuPreviewData, setMenuPreviewData }) => {
  const [open, setOpen] = useState(true);
  const st = menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES;
  const recs = menuPreviewData.recommendations || { preparacion: [], restricciones: [], habitos: [], organizacion: [] };

  const [emoji, setEmoji]   = useState(st[SECTION_EMOJI_KEY[section]] as string);
  const [title, setTitle]   = useState(st[SECTION_TITLE_KEY[section]] as string);
  const [items, setItems]   = useState<string[]>(recs[section] || []);

  const color = SECTION_COLORS[section];

  const commit = (newEmoji: string, newTitle: string, newItems: string[]) => {
    setMenuPreviewData({
      ...menuPreviewData,
      recommendations: { ...recs, [section]: newItems.filter(i => i.trim() !== '') },
      sectionTitles: {
        ...(menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES),
        [SECTION_EMOJI_KEY[section]]: newEmoji,
        [SECTION_TITLE_KEY[section]]: newTitle,
      },
    });
  };

  const addItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);
  };

  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    commit(emoji, title, newItems);
  };

  const updateItem = (idx: number, val: string) => {
    const newItems = [...items];
    newItems[idx] = val;
    setItems(newItems);
  };

  const rowCount = (text: string) => Math.max(1, text.split('\n').length);

  const inp = `w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-${color}-500/20 focus:border-${color}-400 outline-none transition-all`;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <span>{emoji}</span>
          {title}
          <span className="text-[10px] font-medium text-slate-400 ml-1">({items.length} ítems)</span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {/* Emoji + title */}
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              maxLength={4}
              onChange={e => setEmoji(e.target.value)}
              onBlur={() => commit(emoji, title, items)}
              className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
            />
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => commit(emoji, title, items)}
              className={`flex-1 ${inp}`}
              placeholder="Título de la sección..."
            />
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-xs text-slate-400 font-bold mt-2.5 w-4 flex-shrink-0">{idx + 1}.</span>
                <textarea
                  value={item}
                  rows={rowCount(item)}
                  onChange={e => updateItem(idx, e.target.value)}
                  onBlur={() => commit(emoji, title, items)}
                  placeholder="Escribe una recomendación..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none leading-relaxed"
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="p-1.5 mt-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
          >
            <Plus className="w-3.5 h-3.5" />Agregar ítem
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page 2 Component ────────────────────────────────────────────────────
export const MenuPage2Sec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData }) => {
  const [open, setOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [copyPasteOpen, setCopyPasteOpen] = useState(false);
  const [tableCopied, setTableCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const st = menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES;
  const [page2Title, setPage2Title] = useState(st.page2Title);

  const commitTitle = (val: string) => {
    setMenuPreviewData({
      ...menuPreviewData,
      sectionTitles: { ...(menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES), page2Title: val },
    });
  };

  const copyPage2AsText = () => {
    const currentSt = menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES;
    const recs = menuPreviewData.recommendations || { preparacion: [], restricciones: [], habitos: [], organizacion: [] };

    const lines: string[] = [];

    ALL_SECTIONS.forEach(section => {
      lines.push('');
      lines.push(`[${section}]`);
      lines.push(`Emoji: ${currentSt[SECTION_EMOJI_KEY[section]]}`);
      lines.push(`Título: ${currentSt[SECTION_TITLE_KEY[section]]}`);
      const items = (recs as any)[section] as string[] || [];
      items.forEach((item, i) => {
        // Indent continuation lines so the numbered item is unambiguous
        lines.push(`${i + 1}. ${item.split('\n').join('\n   ')}`);
      });
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setTableCopied(true);
      setTimeout(() => setTableCopied(false), 2000);
    });
  };

  const parseAndApplyPage2 = () => {
    const errors: string[] = [];
    const currentSt = menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES;
    const newSectionTitles = { ...currentSt };
    const newRecs: Record<RecSection, string[]> = {
      preparacion: [], restricciones: [], habitos: [], organizacion: [],
    };

    const lines = importText.split('\n');

    // Split into section blocks by [sectionKey] markers
    const sectionBlocks: { key: RecSection; lines: string[] }[] = [];
    let currentSection: RecSection | null = null;
    let currentLines: string[] = [];

    lines.forEach(line => {
      const m = line.match(/^\[([a-z]+)\]$/);
      if (m && ALL_SECTIONS.includes(m[1] as RecSection)) {
        if (currentSection) sectionBlocks.push({ key: currentSection, lines: currentLines });
        currentSection = m[1] as RecSection;
        currentLines = [];
        return;
      }
      if (currentSection) currentLines.push(line);
    });
    if (currentSection) sectionBlocks.push({ key: currentSection, lines: currentLines });

    if (sectionBlocks.length === 0) {
      errors.push('No se encontraron secciones válidas. Verifica que el texto incluya marcadores como [preparacion], [habitos], etc.');
    }

    sectionBlocks.forEach(({ key, lines: sLines }) => {
      const emojiLine = sLines.find(l => l.startsWith('Emoji:'));
      if (emojiLine) (newSectionTitles as any)[SECTION_EMOJI_KEY[key]] = emojiLine.replace('Emoji:', '').trim();

      const secTitleLine = sLines.find(l => l.startsWith('Título:'));
      if (secTitleLine) (newSectionTitles as any)[SECTION_TITLE_KEY[key]] = secTitleLine.replace('Título:', '').trim();

      // Parse numbered items; indented continuation lines belong to the current item
      const items: string[] = [];
      let currentItem: string[] | null = null;
      sLines.forEach(line => {
        if (line.startsWith('Emoji:') || line.startsWith('Título:')) return;
        const numMatch = line.match(/^(\d+)\. (.*)/);
        if (numMatch) {
          if (currentItem !== null) items.push(currentItem.join('\n'));
          currentItem = [numMatch[2]];
        } else if (currentItem !== null) {
          // Strip leading indentation added during copy
          currentItem.push(line.replace(/^   /, ''));
        }
      });
      if (currentItem !== null) items.push(currentItem.join('\n'));
      newRecs[key] = items.filter(i => i.trim() !== '');
    });

    setImportErrors(errors);

    const newData: MenuPlanData = {
      ...menuPreviewData,
      sectionTitles: newSectionTitles,
      recommendations: newRecs as any,
    };

    setMenuPreviewData(newData);
    setPage2Title(newSectionTitles.page2Title);
    setResetKey(k => k + 1);

    if (errors.length === 0) {
      setImportSuccess(true);
      setTimeout(() => {
        setImportOpen(false);
        setImportText('');
        setImportSuccess(false);
        setImportErrors([]);
      }, 1200);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          Página 2 — Recomendaciones y Hábitos
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Dropdown Copiar / Pegar */}
        <div className="relative">
          <button
            onClick={() => setCopyPasteOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Copy className="w-3 h-3" />
            Copiar / Pegar
            <ChevronDown className={`w-3 h-3 transition-transform ${copyPasteOpen ? 'rotate-180' : ''}`} />
          </button>
          {copyPasteOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCopyPasteOpen(false)} />
              <div className="absolute right-0 mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-44">
                <button
                  onClick={() => { copyPage2AsText(); setCopyPasteOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                    tableCopied ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  {tableCopied ? '¡Copiado!' : 'Copiar página 2'}
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={() => { setImportOpen(true); setImportErrors([]); setImportSuccess(false); setCopyPasteOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  Pegar en página 2
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* Page 2 title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título de Página 2</label>
            <input
              type="text"
              value={page2Title}
              onChange={e => setPage2Title(e.target.value)}
              onBlur={() => commitTitle(page2Title)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
            />
          </div>

          {/* 4 recommendation sections */}
          <div className="space-y-3">
            {ALL_SECTIONS.map(section => (
              <RecSectionBlock
                key={`${section}-${resetKey}`}
                section={section}
                menuPreviewData={menuPreviewData}
                setMenuPreviewData={setMenuPreviewData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal importar */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-black text-slate-700">Importar recomendaciones editadas</span>
              </div>
              <button
                onClick={() => { setImportOpen(false); setImportText(''); setImportErrors([]); setImportSuccess(false); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tips */}
            <div className="mx-5 mt-4 rounded-xl bg-sky-50 border border-sky-100 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-[11px] font-black text-sky-600 uppercase tracking-wide">Antes de pegar, ten en cuenta:</span>
              </div>
              <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-emerald-500 font-black">✓</span> Puedes editar el emoji, el título y los ítems de cada sección.</p>
              <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-emerald-500 font-black">✓</span> Agrega o elimina ítems numerados libremente.</p>
              <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-rose-500 font-black">✗</span> No cambies las claves entre corchetes (<span className="font-bold">[preparacion]</span>, <span className="font-bold">[habitos]</span>, etc.).</p>
              <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-rose-500 font-black">✗</span> No cambies los prefijos <span className="font-bold">Emoji:</span> y <span className="font-bold">Título:</span>.</p>
              <p className="text-[11px] text-sky-700 leading-relaxed flex gap-1.5"><span className="text-rose-500 font-black">✗</span> No elimines las líneas en blanco entre secciones.</p>
            </div>

            {/* Textarea */}
            <div className="px-5 pt-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                Pega aquí el texto editado
              </label>
              <textarea
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportErrors([]); setImportSuccess(false); }}
                rows={12}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none leading-relaxed"
                placeholder={'[preparacion]\nEmoji: 🥗\nTítulo: Preparación de Alimentos\n1. Primera recomendación\n2. Segunda recomendación\n\n[habitos]\nEmoji: ✅\nTítulo: Hábitos saludables\n1. Beber 2L de agua al día\n...'}
              />
            </div>

            {/* Errores / éxito */}
            {importErrors.length > 0 && (
              <div className="mx-5 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-[11px] font-black text-amber-600 mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Advertencias:
                </p>
                {importErrors.map((e, i) => (
                  <p key={i} className="text-[11px] text-amber-700">• {e}</p>
                ))}
              </div>
            )}
            {importSuccess && (
              <div className="mx-5 mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-[11px] font-black text-emerald-600">¡Página 2 importada correctamente!</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 mt-3 border-t border-slate-100">
              <button
                onClick={() => { setImportOpen(false); setImportText(''); setImportErrors([]); setImportSuccess(false); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={parseAndApplyPage2}
                disabled={!importText.trim()}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  importText.trim()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
