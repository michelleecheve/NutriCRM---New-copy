import React from "react";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import {
  MenuPlanData,
  DomingoData,
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
  DomingoRow,
} from "./SharedAtoms";
import { RecommendationsPage } from "./RecommendationsPage";
import { EatingOutPage } from "./EatingOutPage";
import { MenuOnlyPage, PortionsAndRecsPage, PortionsOnlyPage } from "./LayoutPages";

export const MenuTemplateV1: React.FC<{
  data: MenuPlanData;
  gridLayout?: "3col" | "4col";
  pageLayout?: "layout1" | "layout2" | "layout3";
}> = ({ data, gridLayout = "3col", pageLayout = "layout1" }) => {
  const ts = getThemeStyles(useVisualTheme());
  const domingo = data.weeklyMenu.domingo as DomingoData;

  if (pageLayout === "layout2") {
    return (
      <div className="menu-template-container">
        <style>{PRINT_STYLES}</style>
        <style>{TEMPLATE_STYLES}</style>
        <MenuOnlyPage data={data} gridLayout={gridLayout} version="v1" />
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
        <MenuOnlyPage data={data} gridLayout={gridLayout} version="v1" />
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
      <A4Wrapper
        id="menu-page-1"
        footer={<Footer nutritionist={data.nutritionist} />}
      >
        <Header
          nutritionist={data.nutritionist}
          planTitle={(data.sectionTitles || DEFAULT_SECTION_TITLES).planTitle}
        />
        <PatientBar patient={data.patient} kcal={data.kcal} hiddenFields={data.hiddenFields} />
        <PortionsTable portions={data.portions} weeklyMenu={data.weeklyMenu} isVegetarian={data.isVegetarian} />
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
              <div style={{ flex: 2, minWidth: 0, alignSelf: "flex-start", display: "flex", gap: "6px" }}>
                <div style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden" }}>
                  <div style={{ backgroundColor: ts.colors.secondary, color: "#fff", textAlign: "center", padding: "5px 4px", fontWeight: 800, fontSize: `${9 * ts.fontSizeMultiplier}px`, letterSpacing: "1px" }}>
                    DOMINGO
                  </div>
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ color: "#334155", fontSize: `${7.5 * ts.fontSizeMultiplier}px`, fontWeight: 600, lineHeight: "1.3", whiteSpace: "pre-line" }}>
                      {domingo.note}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden", display: "flex", alignItems: "center" }}>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: `${7 * ts.fontSizeMultiplier}px`, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, marginBottom: "3px" }}>
                      META HIDRATACIÓN
                    </div>
                    <div style={{ fontSize: `${9 * ts.fontSizeMultiplier}px`, color: ts.colors.primary, fontWeight: 800, whiteSpace: "pre-line" }}>
                      💧 {domingo.hydration}
                    </div>
                  </div>
                </div>
              </div>
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
            </div>
            <DomingoRow domingo={domingo} />
          </>
        )}
      </A4Wrapper>

      <RecommendationsPage data={data} />
      <EatingOutPage data={data} />
    </div>
  );
};
