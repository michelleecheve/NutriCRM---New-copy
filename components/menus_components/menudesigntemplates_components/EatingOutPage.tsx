import React from "react";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import { MenuPlanData, EatingOutPageData } from "./menuTemplateTypes";
import { useVisualTheme, A4Wrapper, Header, PatientBar, Footer } from "./SharedAtoms";

export const EatingOutPage: React.FC<{ data: MenuPlanData }> = ({ data }) => {
  const page = data.eatingOutPage;
  if (!page?.visible) return null;

  const ts = getThemeStyles(useVisualTheme());
  const titles = data.sectionTitles || DEFAULT_SECTION_TITLES;
  const { title, freeText, columns, rows } = page;

  const hasTable = columns.length > 0 && rows.length > 0;
  const hasFreeText = freeText?.trim().length > 0;

  return (
    <A4Wrapper
      id="eating-out-page"
      footer={<Footer nutritionist={data.nutritionist} />}
    >
      <Header nutritionist={data.nutritionist} planTitle={titles.planTitle} />
      <PatientBar patient={data.patient} kcal={data.kcal} hiddenFields={data.hiddenFields} />

      {/* Page title */}
      <div
        style={{
          fontSize: `${12 * ts.fontSizeMultiplier}px`,
          fontWeight: 800,
          color: ts.colors.primary,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: "14px",
          textAlign: "center",
        }}
      >
        {title}
      </div>

      {/* Free text block */}
      {hasFreeText && (
        <div
          style={{
            backgroundColor: ts.recsCardBackground,
            border: ts.recsCardBorder,
            borderRadius: ts.recsCardRadius,
            padding: "14px 16px",
            marginBottom: "14px",
            fontSize: `${9 * ts.fontSizeMultiplier}px`,
            color: "#334155",
            fontWeight: 500,
            lineHeight: "1.6",
            whiteSpace: "pre-line",
          }}
        >
          {freeText}
        </div>
      )}

      {/* Restaurant table */}
      {hasTable && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #e2e8f0",
            borderRadius: ts.cardRadius,
            overflow: "hidden",
            fontSize: `${8.5 * ts.fontSizeMultiplier}px`,
          }}
        >
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.id}
                  style={{
                    padding: "7px 10px",
                    backgroundColor: i === 0 ? ts.colors.secondary : ts.colors.primary,
                    color: "#fff",
                    fontWeight: 800,
                    textAlign: "left",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontSize: `${8 * ts.fontSizeMultiplier}px`,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{ backgroundColor: rowIdx % 2 === 0 ? "#ffffff" : ts.colors.tertiary }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.id}
                    style={{
                      padding: "7px 10px",
                      borderBottom: "1px solid #f1f5f9",
                      borderRight: colIdx < columns.length - 1 ? "1px solid #e2e8f0" : undefined,
                      verticalAlign: "top",
                      color: colIdx === 0 ? ts.colors.primary : "#334155",
                      fontWeight: colIdx === 0 ? 700 : 500,
                      lineHeight: "1.4",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {row[col.id] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </A4Wrapper>
  );
};
