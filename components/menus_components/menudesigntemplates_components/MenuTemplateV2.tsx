import React from "react";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import {
  MenuPlanData,
  WeekDayKey,
  WEEKDAY_LABELS,
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
  DayCard,
  SplitCell,
} from "./SharedAtoms";
import { RecommendationsPage } from "./RecommendationsPage";
import { EatingOutPage } from "./EatingOutPage";
import { MenuOnlyPage, PortionsAndRecsPage, PortionsOnlyPage } from "./LayoutPages";

export const MenuTemplateV2: React.FC<{
  data: MenuPlanData;
  gridLayout?: "3col" | "4col";
  pageLayout?: "layout1" | "layout2" | "layout3";
}> = ({ data, gridLayout = "3col", pageLayout = "layout1" }) => {
  const ts = getThemeStyles(useVisualTheme());
  const domingoV1 = data.weeklyMenu.domingo;
  const domingoV2 = data.weeklyMenu.domingoV2;
  const noteText = domingoV2?.note || domingoV1.note;
  const hydrationText = domingoV2?.hydration || domingoV1.hydration;

  if (pageLayout === "layout2") {
    return (
      <div className="menu-template-container">
        <style>{PRINT_STYLES}</style>
        <style>{TEMPLATE_STYLES}</style>
        <MenuOnlyPage data={data} gridLayout={gridLayout} version="v2" />
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
        <MenuOnlyPage data={data} gridLayout={gridLayout} version="v2" />
        <RecommendationsPage data={data} />
        <PortionsOnlyPage data={data} />
        <EatingOutPage data={data} />
      </div>
    );
  }

  return (
    <div className="menu-template-container">
      <style>{PRINT_STYLES}</style>
      <style>{TEMPLATE_STYLES}</style>
      <A4Wrapper
        id="menu-page-1"
        footer={<Footer nutritionist={data.nutritionist} />}
      >
        <Header
          nutritionist={data.nutritionist}
          planTitle={(data.sectionTitles || DEFAULT_SECTION_TITLES).planTitle}
        />
        <PatientBar patient={data.patient} kcal={data.kcal} hiddenFields={data.hiddenFields} />
        <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} />
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
          MENÚ SEMANAL
        </div>

        {gridLayout === "4col" ? (
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
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: ts.cardRadius,
                    overflow: "hidden",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: ts.colors.secondary,
                      color: "#fff",
                      textAlign: "center",
                      padding: "5px 4px",
                      fontWeight: 800,
                      fontSize: `${9 * ts.fontSizeMultiplier}px`,
                      letterSpacing: "1px",
                    }}
                  >
                    DOMINGO
                  </div>
                  <div style={{ padding: "6px 8px" }}>
                    <div
                      style={{
                        color: "#334155",
                        fontSize: `${8 * ts.fontSizeMultiplier}px`,
                        fontWeight: 600,
                        lineHeight: "1.3",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {domingoV1.note}
                    </div>
                  </div>
                </div>
              )}
              <SplitCell note={noteText} hydration={hydrationText} noteLabel="NOTAS" />
            </div>
          </>
        ) : (
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
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: ts.cardRadius,
                    overflow: "hidden",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: ts.colors.secondary,
                      color: "#fff",
                      textAlign: "center",
                      padding: "5px 4px",
                      fontWeight: 800,
                      fontSize: `${9 * ts.fontSizeMultiplier}px`,
                      letterSpacing: "1px",
                    }}
                  >
                    DOMINGO
                  </div>
                  <div
                    style={{
                      padding: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    <div
                      style={{
                        color: "#334155",
                        fontSize: `${8 * ts.fontSizeMultiplier}px`,
                        fontWeight: 600,
                        lineHeight: "1.3",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {domingoV1.note}
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                  <td
                    style={{
                      backgroundColor: ts.colors.secondary,
                      color: "#fff",
                      padding: "10px 14px",
                      fontWeight: 800,
                      fontSize: `${9 * ts.fontSizeMultiplier}px`,
                      letterSpacing: "1px",
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                      width: "1%",
                    }}
                  >
                    NOTAS
                  </td>
                  <td style={{ padding: "8px 14px", verticalAlign: "middle", width: "50%" }}>
                    <div
                      style={{
                        fontSize: `${8.5 * ts.fontSizeMultiplier}px`,
                        color: "#334155",
                        fontWeight: 600,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {noteText}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "8px 14px",
                      textAlign: "right",
                      verticalAlign: "middle",
                      borderLeft: "1px solid #f1f5f9",
                      width: "50%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: `${7 * ts.fontSizeMultiplier}px`,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: "3px",
                      }}
                    >
                      META HIDRATACIÓN
                    </div>
                    <div
                      style={{
                        fontSize: `${9 * ts.fontSizeMultiplier}px`,
                        color: ts.colors.primary,
                        fontWeight: 800,
                        whiteSpace: "pre-line",
                      }}
                    >
                      💧 {hydrationText}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </A4Wrapper>

      <RecommendationsPage data={data} />
      <EatingOutPage data={data} />
    </div>
  );
};
