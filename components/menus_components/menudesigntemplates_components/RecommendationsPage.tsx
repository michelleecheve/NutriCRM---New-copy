import React from "react";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import { MenuPlanData, MenuRecommendations } from "./menuTemplateTypes";
import { useVisualTheme, A4Wrapper, Header, PatientBar, Footer } from "./SharedAtoms";

const DEFAULT_RECS: MenuRecommendations = {
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
    "Realizar planificación de ejercicio enfocado en fuerza y resistencia 2-3 veces por semana para conservar masa muscular.",
    "Priorizar descanso y sueño: dormir un mínimo de 7 horas por noche mejora regulación hormonal y la recuperación muscular.",
    "Si presenta ansiedad por comer, utilizar infusiones, gelatina sin azúcar o vegetales crudos con limón y pepita como snacks.",
  ],
  organizacion: [
    "No dejar pasar más de 3-4 horas sin comer para evitar picos de hambre o ansiedad.",
    "Organizar los tiempos de comida (en caso deba viajar o tenga que salir de casa por trabajo y/o entreno, agilizar dejando porciones listas y refrigeradas para el día).",
    "El día domingo puede tener 1 tiempo de comida libre (por ejemplo el almuerzo), pero procurar mantener las porciones de comida.",
  ],
};

export const RecommendationsPage: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const ts = getThemeStyles(useVisualTheme());
  const recs = data.recommendations || DEFAULT_RECS;
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;

  const cardStyle: React.CSSProperties = {
    backgroundColor: ts.recsCardBackground,
    border: ts.recsCardBorder,
    borderRadius: ts.recsCardRadius,
    boxShadow: ts.recsCardShadow,
    padding: "16px",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: `${14 * ts.fontSizeMultiplier}px`,
    fontWeight: 800,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "8px",
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  };

  const itemDescStyle: React.CSSProperties = {
    fontSize: `${9 * ts.fontSizeMultiplier}px`,
    color: "#64748b",
    lineHeight: "1.3",
    whiteSpace: "pre-line",
  };

  return (
    <A4Wrapper
      id="recommendations-page"
      footer={<Footer nutritionist={data.nutritionist} />}
    >
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} />

      <div
        style={{
          fontSize: `${12 * ts.fontSizeMultiplier}px`,
          fontWeight: 800,
          color: ts.colors.primary,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: "15px",
          textAlign: "center",
        }}
      >
        {titles.page2Title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "15px",
          height: "calc(100% - 160px)",
          maxHeight: "calc(296mm - 280px)",
          overflow: "hidden",
        }}
      >
        {/* Sección 1: Preparación */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: "18px" }}>{titles.preparacionEmoji}</span>{" "}
            {titles.preparacionTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recs.preparacion.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div
                  style={{
                    color: "#10b981",
                    fontSize: "14px",
                    fontWeight: 900,
                    flexShrink: 0,
                    width: "18px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={itemDescStyle}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 2: Restricciones */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: "18px" }}>{titles.restriccionesEmoji}</span>{" "}
            {titles.restriccionesTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recs.restricciones.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ ...itemDescStyle, color: "#334155", fontWeight: 500 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 3: Hábitos */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: "18px" }}>{titles.habitosEmoji}</span>{" "}
            {titles.habitosTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recs.habitos.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div
                  style={{
                    color: "#10b981",
                    fontSize: "14px",
                    fontWeight: 900,
                    flexShrink: 0,
                    width: "18px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
                <div style={{ ...itemDescStyle, color: "#334155", fontWeight: 500 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 4: Organización */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ fontSize: "18px" }}>{titles.organizacionEmoji}</span>{" "}
            {titles.organizacionTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recs.organizacion.map((text, i) => (
              <div key={i} style={itemStyle}>
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ ...itemDescStyle, color: "#334155", fontWeight: 500 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </A4Wrapper>
  );
};
