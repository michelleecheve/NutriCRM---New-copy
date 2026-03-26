import type { VisualThemeConfig, FontFamily, SizeScale } from '../../../types';
import { ORIGINAL_BASE_THEME }    from './theme.original';
import { MINIMALISTA_BASE_THEME } from './theme.minimalista';

// ─── Core token interface ─────────────────────────────────────────────────────
// Todos los valores de salida que los componentes consumen.
// Al agregar un tema nuevo: crear theme.nuevo.ts que implementa ThemeBaseTokens.

export interface ThemeColors {
  primary:        string;
  secondary:      string;
  tertiary:       string;
  tertiaryBorder: string;
}

export interface ThemeBaseTokens {
  colors:             ThemeColors;
  fontFamily:         string;
  cardRadius:         string;   // DayCard, DomingoRow
  cardShadow:         string;
  recsCardRadius:     string;   // cards de RecommendationsPage
  recsCardBorder:     string;
  recsCardShadow:     string;
  recsCardBackground: string;
  headerBorderBottom: string;   // 'none' en original, línea en minimalista
  fontSizeMultiplier: number;
}

// ThemeStyles = ThemeBaseTokens resuelto (lo que devuelve getThemeStyles)
export type ThemeStyles = ThemeBaseTokens;

// ─── Paletas predefinidas ─────────────────────────────────────────────────────

export interface Palette {
  id:             string;
  name:           string;
  primary:        string;
  secondary:      string;
  tertiary:       string;
  tertiaryBorder: string;
}

export const PALETTES: Record<'original' | 'minimalista', Palette[]> = {
  original: [
    { id: 'default',  name: 'Default',  primary: '#0f766e', secondary: '#1e293b', tertiary: '#f0fdf4', tertiaryBorder: '#bbf7d0' },
    { id: 'oceano',   name: 'Océano',   primary: '#0369a1', secondary: '#0f172a', tertiary: '#f0f9ff', tertiaryBorder: '#bae6fd' },
    { id: 'violeta',  name: 'Violeta',  primary: '#7c3aed', secondary: '#1e1b4b', tertiary: '#f5f3ff', tertiaryBorder: '#ddd6fe' },
    { id: 'coral',    name: 'Coral',    primary: '#dc4f3a', secondary: '#1c1917', tertiary: '#fff7f5', tertiaryBorder: '#fecaca' },
    { id: 'dorado',   name: 'Dorado',   primary: '#b45309', secondary: '#1c1917', tertiary: '#fffbeb', tertiaryBorder: '#fde68a' },
  ],
  minimalista: [
    { id: 'pizarra',       name: 'Pizarra',       primary: '#475569', secondary: '#1e293b', tertiary: '#f1f5f9', tertiaryBorder: '#cbd5e1' },
    { id: 'verde_sage',    name: 'Verde Sage',    primary: '#4d7c6f', secondary: '#1e293b', tertiary: '#f0f4f3', tertiaryBorder: '#d1e0de' },
    { id: 'azul_polvo',   name: 'Azul Polvo',    primary: '#4a6fa5', secondary: '#1e293b', tertiary: '#eef3f9', tertiaryBorder: '#c7d7ee' },
    { id: 'marron_calido', name: 'Marrón Cálido', primary: '#7c5c3e', secondary: '#292524', tertiary: '#faf6f1', tertiaryBorder: '#e7ddd3' },
    { id: 'grafito',       name: 'Grafito',       primary: '#374151', secondary: '#111827', tertiary: '#f9fafb', tertiaryBorder: '#e5e7eb' },
  ],
};

// ─── Fuentes y escala ─────────────────────────────────────────────────────────

const FONT_FAMILIES: Record<FontFamily, string> = {
  sans:     "'Helvetica Neue', Arial, sans-serif",
  serif:    "Georgia, 'Times New Roman', serif",
  humanist: "'Trebuchet MS', Verdana, sans-serif",
};

const SIZE_MULTIPLIERS: Record<SizeScale, number> = {
  compact:  0.9,
  normal:   1.0,
  spacious: 1.1,
};

// ─── getThemeStyles ───────────────────────────────────────────────────────────
// Cuando config es undefined o theme === 'original' con defaults → devuelve
// exactamente los mismos valores hardcodeados actuales del template original.

export function getThemeStyles(config?: VisualThemeConfig): ThemeStyles {
  const isMinimalista = config?.theme === 'minimalista';
  const base = isMinimalista ? MINIMALISTA_BASE_THEME : ORIGINAL_BASE_THEME;

  // Colores: usar los del config si existen, si no los del base del tema
  const colors: ThemeColors = config?.colors
    ? {
        primary:        config.colors.primary,
        secondary:      config.colors.secondary,
        tertiary:       config.colors.tertiary,
        // tertiaryBorder: buscar en paleta si paletteId está definido, sino derivar del base
        tertiaryBorder: resolveTertiaryBorder(config),
      }
    : base.colors;

  const fontFamily = FONT_FAMILIES[config?.font ?? 'sans'];
  const fontSizeMultiplier = SIZE_MULTIPLIERS[config?.sizeScale ?? 'normal'];

  return {
    ...base,
    colors,
    fontFamily,
    fontSizeMultiplier,
  };
}

// Resuelve el tertiaryBorder: usa el de la paleta predefinida si paletteId !== 'custom',
// si no usa el tertiaryBorder del base como fallback razonable.
function resolveTertiaryBorder(config: VisualThemeConfig): string {
  const theme = config.theme === 'minimalista' ? 'minimalista' : 'original';
  if (config.paletteId && config.paletteId !== 'custom') {
    const palette = PALETTES[theme].find(p => p.id === config.paletteId);
    if (palette) return palette.tertiaryBorder;
  }
  // Paleta custom: tomar el tertiaryBorder del base del tema como fallback
  const base = theme === 'minimalista' ? MINIMALISTA_BASE_THEME : ORIGINAL_BASE_THEME;
  return base.colors.tertiaryBorder;
}
