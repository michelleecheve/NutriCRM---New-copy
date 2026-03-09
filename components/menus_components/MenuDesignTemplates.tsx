import React from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface MealPortions {
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

export interface DomingoData {
  note: string;
  hydration: string;
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
    domingo: DomingoData;
  };
  nutritionist: {
    name: string;
    title: string;
    licenseNumber: string;
    whatsapp: string;
    personalPhone?: string;
    email: string;
    instagram: string;
    website: string;
    avatar: string;
    logoUrl?: string;
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
      width: 210mm !important; height: 297mm !important;
      overflow: hidden !important;
    }
  }
`;

// ─── Sub-components ────────────────────────────────────────────────────────────

const DayCard: React.FC<{ label: string; day: MenuDay; isFullWidth?: boolean }> = ({ label, day, isFullWidth }) => {
  const mealKeys = day.mealsOrder || MEAL_KEYS;
  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden',
      flex: isFullWidth ? 'none' : '1', width: isFullWidth ? '100%' : 'auto', minWidth: 0,
    }}>
      <div style={{
        backgroundColor: '#0f766e', color: '#fff', textAlign: 'center',
        padding: '5px 4px', fontWeight: 800, fontSize: '9px', letterSpacing: '1px',
      }}>
        {label}
      </div>
      <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {mealKeys.map(mealKey => {
          const m = (day as any)[mealKey] as DayMeal;
          if (!m) return null;
          const displayLabel = m.label || (MEAL_LABELS[mealKey as MealKey] || mealKey);
          return (
            <div key={mealKey}>
              <div style={{ color: '#0f766e', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>
                {displayLabel}
              </div>
              <div style={{ color: '#1e293b', fontSize: '8px', fontWeight: 600, lineHeight: '1.3', whiteSpace: 'pre-line' }}>
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
const Header: React.FC<{ nutritionist: MenuPlanData['nutritionist'] }> = ({ nutritionist }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
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
                      backgroundColor: '#0f766e', overflow: 'hidden',
                      textAlign: 'center', lineHeight: '42px',
                    }}>
                      {nutritionist.avatar ? (
                        <img src={nutritionist.avatar} alt="avatar"
                          style={{ width: '42px', height: '42px', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800, lineHeight: '42px' }}>
                          {nutritionist.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Name + title */}
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                      {nutritionist.name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '3px' }}>
                      {nutritionist.title.toUpperCase()}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </td>
        {/* Right: plan title */}
        <td style={{ verticalAlign: 'middle', textAlign: 'right', padding: 0 }}>
          <div style={{ color: '#0f766e', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.15 }}>
            Plan de Alimentación
          </div>
          <div style={{ color: '#0f766e', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.15 }}>
            Personalizado
          </div>
        </td>
      </tr>
    </tbody>
  </table>
);

// ── PatientBar: tabla en lugar de flex — verticalAlign resuelve el centrado ────
const PatientBar: React.FC<{ patient: MenuPlanData['patient']; kcal: number }> = ({ patient, kcal }) => (
  <table style={{
    width: '100%', borderCollapse: 'collapse',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    marginBottom: '12px', fontSize: '9px',
  }}>
    <tbody>
      <tr>
        <td style={{ padding: '7px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>PACIENTE: </span>
          <span style={{ color: '#0f172a', fontWeight: 800 }}>{patient.name}</span>
        </td>
        <td style={{ padding: '7px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>EDAD: </span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{patient.age} años</span>
        </td>
        <td style={{ padding: '7px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>PESO: </span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{patient.weight} kg</span>
        </td>
        <td style={{ padding: '7px 10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>GRASA: </span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{patient.fatPct}%</span>
        </td>
        {/* META — celda separada con borde izquierdo y fondo verde */}
        <td style={{
          padding: '0', verticalAlign: 'middle', textAlign: 'right',
          borderLeft: '1px solid #e2e8f0', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#64748b', fontWeight: 600, padding: '7px 8px 7px 12px', display: 'inline-block' }}>META:</span>
          <span style={{
            color: '#0f766e', fontWeight: 900, fontSize: '10px',
            backgroundColor: '#f0fdf4', borderLeft: '1px solid #bbf7d0',
            padding: '7px 15px', display: 'inline-block',
          }}>
            {kcal.toLocaleString()} kcal
          </span>
        </td>
      </tr>
    </tbody>
  </table>
);

// ── PortionsTable: ya era tabla, solo ajuste de verticalAlign en celdas ────────
const PortionsTable: React.FC<{ portions: MenuPlanData['portions']; weeklyMenu: MenuPlanData['weeklyMenu'] }> = ({ portions, weeklyMenu }) => {
  const totals: MealPortions = {
    lacteos: portions.lacteos, vegetales: portions.vegetales, frutas: portions.frutas,
    cereales: portions.cereales, carnes: portions.carnes, grasas: portions.grasas,
  };
  const mealOrder = weeklyMenu.lunes.mealsOrder || MEAL_KEYS;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
        GUÍA DIARIA DE PORCIONES
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
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
            const label = firstDayMeal?.label || (MEAL_LABELS[mealKey as MealKey] || mealKey);
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
          <tr style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
            <td style={{ padding: '5px 8px', fontWeight: 800, color: '#0f766e', fontSize: '8px', verticalAlign: 'middle' }}>TOTAL PORCIONES</td>
            {PORTION_GROUPS.map(g => (
              <td key={g.key} style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800, color: '#0f766e', fontSize: '9px', verticalAlign: 'middle' }}>
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
const DomingoRow: React.FC<{ domingo: DomingoData }> = ({ domingo }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
    <tbody>
      <tr>
        {/* DOMINGO label */}
        <td style={{
          backgroundColor: '#1e293b', color: '#fff',
          padding: '10px 14px', fontWeight: 800, fontSize: '9px',
          letterSpacing: '1px', whiteSpace: 'nowrap', verticalAlign: 'middle',
          width: '1%',
        }}>
          DOMINGO
        </td>
        {/* Note */}
        <td style={{ padding: '8px 14px', verticalAlign: 'middle' }}>
          <div style={{ fontSize: '7.5px', color: '#0f766e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
            DÍA LIBRE / OBSERVACIONES:
          </div>
          <div style={{ fontSize: '8.5px', color: '#334155', fontWeight: 600 }}>
            {domingo.note}
          </div>
        </td>
        {/* Hydration */}
        <td style={{
          padding: '8px 14px', textAlign: 'right', verticalAlign: 'middle',
          borderLeft: '1px solid #f1f5f9', whiteSpace: 'nowrap', width: '1%',
        }}>
          <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px' }}>
            META HIDRATACIÓN
          </div>
          <div style={{ fontSize: '9px', color: '#0f766e', fontWeight: 800 }}>
            💧 {domingo.hydration}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
);

// ── Footer: reemplazar span flex del instagram con tabla inline ────────────────
const Footer: React.FC<{ nutritionist: MenuPlanData['nutritionist'] }> = ({ nutritionist }) => (
  <div style={{ width: '100%' }}>
    <div style={{ fontWeight: 800, fontSize: '8px', color: '#1e293b', marginBottom: '2px' }}>
      {nutritionist.title.includes('Lic') || nutritionist.title.includes('Dr')
        ? nutritionist.title.toUpperCase() : 'LICDA.'}{' '}
      {nutritionist.name.toUpperCase()}
      {nutritionist.licenseNumber && ` - NUTRICIONISTA COLEGIADO #${nutritionist.licenseNumber}`}
    </div>
    <table style={{ borderCollapse: 'collapse', fontSize: '7.5px', color: '#475569' }}>
      <tbody>
        <tr>
          {nutritionist.whatsapp && (
            <td style={{ paddingRight: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              Teléfono Clínica: {nutritionist.whatsapp}
            </td>
          )}
          {nutritionist.personalPhone && (
            <td style={{ paddingRight: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              Teléfono Personal: {nutritionist.personalPhone}
            </td>
          )}
          {nutritionist.email && (
            <td style={{ paddingRight: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              Email: {nutritionist.email}
            </td>
          )}
          {nutritionist.instagram && (
            <td style={{ paddingRight: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              Instagram: {nutritionist.instagram}
            </td>
          )}
          {nutritionist.website && (
            <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
              Web: {nutritionist.website}
            </td>
          )}
        </tr>
      </tbody>
    </table>
  </div>
);

// ─── Shared A4 wrapper ─────────────────────────────────────────────────────────
// Uses a full-height table so the footer is always at the bottom of the 297mm
// canvas — works correctly with both screen preview and html2pdf export.

const A4Wrapper: React.FC<{ id?: string; children: React.ReactNode; footer: React.ReactNode }> = ({ id = "menu-print-area", children, footer }) => (
  <div
    id={id}
    style={{
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      backgroundColor: '#ffffff',
      width: '210mm',
      height: '297mm',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'table',
      tableLayout: 'fixed',
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

// ─── Template 1: Grid 3×2 ──────────────────────────────────────────────────────
export const MenuBaseTemplate: React.FC<{ data: MenuPlanData }> = ({ data }) => (
  <>
    <style>{PRINT_STYLES}</style>
    <A4Wrapper footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} />
      <PatientBar patient={data.patient} kcal={data.kcal} />
      <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
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
      <DomingoRow domingo={data.weeklyMenu.domingo} />
    </A4Wrapper>
  </>
);

// ─── Template 2: Grid 3+4 (lunes-miércoles | jueves-domingo) ──────────────────
export const MenuTemplate2: React.FC<{ data: MenuPlanData }> = ({ data }) => (
  <>
    <style>{PRINT_STYLES}</style>
    <A4Wrapper footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} />
      <PatientBar patient={data.patient} kcal={data.kcal} />
      <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        MENÚ SEMANAL
      </div>

      {/* Row 1: Lunes – Miércoles */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
        {(['lunes', 'martes', 'miercoles'] as WeekDayKey[]).map(day =>
          <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
        )}
      </div>

      {/* Row 2: Jueves – Sábado + Domingo card */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {(['jueves', 'viernes', 'sabado'] as WeekDayKey[]).map(day =>
          <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
        )}
        {/* Domingo as 4th card */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{
            backgroundColor: '#1e293b', color: '#fff', textAlign: 'center',
            padding: '5px 4px', fontWeight: 800, fontSize: '9px', letterSpacing: '1px',
          }}>
            DOMINGO
          </div>
          <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>
              <div style={{ color: '#0f766e', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                DÍA LIBRE
              </div>
              <div style={{ color: '#334155', fontSize: '8px', fontWeight: 600, lineHeight: '1.3', whiteSpace: 'pre-line' }}>
                {data.weeklyMenu.domingo.note}
              </div>
            </div>
            {data.weeklyMenu.domingo.hydration && (
              <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                  HIDRATACIÓN
                </div>
                <div style={{ fontSize: '9px', color: '#0f766e', fontWeight: 800 }}>
                  💧 {data.weeklyMenu.domingo.hydration}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </A4Wrapper>
  </>
);