import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { VisualThemeConfig, PageLayoutOption, MenuTemplateDesign } from '../../types';
import { DEFAULT_VISUAL_THEME } from '../../types';
import { MenuDesignTemplatesPageLayout } from './MenuDesignTemplatesPageLayout';
import { PALETTES } from './menu_css_templates/menuThemes';
import type { Palette } from './menu_css_templates/menuThemes';

export interface MenuDesignConfig {
  templateDesign: MenuTemplateDesign;
  pageLayout: PageLayoutOption;
  visualTheme: VisualThemeConfig;
}

interface MenuDesignPanelProps {
  templateDesign: MenuTemplateDesign;
  pageLayout: PageLayoutOption;
  visualTheme: VisualThemeConfig;
  onChange: (updates: Partial<MenuDesignConfig>) => void;
}

export const MenuDesignPanel: React.FC<MenuDesignPanelProps> = ({
  templateDesign,
  pageLayout,
  visualTheme,
  onChange,
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const updateVisualTheme = (next: VisualThemeConfig) => {
    onChange({ visualTheme: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Personaliza la apariencia del PDF exportado. Elige un tema, paleta de colores, fuente y escala de texto.
      </p>

      {/* Two-column layout on md+ screens */}
      <div className="flex flex-col md:flex-row md:gap-0">

        {/* ── Columna izquierda: Tema ── */}
        <div className="md:w-1/2 min-w-0 space-y-5 md:pr-5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tema</h3>

          {/* Selector de tema */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Estilo</label>
            <div className="flex gap-3">
              {(['original', 'minimalista'] as const).map(themeId => {
                const isActive = visualTheme.theme === themeId;
                const firstPalette = PALETTES[themeId][0];
                return (
                  <button
                    key={themeId}
                    onClick={() => {
                      const defaultPalette = PALETTES[themeId][0];
                      const next: VisualThemeConfig = {
                        ...visualTheme,
                        theme: themeId,
                        colors: { primary: defaultPalette.primary, secondary: defaultPalette.secondary, tertiary: defaultPalette.tertiary },
                        paletteId: defaultPalette.id,
                      };
                      updateVisualTheme(next);
                    }}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow-sm"
                      style={{ backgroundColor: firstPalette.primary }}
                    />
                    <span className="capitalize">{themeId === 'original' ? 'Original' : 'Minimalista'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paletas predefinidas */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Paleta de Color</label>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
              {PALETTES[visualTheme.theme].map((palette: Palette) => {
                const isActive = visualTheme.paletteId === palette.id;
                return (
                  <button
                    key={palette.id}
                    title={palette.name}
                    onClick={() => {
                      const next: VisualThemeConfig = {
                        ...visualTheme,
                        colors: { primary: palette.primary, secondary: palette.secondary, tertiary: palette.tertiary },
                        paletteId: palette.id,
                      };
                      updateVisualTheme(next);
                    }}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      isActive ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex gap-1">
                      <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: palette.primary }} />
                      <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: palette.secondary }} />
                      <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: palette.tertiary }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-none">{palette.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colores avanzados */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setColorPickerOpen(o => !o)}
              className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-600 uppercase tracking-wide"
            >
              <span>▸ Personalizar colores</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${colorPickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {colorPickerOpen && (
              <div className="p-4 space-y-3 bg-white">
                {(
                  [
                    { key: 'primary',   label: 'Color primario'   },
                    { key: 'secondary', label: 'Color secundario' },
                    { key: 'tertiary',  label: 'Color terciario'  },
                  ] as { key: keyof VisualThemeConfig['colors']; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={visualTheme.colors[key]}
                      onChange={e => {
                        updateVisualTheme({
                          ...visualTheme,
                          colors: { ...visualTheme.colors, [key]: e.target.value },
                          paletteId: 'custom',
                        });
                      }}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <label className="text-xs text-slate-600 font-medium w-32 flex-shrink-0">{label}</label>
                    <input
                      type="text"
                      value={visualTheme.colors[key]}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                          updateVisualTheme({
                            ...visualTheme,
                            colors: { ...visualTheme.colors, [key]: val },
                            paletteId: 'custom',
                          });
                        }
                      }}
                      maxLength={7}
                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fuente */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fuente</label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'sans',     label: 'Sans',      hint: 'Arial / Helvetica' },
                  { value: 'serif',    label: 'Serif',     hint: 'Georgia' },
                  { value: 'humanist', label: 'Humanista', hint: 'Trebuchet MS' },
                ] as { value: VisualThemeConfig['font']; label: string; hint: string }[]
              ).map(opt => (
                <button
                  key={opt.value}
                  title={opt.hint}
                  onClick={() => updateVisualTheme({ ...visualTheme, font: opt.value })}
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    visualTheme.font === opt.value
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Escala de texto */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Escala de Texto</label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'compact',  label: 'Compacto'  },
                  { value: 'normal',   label: 'Normal'    },
                  { value: 'spacious', label: 'Espacioso' },
                ] as { value: VisualThemeConfig['sizeScale']; label: string }[]
              ).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateVisualTheme({ ...visualTheme, sizeScale: opt.value })}
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    visualTheme.sizeScale === opt.value
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        {/* Horizontal on mobile, vertical on desktop */}
        <div className="my-5 md:my-0 md:mx-5 border-t md:border-t-0 md:border-l border-slate-200" />

        {/* ── Columna derecha: Layout ── */}
        <div className="md:w-1/2 min-w-0 space-y-5 md:pl-0">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Layout</h3>

          {/* Grid semanal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Grid Semanal</label>
            <p className="text-[11px] text-slate-400">Define cómo se distribuyen los días de la semana en el PDF.</p>
            <div className="flex gap-2">
              {([
                { value: '3col', label: '3 columnas', desc: 'Lun-Mar-Mié / Jue-Vie-Sáb' },
                { value: '4col', label: '4 columnas', desc: 'Lun-Mar-Mié-Jue / Vie-Sáb + split' },
              ] as { value: string; label: string; desc: string }[]).map(opt => {
                const isActive = opt.value === '4col' ? templateDesign.endsWith('_4col') : !templateDesign.endsWith('_4col');
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const base = templateDesign.replace('_4col', '') as MenuTemplateDesign;
                      const next = (opt.value === '4col' ? `${base}_4col` : base) as MenuTemplateDesign;
                      onChange({ templateDesign: next });
                    }}
                    className={`flex-1 flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plantilla V1 / V2 (domingo) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Formato del Domingo</label>
            <div className="flex gap-2">
              {([
                { value: 'v1', label: 'V1 · Día Libre', desc: 'Solo nota de día libre' },
                { value: 'v2', label: 'V2 · Completo',  desc: 'Domingo con menú completo' },
              ] as { value: string; label: string; desc: string }[]).map(opt => {
                const isV2 = templateDesign.startsWith('plantilla_v2');
                const isActive = opt.value === 'v2' ? isV2 : !isV2;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const is4col = templateDesign.endsWith('_4col');
                      const base = opt.value === 'v2' ? 'plantilla_v2' : 'plantilla_v1';
                      const next = (is4col ? `${base}_4col` : base) as MenuTemplateDesign;
                      onChange({ templateDesign: next });
                    }}
                    className={`flex-1 flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout de hojas */}
          <MenuDesignTemplatesPageLayout
            value={pageLayout}
            onChange={v => onChange({ pageLayout: v })}
          />
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() =>
          onChange({ visualTheme: DEFAULT_VISUAL_THEME })
        }
        className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
      >
        Restaurar diseño por defecto
      </button>
    </div>
  );
};
