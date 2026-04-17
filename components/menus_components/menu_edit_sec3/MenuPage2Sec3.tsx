import React, { useState } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const st = menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES;
  const [page2Title, setPage2Title] = useState(st.page2Title);

  const commitTitle = (val: string) => {
    setMenuPreviewData({
      ...menuPreviewData,
      sectionTitles: { ...(menuPreviewData.sectionTitles || DEFAULT_SECTION_TITLES), page2Title: val },
    });
  };

  const SECTIONS: RecSection[] = ['preparacion', 'restricciones', 'habitos', 'organizacion'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <FileText className="w-4 h-4 text-indigo-600" />
          Página 2 — Recomendaciones y Hábitos
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

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
            {SECTIONS.map(section => (
              <RecSectionBlock
                key={section}
                section={section}
                menuPreviewData={menuPreviewData}
                setMenuPreviewData={setMenuPreviewData}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
