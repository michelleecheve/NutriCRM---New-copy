import React from 'react';
import type { PageLayoutOption } from '../../types';

interface Props {
  value: PageLayoutOption;
  onChange: (v: PageLayoutOption) => void;
}

type ContentBlock = 'porciones' | 'menu' | 'recomendaciones';

const BLOCK_COLORS: Record<ContentBlock, { bg: string; border: string; label: string; text: string }> = {
  porciones:       { bg: '#dbeafe', border: '#3b82f6', label: 'Tabla de porciones', text: '#2563eb' },
  menu:            { bg: '#ede9fe', border: '#8b5cf6', label: 'Menú semanal',        text: '#7c3aed' },
  recomendaciones: { bg: '#fef3c7', border: '#f59e0b', label: 'Recomendaciones',     text: '#d97706' },
};

type DescPart = { text: string; color?: string };

const LAYOUTS: {
  value: PageLayoutOption;
  descParts: DescPart[];
  pages: { label: string; blocks: ContentBlock[] }[];
}[] = [
  {
    value: 'layout1',
    descParts: [
      { text: 'Hoja 1: ' },
      { text: 'Tabla de porciones', color: BLOCK_COLORS.porciones.text },
      { text: ' + ' },
      { text: 'Menú semanal', color: BLOCK_COLORS.menu.text },
      { text: '  ·  Hoja 2: ' },
      { text: 'Recomendaciones', color: BLOCK_COLORS.recomendaciones.text },
    ],
    pages: [
      { label: 'Hoja 1', blocks: ['porciones', 'menu'] },
      { label: 'Hoja 2', blocks: ['recomendaciones'] },
    ],
  },
  {
    value: 'layout2',
    descParts: [
      { text: 'Hoja 1: ' },
      { text: 'Menú semanal', color: BLOCK_COLORS.menu.text },
      { text: '  ·  Hoja 2: ' },
      { text: 'Porciones', color: BLOCK_COLORS.porciones.text },
      { text: ' + ' },
      { text: 'Recomendaciones', color: BLOCK_COLORS.recomendaciones.text },
    ],
    pages: [
      { label: 'Hoja 1', blocks: ['menu'] },
      { label: 'Hoja 2', blocks: ['porciones', 'recomendaciones'] },
    ],
  },
  {
    value: 'layout3',
    descParts: [
      { text: 'Hoja 1: ' },
      { text: 'Menú semanal', color: BLOCK_COLORS.menu.text },
      { text: '  ·  Hoja 2: ' },
      { text: 'Recomendaciones', color: BLOCK_COLORS.recomendaciones.text },
      { text: '  ·  Hoja 3: ' },
      { text: 'Porciones', color: BLOCK_COLORS.porciones.text },
    ],
    pages: [
      { label: 'Hoja 1', blocks: ['menu'] },
      { label: 'Hoja 2', blocks: ['recomendaciones'] },
      { label: 'Hoja 3', blocks: ['porciones'] },
    ],
  },
];

const Block: React.FC<{ type: ContentBlock }> = ({ type }) => {
  const c = BLOCK_COLORS[type];

  if (type === 'recomendaciones') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', flex: 1 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ backgroundColor: c.bg, borderRadius: '2px', border: `0.75px solid ${c.border}` }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      backgroundColor: c.bg,
      borderRadius: '2px',
      border: `0.75px solid ${c.border}`,
    }} />
  );
};

const MiniPage: React.FC<{ label: string; blocks: ContentBlock[]; active: boolean }> = ({ label, blocks, active }) => {
  const accent = active ? '#10b981' : '#94a3b8';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <div style={{
        width: '52px',
        height: '50px',
        border: `1.5px solid ${active ? '#10b981' : '#cbd5e1'}`,
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ height: '4px', backgroundColor: accent, opacity: 0.4, flexShrink: 0 }} />
        <div style={{ padding: '3px 4px', display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          {blocks.map((b, i) => <Block key={i} type={b} />)}
        </div>
        <div style={{ height: '3px', backgroundColor: accent, opacity: 0.25, flexShrink: 0 }} />
      </div>
      <span style={{ fontSize: '8px', color: accent, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
};

export const MenuDesignTemplatesPageLayout: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Layout de Hojas</label>
      <p className="text-[11px] text-slate-400">Define cómo se distribuyen los contenidos entre las páginas del PDF.</p>
      <div className="flex flex-col gap-2">
        {LAYOUTS.map(opt => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-xl border text-left transition-all ${
                active ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                {opt.pages.map(p => (
                  <MiniPage key={p.label} label={p.label} blocks={p.blocks} active={active} />
                ))}
              </div>
              <span className="text-xs font-medium leading-snug text-slate-500 min-w-0 break-words">
                {opt.descParts.map((part, i) =>
                  part.color
                    ? <span key={i} style={{ color: part.color, fontWeight: 600 }}>{part.text}</span>
                    : <span key={i}>{part.text}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
