import React from "react";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import {
  MenuPlanData,
  MenuRecommendations,
  DomingoData,
  WeekDayKey,
  WEEKDAY_LABELS,
} from "./menuTemplateTypes";
import {
  useVisualTheme,
  A4Wrapper,
  Header,
  PatientBar,
  Footer,
  PortionsTable,
  DayCard,
  DomingoRow,
  SplitCell,
} from "./SharedAtoms";

// ─── MenuOnlyPage: Hoja 1 para layouts 2 y 3 (solo menú, sin porciones) ────────
export const MenuOnlyPage: React.FC<{
  data: MenuPlanData;
  gridLayout: "3col" | "4col";
  version: "v1" | "v2";
}> = ({ data, gridLayout, version }) => {
  const ts = getThemeStyles(useVisualTheme());
  const domingoV1 = data.weeklyMenu.domingo as DomingoData;
  const domingoV2 = data.weeklyMenu.domingoV2;
  const noteText = domingoV2?.note || domingoV1.note;
  const hydrationText = domingoV2?.hydration || domingoV1.hydration;
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;

  const renderGrid = () => {
    if (version === "v1") {
      const domingo = domingoV1;
      if (gridLayout === "4col") {
        return (
          <>
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              {(["lunes", "martes", "miercoles", "jueves"] as WeekDayKey[]).map((day) => (
                <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              <DayCard label={WEEKDAY_LABELS["viernes"]} day={data.weeklyMenu["viernes"]} />
              <DayCard label={WEEKDAY_LABELS["sabado"]} day={data.weeklyMenu["sabado"]} />
              <div style={{ flex: 2, minWidth: 0, alignSelf: "flex-start", display: "flex", gap: "6px" }}>
                <div style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden" }}>
                  <div style={{ backgroundColor: ts.colors.secondary, color: "#fff", textAlign: "center", padding: "5px 4px", fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: "1px" }}>DOMINGO</div>
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ color: "#334155", fontSize: `${7.5 * ts.fontSizeMultiplier}px`, fontWeight: 600, lineHeight: "1.3", whiteSpace: "pre-line" }}>{domingo.note}</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden", display: "flex", alignItems: "center" }}>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: `${7 * ts.fontSizeMultiplier}px`, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, marginBottom: "3px" }}>META HIDRATACIÓN</div>
                    <div style={{ fontSize: `${9 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 800, whiteSpace: "pre-line" }}>💧 {domingo.hydration}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }
      return (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            {(["lunes", "martes", "miercoles"] as WeekDayKey[]).map((day) => (
              <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            {(["jueves", "viernes", "sabado"] as WeekDayKey[]).map((day) => (
              <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
            ))}
          </div>
          <DomingoRow domingo={domingo} />
        </>
      );
    }

    // version v2
    if (gridLayout === "4col") {
      return (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            {(["lunes", "martes", "miercoles", "jueves"] as WeekDayKey[]).map((day) => (
              <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <DayCard label={WEEKDAY_LABELS["viernes"]} day={data.weeklyMenu["viernes"]} />
            <DayCard label={WEEKDAY_LABELS["sabado"]} day={data.weeklyMenu["sabado"]} />
            {domingoV2 ? (
              <DayCard label="DOMINGO" day={domingoV2} />
            ) : (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden", flex: 1, minWidth: 0 }}>
                <div style={{ backgroundColor: ts.colors.secondary, color: "#fff", textAlign: "center", padding: "5px 4px", fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: "1px" }}>DOMINGO</div>
                <div style={{ padding: "6px 8px" }}>
                  <div style={{ color: "#334155", fontSize: `${8 * ts.fontSizeMultiplier}px`, fontWeight: 600, lineHeight: "1.3", whiteSpace: "pre-line" }}>{domingoV1.note}</div>
                </div>
              </div>
            )}
            <SplitCell note={noteText} hydration={hydrationText} noteLabel="NOTAS" />
          </div>
        </>
      );
    }
    return (
      <>
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          {(["lunes", "martes", "miercoles"] as WeekDayKey[]).map((day) => (
            <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
          {(["jueves", "viernes", "sabado"] as WeekDayKey[]).map((day) => (
            <DayCard key={day} label={WEEKDAY_LABELS[day]} day={data.weeklyMenu[day]} />
          ))}
          {domingoV2 ? (
            <DayCard label="DOMINGO" day={domingoV2} />
          ) : (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div style={{ backgroundColor: ts.colors.secondary, color: "#fff", textAlign: "center", padding: "5px 4px", fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: "1px" }}>DOMINGO</div>
              <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ color: "#334155", fontSize: `${8 * ts.fontSizeMultiplier}px`, fontWeight: 600, lineHeight: "1.3", whiteSpace: "pre-line" }}>{domingoV1.note}</div>
              </div>
            </div>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden" }}>
          <tbody>
            <tr>
              <td style={{ backgroundColor: ts.colors.secondary, color: "#fff", padding: "10px 14px", fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: "1px", whiteSpace: "nowrap", verticalAlign: "middle", width: "1%" }}>NOTAS</td>
              <td style={{ padding: "8px 14px", verticalAlign: "middle" }}>
                <div style={{ fontSize: `${8.5 * ts.fontSizeMultiplier}px`, color: "#334155", fontWeight: 600, whiteSpace: "pre-line" }}>{noteText}</div>
              </td>
              <td style={{ padding: "8px 14px", textAlign: "right", verticalAlign: "middle", borderLeft: "1px solid #f1f5f9", width: "50%" }}>
                <div style={{ fontSize: `${7 * ts.fontSizeMultiplier}px`, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, marginBottom: "3px" }}>META HIDRATACIÓN</div>
                <div style={{ fontSize: `${9 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 800, wordBreak: "break-word", whiteSpace: "pre-line" }}>💧 {hydrationText}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  };

  return (
    <A4Wrapper id="menu-page-1" footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} />
      <div style={{ fontSize: `${10 * ts.fontSizeMultiplier}px`, fontWeight: 800, color: ts.colors.primary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
        MENÚ SEMANAL
      </div>
      {renderGrid()}
    </A4Wrapper>
  );
};

// ─── PortionsAndRecsPage: Hoja 2 para layout 2 (porciones + recomendaciones) ──
const DEFAULT_RECS_COMPACT: MenuRecommendations = {
  preparacion: [
    "Priorizar alimentos cocidos, al vapor, al horno o a la plancha. Evitar frituras y empanizados.",
    "Medir porciones con tazas y cucharas medidoras para mantener control energético semanal.",
    "Usar stevia o endulzantes naturales sin calorías.",
    "Priorizar carbohidratos complejos como arroz integral, camote, avena y legumbres.",
    "Incluir grasas saludables en porciones pequeñas: aceite de oliva, aguacate, semillas o nueces.",
  ],
  restricciones: [
    "Evitar harinas refinadas.",
    "Evitar quesos procesados o altos en grasa. Preferir ricotta, requesón, queso panela.",
    "Evitar el uso de consomé. Preferir condimentar con hierbas como orégano, albahaca, ajo, cebolla y cúrcuma.",
    "Evitar bebidas azucaradas, repostería, bebidas alcohólicas, jugos procesados, pasteles o alimentos con azúcar añadida.",
  ],
  habitos: [
    "Incluir vegetales al menos 2 veces al día (crudos o cocidos).",
    "Adecuada hidratación durante el día. Consumir mínimo 8 vasos de agua pura al día.",
    "Realizar planificación de ejercicio enfocado en fuerza y resistencia 2-3 veces por semana.",
    "Priorizar descanso y sueño: dormir un mínimo de 7 horas por noche.",
  ],
  organizacion: [
    "No dejar pasar más de 3-4 horas sin comer para evitar picos de hambre o ansiedad.",
    "Organizar los tiempos de comida para días con viaje o actividades fuera de casa.",
    "El día domingo puede tener 1 tiempo de comida libre, pero procurar mantener las porciones.",
  ],
};

export const PortionsAndRecsPage: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const ts = getThemeStyles(useVisualTheme());
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  const recs = data.recommendations || DEFAULT_RECS_COMPACT;

  const cardStyle: React.CSSProperties = {
    backgroundColor: ts.recsCardBackground,
    border: ts.recsCardBorder,
    borderRadius: ts.recsCardRadius,
    padding: "10px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflow: "hidden",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: `${11 * ts.fontSizeMultiplier}px`,
    fontWeight: 800,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "5px",
  };

  const itemDescStyle: React.CSSProperties = {
    fontSize: `${8 * ts.fontSizeMultiplier}px`,
    color: "#64748b",
    lineHeight: "1.3",
    whiteSpace: "pre-line",
  };

  const renderRecItem = (text: string, i: number, style: "check" | "dot" | "green") => (
    <div key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
      {style === "check" && (
        <div style={{ color: "#10b981", fontSize: "11px", fontWeight: 900, flexShrink: 0, width: "14px", display: "flex", justifyContent: "center" }}>✓</div>
      )}
      {style === "dot" && (
        <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#ef4444", marginTop: "5px", flexShrink: 0 }} />
      )}
      {style === "green" && (
        <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#059669", marginTop: "5px", flexShrink: 0 }} />
      )}
      <div style={{ ...itemDescStyle, color: "#334155", fontWeight: 500 }}>{text}</div>
    </div>
  );

  return (
    <A4Wrapper id="portions-recs-page" footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} />
      <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />

      <div style={{ fontSize: `${10 * ts.fontSizeMultiplier}px`, fontWeight: 800, color: ts.colors.primary, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px", marginTop: "4px", textAlign: "center" }}>
        {titles.page2Title}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", overflow: "hidden" }}>
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span style={{ fontSize: "14px" }}>{titles.preparacionEmoji}</span>{titles.preparacionTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {recs.preparacion.map((t, i) => renderRecItem(t, i, "check"))}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span style={{ fontSize: "14px" }}>{titles.restriccionesEmoji}</span>{titles.restriccionesTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {recs.restricciones.map((t, i) => renderRecItem(t, i, "dot"))}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span style={{ fontSize: "14px" }}>{titles.habitosEmoji}</span>{titles.habitosTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {recs.habitos.map((t, i) => renderRecItem(t, i, "check"))}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span style={{ fontSize: "14px" }}>{titles.organizacionEmoji}</span>{titles.organizacionTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {recs.organizacion.map((t, i) => renderRecItem(t, i, "green"))}
          </div>
        </div>
      </div>
    </A4Wrapper>
  );
};

// ─── PortionsOnlyPage: Hoja 3 para layout 3 (solo porciones) ─────────────────
export const PortionsOnlyPage: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  return (
    <A4Wrapper id="portions-page" footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} />
      <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />
    </A4Wrapper>
  );
};
