import React from 'react';
import type { MenuFooterConfig, MenuSectionTitles } from '../../types';
import { DEFAULT_SECTION_TITLES } from '../../types';
import { store } from '../../services/store';
import { getThemeStyles } from './menu_css_templates/menuThemes';
import type { ThemeStyles } from './menu_css_templates/menuThemes';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface MealPortions {
  label?: string;
  lacteos: number;
  vegetales: number;
  frutas: number;
  cereales: number;
  carnes: number;
  grasas: number;
}

export interface DayMeal {
  title: string;
  label?: string;
}

export interface MenuDay {
  desayuno: DayMeal;
  refaccion1: DayMeal;
  almuerzo: DayMeal;
  refaccion2: DayMeal;
  cena: DayMeal;
  mealsOrder?: string[];
}

// ✅ Reemplaza el DomingoData anterior
export interface DomingoData {
  note: string;
  hydration: string;
}

// ✅ Nuevo — domingo con tiempos de comida (plantilla v2)
export interface DomingoV2 extends MenuDay {
  note?: string;
  hydration?: string;
}

export interface MenuRecommendations {
  preparacion: string[];
  restricciones: string[];
  habitos: string[];
  organizacion: string[];
}

// ✅ Nuevo helper
export function isDomingoV2(domingo: DomingoData | DomingoV2): domingo is DomingoV2 {
  return 'mealsOrder' in domingo || Object.keys(domingo).some(
    k => !['note', 'hydration'].includes(k)
  );
}

export interface MenuPlanData {
  patient: {
    name: string;
    age: number;
    weight: number;
    height: number;
    fatPct: number;
  };
  kcal: number;
  portions: {
    lacteos: number;
    vegetales: number;
    frutas: number;
    cereales: number;
    carnes: number;
    grasas: number;
    byMeal: Record<string, MealPortions>;
  };
  weeklyMenu: {
    lunes: MenuDay;
    martes: MenuDay;
    miercoles: MenuDay;
    jueves: MenuDay;
    viernes: MenuDay;
    sabado: MenuDay;
    domingo: DomingoData; // ✅ Siempre V1 (nota + hidratación)
    domingoV2?: DomingoV2; // ✅ Siempre V2 (tiempos de comida)
    domingoMode?: 'libre' | 'completo';
  };
  recommendations?: MenuRecommendations;
  sectionTitles?: MenuSectionTitles;
  nutritionist: {
    name: string;
    professionalTitle: string;
    title: string;
    licenseNumber: string;
    whatsapp: string;
    personalPhone?: string;
    email: string;
    instagram: string;
    website: string;
    address?: string;
    avatar: string;
    logoUrl?: string;
    footerConfig?: MenuFooterConfig;
  };
}

// ─── Constants ─────────────────────────────────────────────────────────────────
type MealKey = 'desayuno' | 'refaccion1' | 'almuerzo' | 'refaccion2' | 'cena';
type WeekDayKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

const MEAL_KEYS: MealKey[] = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
const MEAL_LABELS: Record<MealKey, string> = {
  desayuno:  'DESAYUNO',
  refaccion1: 'REFACCIÓN 1',
  almuerzo:  'ALMUERZO',
  refaccion2:  'REFACCIÓN 2',
  cena:      'CENA',
};

const WEEKDAY_KEYS: WeekDayKey[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const WEEKDAY_LABELS: Record<WeekDayKey, string> = {
  lunes: 'LUNES', martes: 'MARTES', miercoles: 'MIÉRCOLES',
  jueves: 'JUEVES', viernes: 'VIERNES', sabado: 'SÁBADO',
};

const PORTION_GROUPS: { key: keyof MealPortions; label: string; emoji: string }[] = [
  { key: 'lacteos',   label: 'LÁCTEOS',   emoji: '🥛' },
  { key: 'vegetales', label: 'VEGETALES', emoji: '🥦' },
  { key: 'frutas',    label: 'FRUTAS',    emoji: '🍎' },
  { key: 'cereales',  label: 'CEREALES',  emoji: '🌾' },
  { key: 'carnes',    label: 'CARNES',    emoji: '🥩' },
  { key: 'grasas',    label: 'GRASAS',    emoji: '🫒' },
];

const PRINT_STYLES = `
  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; }
    body > * { display: none !important; }
    #menu-print-area {
      display: block !important;
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 210mm !important; height: 296mm !important;
      overflow: hidden !important;
    }
  }
`;

const TEMPLATE_STYLES = `
  .menu-template-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  @media print {
    .menu-template-container {
      gap: 0 !important;
    }
  }
  .html2pdf__container .menu-template-container,
  .html2pdf__page-break .menu-template-container {
    gap: 0 !important;
  }
`;

// ─── Sub-components ────────────────────────────────────────────────────────────

const DayCard: React.FC<{ label: string; day: MenuDay; isFullWidth?: boolean }> = ({ label, day, isFullWidth }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  const mealKeys = day.mealsOrder || MEAL_KEYS;
  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: ts.cardRadius, overflow: 'hidden',
      flex: isFullWidth ? 'none' : '1', width: isFullWidth ? '100%' : 'auto', minWidth: 0,
    }}>
      <div style={{
        backgroundColor: ts.colors.primary, color: '#fff', textAlign: 'center',
        padding: '5px 4px', fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: '1px',
      }}>
        {label}
      </div>
      <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {mealKeys.map(mealKey => {
          const m = (day as any)[mealKey] as DayMeal;
          if (!m || !m.title?.trim()) return null;
          const displayLabel = m.label || (MEAL_LABELS[mealKey as MealKey] || mealKey);
          return (
            <div key={mealKey}>
              <div style={{ color: ts.colors.primary, fontSize: `${8.5 * ts.fontSizeMultiplier}px`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>
                {displayLabel}
              </div>
              <div style={{ color: '#1e293b', fontSize: `${8 * ts.fontSizeMultiplier}px`, fontWeight: 600, lineHeight: '1.3', whiteSpace: 'pre-line' }}>
                {m.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Header: sin flex para centrado vertical, usa padding explícito ─────────────
const Header: React.FC<{ nutritionist: MenuPlanData['nutritionist']; planTitle?: string }> = ({ nutritionist, planTitle }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  const titleParts = (planTitle || DEFAULT_SECTION_TITLES.planTitle).split('\n');
  const headerStyle: React.CSSProperties = ts.headerBorderBottom !== 'none'
    ? { width: '100%', borderCollapse: 'collapse', marginBottom: '12px', borderBottom: ts.headerBorderBottom, paddingBottom: '8px' }
    : { width: '100%', borderCollapse: 'collapse', marginBottom: '12px' };
  return (
  <table style={headerStyle}>
    <tbody>
      <tr>
        {/* Left: logo o nombre */}
        <td style={{ verticalAlign: 'middle', padding: 0 }}>
          {nutritionist.logoUrl ? (
            <img src={nutritionist.logoUrl} alt="Logo"
              style={{ height: '50px', maxWidth: '310px', objectFit: 'contain', display: 'block' }} />
          ) : (
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  {/* Avatar circle */}
                  <td style={{ verticalAlign: 'middle', paddingRight: '10px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      backgroundColor: ts.colors.primary, overflow: 'hidden',
                      textAlign: 'center', lineHeight: '42px',
                    }}>
                      {nutritionist.avatar ? (
                        <img src={nutritionist.avatar} alt="avatar"
                          style={{ width: '42px', height: '42px', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800, lineHeight: '42px' }}>
                          {(nutritionist.name || 'N').charAt(0)}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Name + title */}
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 900, fontSize: `${20 * ts.fontSizeMultiplier}px`, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                      {(nutritionist.name || '').toUpperCase()}
                    </div>
                    <div style={{ fontSize: `${8 * ts.fontSizeMultiplier}px`, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '3px' }}>
                      {(nutritionist.title || '').toUpperCase()}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </td>
        {/* Right: plan title */}
        <td style={{ verticalAlign: 'middle', textAlign: 'right', padding: 0 }}>
          {titleParts[0] && (
            <div style={{ color: ts.colors.primary, fontSize: `${15 * ts.fontSizeMultiplier}px`, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.15 }}>
              {titleParts[0]}
            </div>
          )}
          {titleParts[1] && (
            <div style={{ color: ts.colors.primary, fontSize: `${13 * ts.fontSizeMultiplier}px`, fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.15 }}>
              {titleParts[1]}
            </div>
          )}
        </td>
      </tr>
    </tbody>
  </table>
  );
};

// ── PatientBar: tabla en lugar de flex — verticalAlign resuelve el centrado ────
const PatientBar: React.FC<{ patient: MenuPlanData['patient']; kcal: number }> = ({ patient, kcal }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  return (
  <table style={{
    width: '100%', borderCollapse: 'collapse',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    marginBottom: '12px', fontSize: `${9 * ts.fontSizeMultiplier}px`,
  }}>
    <tbody>
      <tr>
        <td style={{ padding: '7px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>PACIENTE: </span>
          <span style={{ color: '#0f172a', fontWeight: 800 }}>{patient?.name || 'N/A'}</span>
        </td>
        <td style={{ padding: '7px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>EDAD: </span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{patient?.age || 0} años</span>
        </td>
        <td style={{ padding: '7px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>PESO: </span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{patient?.weight || 0} kg</span>
        </td>
        <td style={{ padding: '7px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>GRASA: </span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{patient?.fatPct || 0}%</span>
        </td>
        {/* META — celda separada con borde izquierdo y fondo de acento */}
        <td style={{
          padding: '0', verticalAlign: 'middle', textAlign: 'right',
          borderLeft: '1px solid #e2e8f0', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#64748b', fontWeight: 600, padding: '7px 8px 7px 12px', display: 'inline-block' }}>META:</span>
          <span style={{
            color: ts.colors.primary, fontWeight: 900, fontSize: `${10 * ts.fontSizeMultiplier}px`,
            backgroundColor: ts.colors.tertiary, borderLeft: `1px solid ${ts.colors.tertiaryBorder}`,
            padding: '7px 15px', display: 'inline-block',
          }}>
            {kcal.toLocaleString()} kcal
          </span>
        </td>
      </tr>
    </tbody>
  </table>
  );
};

// ── PortionsTable: ya era tabla, solo ajuste de verticalAlign en celdas ────────
const PortionsTable: React.FC<{ portions: MenuPlanData['portions']; weeklyMenu: MenuPlanData['weeklyMenu'] }> = ({ portions, weeklyMenu }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  const totals: MealPortions = {
    lacteos: portions.lacteos, vegetales: portions.vegetales, frutas: portions.frutas,
    cereales: portions.cereales, carnes: portions.carnes, grasas: portions.grasas,
  };
  const mealOrder = weeklyMenu.lunes.mealsOrder || MEAL_KEYS;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: `${10 * ts.fontSizeMultiplier}px`, fontWeight: 800, color: ts.colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
        GUÍA DIARIA DE PORCIONES
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${8 * ts.fontSizeMultiplier}px` }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '14%', verticalAlign: 'middle' }}>
              TIEMPO
            </th>
            {PORTION_GROUPS.map(g => (
              <th key={g.key} style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', verticalAlign: 'middle' }}>
                {g.emoji} {g.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mealOrder.map((mealKey, i) => {
            const row = portions.byMeal[mealKey];
            if (!row) return null;
            const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
            const firstDayMeal = (weeklyMenu.lunes as any)[mealKey] as DayMeal;
            const row2 = portions.byMeal[mealKey];
            const label = firstDayMeal?.label || row2?.label || (MEAL_LABELS[mealKey as MealKey] || mealKey);
            return (
              <tr key={mealKey} style={{ backgroundColor: bg }}>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                  {label}
                </td>
                {PORTION_GROUPS.map(g => (
                  <td key={g.key} style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: row[g.key] > 0 ? '#0f172a' : '#cbd5e1', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                    {row[g.key] > 0 ? row[g.key] : '—'}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr style={{ backgroundColor: ts.colors.tertiary, borderTop: `2px solid ${ts.colors.tertiaryBorder}` }}>
            <td style={{ padding: '5px 8px', fontWeight: 800, color: ts.colors.primary, fontSize: `${8 * ts.fontSizeMultiplier}px`, verticalAlign: 'middle' }}>TOTAL PORCIONES</td>
            {PORTION_GROUPS.map(g => (
              <td key={g.key} style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800, color: ts.colors.primary, fontSize: `${9 * ts.fontSizeMultiplier}px`, verticalAlign: 'middle' }}>
                {totals[g.key]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ── DomingoRow: tabla en lugar de flex — elimina todos los alignSelf/alignItems ─
const DomingoRow: React.FC<{ domingo: DomingoData }> = ({ domingo }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  return (
  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: ts.cardRadius, overflow: 'hidden' }}>
    <tbody>
      <tr>
        {/* DOMINGO label */}
        <td style={{
          backgroundColor: ts.colors.secondary, color: '#fff',
          padding: '10px 14px', fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`,
          letterSpacing: '1px', whiteSpace: 'nowrap', verticalAlign: 'middle',
          width: '1%',
        }}>
          DOMINGO
        </td>
        {/* Note */}
        <td style={{ padding: '8px 14px', verticalAlign: 'middle' }}>
          <div style={{ fontSize: `${7.5 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
            DÍA LIBRE / OBSERVACIONES:
          </div>
          <div style={{ fontSize: `${8.5 * ts.fontSizeMultiplier}px`, color: '#334155', fontWeight: 600 }}>
            {domingo.note}
          </div>
        </td>
        {/* Hydration */}
        <td style={{
          padding: '8px 14px', textAlign: 'right', verticalAlign: 'middle',
          borderLeft: '1px solid #f1f5f9', whiteSpace: 'nowrap', width: '1%',
        }}>
          <div style={{ fontSize: `${7 * ts.fontSizeMultiplier}px`, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>
            META HIDRATACIÓN
          </div>
          <div style={{ fontSize: `${9 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 800 }}>
            💧 {domingo.hydration}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  );
};

// ── Footer ─────────────────────────────────────────────────────────────────────
const Footer: React.FC<{ nutritionist: MenuPlanData['nutritionist'] }> = ({ nutritionist }) => {
  const cfg = nutritionist.footerConfig;
  const show = (key: keyof MenuFooterConfig): boolean => !cfg || cfg[key];

  // ── Row 1 left: bold name + specialty ──
  const nameLeft: string[] = [];
  if (show('showName') && nutritionist.name) {
    const prefix = (nutritionist.professionalTitle || '').toUpperCase();
    nameLeft.push(prefix ? `${prefix} ${nutritionist.name.toUpperCase()}` : nutritionist.name.toUpperCase());
  }
  if (show('showSpecialty') && nutritionist.title) nameLeft.push(`- ${nutritionist.title.toUpperCase()}`);

  // ── Row 2: license first, then contact fields, address last ──
  const contactItems: { label: string; value: string }[] = [];
  if (show('showLicense') && nutritionist.licenseNumber)       contactItems.push({ label: 'Colegiado #',   value: nutritionist.licenseNumber });
  if (show('showClinicPhone') && nutritionist.whatsapp)        contactItems.push({ label: 'Tel. Clínica',  value: nutritionist.whatsapp });
  if (show('showPersonalPhone') && nutritionist.personalPhone) contactItems.push({ label: 'Tel. Personal', value: nutritionist.personalPhone });
  if (show('showEmail') && nutritionist.email)                 contactItems.push({ label: 'Email',         value: nutritionist.email });
  if (show('showInstagram') && nutritionist.instagram)         contactItems.push({ label: 'Instagram',     value: nutritionist.instagram });
  if (show('showAddress') && nutritionist.address)             contactItems.push({ label: 'Dirección',     value: nutritionist.address });

  const showWebsite = show('showWebsite') && !!nutritionist.website;

  return (
    <div style={{ width: '100%' }}>
      {/* Row 1: bold name/specialty, website inline after (not bold) */}
      {(nameLeft.length > 0 || showWebsite) && (
        <div style={{ fontSize: '8px', color: '#1e293b', marginBottom: '2px' }}>
          <span style={{ fontWeight: 800 }}>{nameLeft.join(' ')}</span>
          {showWebsite && (
            <>
              <span style={{ fontWeight: 800, color: '#1e293b', margin: '0 6px' }}>|</span>
              <span style={{ fontWeight: 400, color: '#475569', textTransform: 'uppercase' }}>
                {nutritionist.website}
              </span>
            </>
          )}
        </div>
      )}
      {/* Row 2: colegiado + contact + address */}
      {contactItems.length > 0 && (
        <table style={{ borderCollapse: 'collapse', fontSize: '7.5px', color: '#475569' }}>
          <tbody>
            <tr>
              {contactItems.map((item, i) => (
                <td
                  key={i}
                  style={{ paddingRight: i < contactItems.length - 1 ? '14px' : undefined, verticalAlign: 'middle', whiteSpace: 'nowrap' }}
                >
                  {item.label}: {item.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Shared A4 wrapper ─────────────────────────────────────────────────────────
// Uses a full-height table so the footer is always at the bottom of the 296mm
// canvas — works correctly with both screen preview and html2pdf export.

const A4Wrapper: React.FC<{ id?: string; children: React.ReactNode; footer: React.ReactNode }> = ({ id = "menu-print-area", children, footer }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  return (
  <div
    id={id}
    style={{
      fontFamily: ts.fontFamily,
      backgroundColor: '#ffffff',
      width: '210mm',
      height: '296mm',
      maxheight: '296mm',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'table',
      tableLayout: 'fixed',
      pageBreakAfter: 'always',
      breakAfter: 'page',
    }}
  >
    {/* Content row — grows to fill available space */}
    <div
      id="menu-print-area-scaler"
      style={{
        display: 'table-row',
        height: '100%',
      }}
    >
      <div style={{
        fontSize: '10px',
        lineHeight: '1.4',
        padding: '14px 20px 8px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'table-cell',
        verticalAlign: 'top',
      }}>
        {children}
      </div>
    </div>

    {/* Footer row — fixed height, always at bottom */}
    <div style={{ display: 'table-row' }}>
      <div style={{
        display: 'table-cell',
        borderTop: '1px solid #e2e8f0',
        padding: '8px 20px 20px 20px',
        boxSizing: 'border-box',
        verticalAlign: 'top',
        backgroundColor: '#ffffff',
      }}>
        {footer}
      </div>
    </div>
  </div>
  );
};


// ─── RecommendationsPage: Segunda hoja con estética de tarjetas ────────────────
const RecommendationsPage: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  const cardStyle: React.CSSProperties = {
    backgroundColor: ts.recsCardBackground,
    border: ts.recsCardBorder,
    borderRadius: ts.recsCardRadius,
    boxShadow: ts.recsCardShadow,
    padding: '16px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: `${14 * ts.fontSizeMultiplier}px`,
    fontWeight: 800,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '8px',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  };

  const itemIconStyle = (color: string): React.CSSProperties => ({
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
    fontSize: `${10 * ts.fontSizeMultiplier}px`,
    color: '#fff',
  });

  const itemContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const itemTitleStyle: React.CSSProperties = {
    fontSize: `${10 * ts.fontSizeMultiplier}px`,
    fontWeight: 700,
    color: '#1e293b',
  };

  const itemDescStyle: React.CSSProperties = {
    fontSize: `${9 * ts.fontSizeMultiplier}px`,
    color: '#64748b',
    lineHeight: '1.3',
  };

  // Default values if recommendations are missing
  const defaultRecs: MenuRecommendations = {
    preparacion: [
      "Priorizar alimentos cocidos, al vapor, al horno o a la plancha. Evitar frituras y empanizados.",
      "Medir porciones con tazas y cucharas medidoras para mantener control energético semanal.",
      "Usar stevia o endulzantes naturales sin calorías.",
      "Priorizar carbohidratos complejos como arroz integral, camote, avena y legumbres.",
      "Incluir grasas saludables en porciones pequeñas: aceite de oliva, aguacate, semillas o nueces."
    ],
    restricciones: [
      "Evitar harinas refinadas.",
      "Evitar quesos procesados o altos en grasa. Preferir ricotta, requesón, queso panela.",
      "Evitar el uso de consomé. Preferir condimentar con hierbas como orégano, albahaca, ajo, cebolla y cúrcuma.",
      "Evitar bebidas azucaradas, repostería, bebidas alcohólicas, jugos procesados, pasteles o alimentos con azúcar añadida."
    ],
    habitos: [
      "Incluir vegetales al menos 2 veces al día (crudos o cocidos).",
      "Adecuada hidratación durante el día. Consumir mínimo 8 vasos de agua pura al día.",
      "Realizar planificación de ejercicio enfocado en fuerza y resistencia 2-3 veces por semana para conservar masa muscular.",
      "Priorizar descanso y sueño: dormir un mínimo de 7 horas por noche mejora regulación hormonal y la recuperación muscular.",
      "Si presenta ansiedad por comer, utilizar infusiones, gelatina sin azúcar o vegetales crudos con limón y pepita como snacks."
    ],
    organizacion: [
      "No dejar pasar más de 3-4 horas sin comer para evitar picos de hambre o ansiedad.",
      "Organizar los tiempos de comida (en caso deba viajar o tenga que salir de casa por trabajo y/o entreno, agilizar dejando porciones listas y refrigeradas para el día).",
      "El día domingo puede tener 1 tiempo de comida libre (por ejemplo el almuerzo), pero procurar mantener las porciones de comida."
    ]
  };

  const recs = data.recommendations || defaultRecs;
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;

  return (
    <A4Wrapper id="recommendations-page" footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} />

      <div style={{ fontSize: `${12 * ts.fontSizeMultiplier}px`, fontWeight: 800, color: ts.colors.primary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '15px', textAlign: 'center' }}>
        {titles.page2Title}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '15px',
        height: 'calc(100% - 160px)',
        maxHeight: 'calc(296mm - 280px)',
        overflow: 'hidden'
      }}>
        {/* Sección 1: Preparación */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: '18px' }}>{titles.preparacionEmoji}</span> {titles.preparacionTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recs.preparacion.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 900, flexShrink: 0, width: '18px', display: 'flex', justifyContent: 'center' }}>✓</div>
                <div style={itemContentStyle}>
                  <div style={itemDescStyle}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 2: Restricciones */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: '18px' }}>{titles.restriccionesEmoji}</span> {titles.restriccionesTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recs.restricciones.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ef4444', marginTop: '6px', flexShrink: 0 }} />
                <div style={{ ...itemDescStyle, color: '#334155', fontWeight: 500 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 3: Hábitos */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: '18px' }}>{titles.habitosEmoji}</span> {titles.habitosTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recs.habitos.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 900, flexShrink: 0, width: '18px', display: 'flex', justifyContent: 'center' }}>✓</div>
                <div style={{ ...itemDescStyle, color: '#334155', fontWeight: 500 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 4: Organización */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: '18px' }}>{titles.organizacionEmoji}</span> {titles.organizacionTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recs.organizacion.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#059669', marginTop: '6px', flexShrink: 0 }} />
                <div style={{ ...itemDescStyle, color: '#334155', fontWeight: 500 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </A4Wrapper>
  );
};

// ─── Plantilla V1: Domingo día libre ──────────────────────────────────────────
export const MenuTemplateV1: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  return (
  <div className="menu-template-container">
    <style>{PRINT_STYLES}</style>
    <style>{TEMPLATE_STYLES}</style>
    <A4Wrapper id="menu-page-1" footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} planTitle={(data.sectionTitles || DEFAULT_SECTION_TITLES).planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} />
      <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />
      <div style={{ fontSize: `${10 * ts.fontSizeMultiplier}px`, fontWeight: 800, color: ts.colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        MENÚ SEMANAL
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
        {(['lunes', 'martes', 'miercoles'] as WeekDayKey[]).map(day =>
          <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {(['jueves', 'viernes', 'sabado'] as WeekDayKey[]).map(day =>
          <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
        )}
      </div>
      <DomingoRow domingo={data.weeklyMenu.domingo as DomingoData} />
    </A4Wrapper>

    {/* Segunda Hoja */}
    <RecommendationsPage data={data} />
  </div>
  );
};

// ─── Plantilla V2: Domingo como día normal (grid 3+4) ─────────────────────────
export const MenuTemplateV2: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const ts: ThemeStyles = getThemeStyles(store.getMenuTemplate()?.visualTheme);
  const domingoV1 = data.weeklyMenu.domingo;
  const domingoV2 = data.weeklyMenu.domingoV2;

  return (
    <div className="menu-template-container">
      <style>{PRINT_STYLES}</style>
      <style>{TEMPLATE_STYLES}</style>
      <A4Wrapper id="menu-page-1" footer={<Footer nutritionist={data.nutritionist} />}>
        <Header nutritionist={data.nutritionist} planTitle={(data.sectionTitles || DEFAULT_SECTION_TITLES).planTitle} />
        <PatientBar patient={data.patient} kcal={data.kcal} />
        <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />
        <div style={{ fontSize: `${10 * ts.fontSizeMultiplier}px`, fontWeight: 800, color: ts.colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          MENÚ SEMANAL
        </div>

        {/* Fila 1: Lunes – Miércoles */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          {(['lunes', 'martes', 'miercoles'] as WeekDayKey[]).map(day =>
            <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
          )}
        </div>

        {/* Fila 2: Jueves – Sábado + Domingo como 4to card */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          {(['jueves', 'viernes', 'sabado'] as WeekDayKey[]).map(day =>
            <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
          )}
          {domingoV2 ? (
            <DayCard label="DOMINGO" day={domingoV2} />
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: ts.cardRadius, overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{
                backgroundColor: ts.colors.secondary, color: '#fff', textAlign: 'center',
                padding: '5px 4px', fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: '1px',
              }}>
                DOMINGO
              </div>
              <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ color: '#334155', fontSize: `${8 * ts.fontSizeMultiplier}px`, fontWeight: 600, lineHeight: '1.3', whiteSpace: 'pre-line' }}>
                  {domingoV1.note}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra NOTAS + Hidratación */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: ts.cardRadius, overflow: 'hidden' }}>
          <tbody>
            <tr>
              <td style={{
                backgroundColor: ts.colors.secondary, color: '#fff',
                padding: '10px 14px', fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`,
                letterSpacing: '1px', whiteSpace: 'nowrap', verticalAlign: 'middle',
                width: '1%',
              }}>
                NOTAS
              </td>
              <td style={{ padding: '8px 14px', verticalAlign: 'middle' }}>
                <div style={{ fontSize: `${8.5 * ts.fontSizeMultiplier}px`, color: '#334155', fontWeight: 600 }}>
                  {domingoV2?.note || domingoV1.note}
                </div>
              </td>
              <td style={{
                padding: '8px 14px', textAlign: 'right', verticalAlign: 'middle',
                borderLeft: '1px solid #f1f5f9', whiteSpace: 'nowrap', width: '1%',
              }}>
                <div style={{ fontSize: `${7 * ts.fontSizeMultiplier}px`, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>
                  META HIDRATACIÓN
                </div>
                <div style={{ fontSize: `${9 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 800 }}>
                  💧 {domingoV2?.hydration || domingoV1.hydration}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </A4Wrapper>

      {/* Segunda Hoja */}
      <RecommendationsPage data={data} />
    </div>
  );
};