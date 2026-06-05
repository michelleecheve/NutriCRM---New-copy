import React from "react";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import {
  MenuPlanData,
  PRINT_STYLES,
  TEMPLATE_STYLES,
} from "./menuTemplateTypes";
import {
  useVisualTheme,
  A4Wrapper,
  Header,
  PatientBar,
  Footer,
  PortionsTable,
} from "./SharedAtoms";
import { RecommendationsPage } from "./RecommendationsPage";
import { EatingOutPage } from "./EatingOutPage";
import { PortionsAndRecsPage, PortionsOnlyPage } from "./LayoutPages";

// ─── ExchangePage (internal) ──────────────────────────────────────────────────
const ExchangePage: React.FC<{ data: MenuPlanData; showPortions?: boolean }> = ({
  data,
  showPortions = true,
}) => {
  const ts = getThemeStyles(useVisualTheme());
  const exchange = data.exchangeMenu;
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  if (!exchange) return null;

  const numExamples = Math.max(1, Math.max(...exchange.meals.map((m) => m.examples.length), 1));

  const headerCell: React.CSSProperties = {
    padding: "5px 8px",
    fontWeight: 800,
    fontSize: `${9 * ts.fontSizeMultiplier}px`,
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
    color: "#fff",
    textAlign: "center" as const,
    border: "1px solid rgba(255,255,255,0.15)",
  };

  return (
    <A4Wrapper id="menu-exchange-page" footer={<Footer nutritionist={data.nutritionist} />}>
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} hiddenFields={data.hiddenFields} />
      {showPortions && <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} isVegetarian={data.isVegetarian} />}

      <div
        style={{
          fontSize: `${10 * ts.fontSizeMultiplier}px`,
          fontWeight: 800,
          color: ts.colors.primary,
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}
      >
        MENÚ DE INTERCAMBIO DE ALIMENTOS
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #e2e8f0",
          borderRadius: ts.cardRadius,
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...headerCell, backgroundColor: ts.colors.secondary, width: "22%", textAlign: "left" as const }}>
              TIEMPO
            </th>
            {Array.from({ length: numExamples }, (_, i) => (
              <th key={i} style={{ ...headerCell, backgroundColor: ts.colors.primary }}>
                {(exchange.columnLabels?.[i] || `Opción ${i + 1}`).toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exchange.meals.map((meal, idx) => (
            <tr key={meal.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : ts.colors.tertiary }}>
              <td
                style={{
                  padding: "7px 10px",
                  borderRight: "1px solid #e2e8f0",
                  borderBottom: "1px solid #f1f5f9",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    color: ts.colors.primary,
                    fontSize: `${8.5 * ts.fontSizeMultiplier}px`,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {meal.label}
                </div>
              </td>
              {Array.from({ length: numExamples }, (_, j) => (
                <td
                  key={j}
                  style={{
                    padding: "7px 10px",
                    borderRight: j < numExamples - 1 ? "1px solid #e2e8f0" : undefined,
                    borderBottom: "1px solid #f1f5f9",
                    verticalAlign: "top",
                    fontSize: `${8 * ts.fontSizeMultiplier}px`,
                    color: "#1e293b",
                    fontWeight: 600,
                    lineHeight: "1.35",
                    whiteSpace: "pre-line",
                  }}
                >
                  {meal.examples[j] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {(exchange.note || exchange.hydration) && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #e2e8f0",
            borderRadius: ts.cardRadius,
            overflow: "hidden",
          }}
        >
          <tbody>
            <tr>
              {exchange.note ? (
                <>
                  <td style={{ backgroundColor: ts.colors.secondary, color: "#fff", padding: "8px 12px", fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: "1px", whiteSpace: "nowrap", width: "1%" }}>
                    NOTAS
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: `${8.5 * ts.fontSizeMultiplier}px`, color: "#334155", fontWeight: 600, whiteSpace: "pre-line" }}>
                    {exchange.note}
                  </td>
                </>
              ) : null}
              {exchange.hydration ? (
                <td style={{ padding: "8px 12px", textAlign: "right", borderLeft: exchange.note ? "1px solid #f1f5f9" : undefined, width: "35%" }}>
                  <div style={{ fontSize: `${7 * ts.fontSizeMultiplier}px`, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, marginBottom: "2px" }}>META HIDRATACIÓN</div>
                  <div style={{ fontSize: `${9 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 800, whiteSpace: "pre-line" }}>💧 {exchange.hydration}</div>
                </td>
              ) : null}
            </tr>
          </tbody>
        </table>
      )}
    </A4Wrapper>
  );
};

// ─── MenuTemplateExchange (exported) ─────────────────────────────────────────
export const MenuTemplateExchange: React.FC<{
  data: MenuPlanData;
  pageLayout?: "layout1" | "layout2" | "layout3";
}> = ({ data, pageLayout = "layout1" }) => {
  if (pageLayout === "layout2") {
    return (
      <div className="menu-template-container">
        <style>{PRINT_STYLES}</style>
        <style>{TEMPLATE_STYLES}</style>
        <ExchangePage data={data} showPortions={false} />
        <PortionsAndRecsPage data={data} />
        <EatingOutPage data={data} />
      </div>
    );
  }
  if (pageLayout === "layout3") {
    return (
      <div className="menu-template-container">
        <style>{PRINT_STYLES}</style>
        <style>{TEMPLATE_STYLES}</style>
        <ExchangePage data={data} showPortions={false} />
        <RecommendationsPage data={data} />
        <PortionsOnlyPage data={data} />
        <EatingOutPage data={data} />
      </div>
    );
  }
  // layout1 (default)
  return (
    <div className="menu-template-container">
      <style>{PRINT_STYLES}</style>
      <style>{TEMPLATE_STYLES}</style>
      <ExchangePage data={data} showPortions={true} />
      <RecommendationsPage data={data} />
      <EatingOutPage data={data} />
    </div>
  );
};
