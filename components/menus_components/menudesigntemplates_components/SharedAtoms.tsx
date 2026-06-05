import React, { useContext } from "react";
import { MenuDesignOverrideContext } from "../MenuDesignContext";
import { getThemeStyles } from "../menu_css_templates/menuThemes";
import type { ThemeStyles } from "../menu_css_templates/menuThemes";
import { store } from "../../../services/store";
import type { MenuFooterConfig } from "../../../types";
import { DEFAULT_SECTION_TITLES } from "../../../types";
import {
  MenuPlanData,
  MenuDay,
  DayMeal,
  MealKey,
  MEAL_KEYS,
  MEAL_LABELS,
  DomingoData,
  MealPortions,
  PORTION_GROUPS,
} from "./menuTemplateTypes";

// ─── Theme hook ────────────────────────────────────────────────────────────────
export function useVisualTheme() {
  const override = useContext(MenuDesignOverrideContext);
  return override?.visualTheme ?? store.getMenuTemplate()?.visualTheme;
}

// ─── DayCard ───────────────────────────────────────────────────────────────────
export const DayCard: React.FC<{
  label: string;
  day: MenuDay;
  isFullWidth?: boolean;
}> = ({ label, day, isFullWidth }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  const mealKeys = day.mealsOrder || MEAL_KEYS;
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: ts.cardRadius,
        overflow: "hidden",
        flex: isFullWidth ? "none" : "1",
        width: isFullWidth ? "100%" : "auto",
        minWidth: 0,
      }}
    >
      <div
        style={{
          backgroundColor: ts.colors.primary,
          color: "#fff",
          textAlign: "center",
          padding: "5px 4px",
          fontWeight: 800,
          fontSize: `${9 * ts.fontSizeMultiplier}px`,
          letterSpacing: "1px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          padding: "6px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {mealKeys.map((mealKey) => {
          const m = (day as any)[mealKey] as DayMeal;
          if (!m || !m.title?.trim()) return null;
          const displayLabel =
            m.label || MEAL_LABELS[mealKey as MealKey] || mealKey;
          return (
            <div key={mealKey}>
              <div
                style={{
                  color: ts.colors.primary,
                  fontSize: `${8.5 * ts.fontSizeMultiplier}px`,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "1px",
                }}
              >
                {displayLabel}
              </div>
              <div
                style={{
                  color: "#1e293b",
                  fontSize: `${8 * ts.fontSizeMultiplier}px`,
                  fontWeight: 600,
                  lineHeight: "1.3",
                  whiteSpace: "pre-line",
                }}
              >
                {m.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Header ────────────────────────────────────────────────────────────────────
export const Header: React.FC<{
  nutritionist: MenuPlanData["nutritionist"];
  planTitle?: string;
}> = ({ nutritionist, planTitle }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  const titleParts = (planTitle || DEFAULT_SECTION_TITLES.planTitle).split("\n");
  const headerStyle: React.CSSProperties =
    ts.headerBorderBottom !== "none"
      ? {
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "12px",
          borderBottom: ts.headerBorderBottom,
          paddingBottom: "8px",
        }
      : { width: "100%", borderCollapse: "collapse", marginBottom: "12px" };
  return (
    <table style={headerStyle}>
      <tbody>
        <tr>
          <td style={{ verticalAlign: "middle", padding: 0 }}>
            {nutritionist.logoUrl ? (
              <img
                src={nutritionist.logoUrl}
                alt="Logo"
                style={{
                  height: "50px",
                  maxWidth: "310px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <table style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "middle", paddingRight: "10px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          backgroundColor: ts.colors.primary,
                          overflow: "hidden",
                          textAlign: "center",
                          lineHeight: "42px",
                        }}
                      >
                        {nutritionist.avatar ? (
                          <img
                            src={nutritionist.avatar}
                            alt="avatar"
                            style={{
                              width: "42px",
                              height: "42px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "18px",
                              fontWeight: 800,
                              lineHeight: "42px",
                            }}
                          >
                            {(nutritionist.name || "N").charAt(0)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: "middle" }}>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: `${20 * ts.fontSizeMultiplier}px`,
                          color: "#0f172a",
                          letterSpacing: "-0.5px",
                          lineHeight: 1,
                        }}
                      >
                        {(nutritionist.name || "").toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontSize: `${8 * ts.fontSizeMultiplier}px`,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          marginTop: "3px",
                        }}
                      >
                        {(nutritionist.title || "").toUpperCase()}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </td>
          <td style={{ verticalAlign: "middle", textAlign: "right", padding: 0 }}>
            {titleParts[0] && (
              <div
                style={{
                  color: ts.colors.primary,
                  fontSize: `${15 * ts.fontSizeMultiplier}px`,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  lineHeight: 1.15,
                }}
              >
                {titleParts[0]}
              </div>
            )}
            {titleParts[1] && (
              <div
                style={{
                  color: ts.colors.primary,
                  fontSize: `${13 * ts.fontSizeMultiplier}px`,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  lineHeight: 1.15,
                }}
              >
                {titleParts[1]}
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

// ─── PatientBar ────────────────────────────────────────────────────────────────
export const PatientBar: React.FC<{
  patient: MenuPlanData["patient"];
  kcal: number;
  hiddenFields?: MenuPlanData["hiddenFields"];
}> = ({ patient, kcal, hiddenFields }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        marginBottom: "12px",
        fontSize: `${9 * ts.fontSizeMultiplier}px`,
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "7px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
            <span style={{ color: "#64748b", fontWeight: 600 }}>PACIENTE: </span>
            <span style={{ color: "#0f172a", fontWeight: 800 }}>{patient?.name || "N/A"}</span>
          </td>
          {!hiddenFields?.age && (
            <td style={{ padding: "7px 10px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>EDAD: </span>
              <span style={{ color: "#0f172a", fontWeight: 700 }}>{patient?.age || 0} años</span>
            </td>
          )}
          {!hiddenFields?.weight && (
            <td style={{ padding: "7px 10px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>PESO: </span>
              <span style={{ color: "#0f172a", fontWeight: 700 }}>{patient?.weight || 0} kg</span>
            </td>
          )}
          {!hiddenFields?.fatPct && (
            <td style={{ padding: "7px 10px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>% GRASA: </span>
              <span style={{ color: "#0f172a", fontWeight: 700 }}>{patient?.fatPct || 0}%</span>
            </td>
          )}
          {!hiddenFields?.kcal && (
            <td
              style={{
                padding: "0",
                verticalAlign: "middle",
                textAlign: "right",
                borderLeft: "1px solid #e2e8f0",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600, padding: "7px 8px 7px 12px", display: "inline-block" }}>
                META:
              </span>
              <span
                style={{
                  color: ts.colors.primary,
                  fontWeight: 900,
                  fontSize: `${10 * ts.fontSizeMultiplier}px`,
                  backgroundColor: ts.colors.tertiary,
                  borderLeft: `1px solid ${ts.colors.tertiaryBorder}`,
                  padding: "7px 15px",
                  display: "inline-block",
                }}
              >
                {kcal.toLocaleString()} kcal
              </span>
            </td>
          )}
        </tr>
      </tbody>
    </table>
  );
};

// ─── PortionsTable ─────────────────────────────────────────────────────────────
export const PortionsTable: React.FC<{
  portions: MenuPlanData["portions"];
  weeklyMenu: MenuPlanData["weeklyMenu"];
  isVegetarian?: boolean;
}> = ({ portions, weeklyMenu, isVegetarian }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  const totals: MealPortions = {
    lacteos: portions.lacteos,
    vegetales: portions.vegetales,
    frutas: portions.frutas,
    cereales: portions.cereales,
    carnes: portions.carnes,
    grasas: portions.grasas,
  };
  const mealOrder = weeklyMenu.lunes.mealsOrder || MEAL_KEYS;

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontSize: `${10 * ts.fontSizeMultiplier}px`,
          fontWeight: 800,
          color: ts.colors.primary,
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "5px",
        }}
      >
        GUÍA DIARIA DE PORCIONES
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: `${8 * ts.fontSizeMultiplier}px`,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th
              style={{
                padding: "5px 8px",
                textAlign: "left",
                fontWeight: 700,
                color: "#475569",
                borderBottom: "2px solid #e2e8f0",
                width: "14%",
                verticalAlign: "middle",
              }}
            >
              TIEMPO
            </th>
            {PORTION_GROUPS.map((g) => {
              const emoji = g.key === 'carnes' ? (isVegetarian ? '🥚' : '🥩') : g.emoji;
              const label = g.key === 'carnes' ? (isVegetarian ? 'PROTEÍNA' : 'CARNES') : g.label;
              return (
                <th
                  key={g.key}
                  style={{
                    padding: "5px 6px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#475569",
                    borderBottom: "2px solid #e2e8f0",
                    verticalAlign: "middle",
                  }}
                >
                  {emoji} {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {mealOrder.map((mealKey, i) => {
            const row = portions.byMeal[mealKey];
            if (!row) return null;
            const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
            const firstDayMeal = (weeklyMenu.lunes as any)[mealKey] as DayMeal;
            const row2 = portions.byMeal[mealKey];
            const label =
              firstDayMeal?.label ||
              row2?.label ||
              MEAL_LABELS[mealKey as MealKey] ||
              mealKey;
            return (
              <tr key={mealKey} style={{ backgroundColor: bg }}>
                <td
                  style={{
                    padding: "5px 8px",
                    fontWeight: 600,
                    color: "#334155",
                    borderBottom: "1px solid #f1f5f9",
                    verticalAlign: "middle",
                  }}
                >
                  {label}
                </td>
                {PORTION_GROUPS.map((g) => (
                  <td
                    key={g.key}
                    style={{
                      padding: "5px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: row[g.key] > 0 ? "#0f172a" : "#cbd5e1",
                      borderBottom: "1px solid #f1f5f9",
                      verticalAlign: "middle",
                    }}
                  >
                    {row[g.key] > 0 ? row[g.key] : "—"}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr
            style={{
              backgroundColor: ts.colors.tertiary,
              borderTop: `2px solid ${ts.colors.tertiaryBorder}`,
            }}
          >
            <td
              style={{
                padding: "5px 8px",
                fontWeight: 800,
                color: ts.colors.primary,
                fontSize: `${8 * ts.fontSizeMultiplier}px`,
                verticalAlign: "middle",
              }}
            >
              TOTAL PORCIONES
            </td>
            {PORTION_GROUPS.map((g) => (
              <td
                key={g.key}
                style={{
                  padding: "5px 6px",
                  textAlign: "center",
                  fontWeight: 800,
                  color: ts.colors.primary,
                  fontSize: `${9 * ts.fontSizeMultiplier}px`,
                  verticalAlign: "middle",
                }}
              >
                {totals[g.key]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ─── DomingoRow ────────────────────────────────────────────────────────────────
export const DomingoRow: React.FC<{ domingo: DomingoData }> = ({ domingo }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  return (
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
            DOMINGO
          </td>
          <td style={{ padding: "8px 14px", verticalAlign: "middle", width: "50%" }}>
            <div
              style={{
                fontSize: `${7.5 * ts.fontSizeMultiplier}px`,
                color: ts.colors.primary,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "3px",
              }}
            >
              DÍA LIBRE / OBSERVACIONES:
            </div>
            <div
              style={{
                fontSize: `${8.5 * ts.fontSizeMultiplier}px`,
                color: "#334155",
                fontWeight: 600,
                whiteSpace: "pre-line",
              }}
            >
              {domingo.note}
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
                wordBreak: "break-word",
                whiteSpace: "pre-line",
              }}
            >
              💧 {domingo.hydration}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

// ─── Footer ────────────────────────────────────────────────────────────────────
export const Footer: React.FC<{ nutritionist: MenuPlanData["nutritionist"] }> = ({
  nutritionist,
}) => {
  const cfg = nutritionist.footerConfig;
  const show = (key: keyof MenuFooterConfig): boolean => !cfg || cfg[key];

  const nameLeft: string[] = [];
  if (show("showName") && nutritionist.name) {
    const prefix = (nutritionist.professionalTitle || "").toUpperCase();
    nameLeft.push(
      prefix
        ? `${prefix} ${nutritionist.name.toUpperCase()}`
        : nutritionist.name.toUpperCase(),
    );
  }
  if (show("showSpecialty") && nutritionist.title)
    nameLeft.push(`- ${nutritionist.title.toUpperCase()}`);

  const contactItems: { label: string; value: string }[] = [];
  if (show("showLicense") && nutritionist.licenseNumber)
    contactItems.push({ label: "Colegiado #", value: nutritionist.licenseNumber });
  if (show("showClinicPhone") && nutritionist.whatsapp)
    contactItems.push({ label: "Tel. Clínica", value: nutritionist.whatsapp });
  if (show("showPersonalPhone") && nutritionist.personalPhone)
    contactItems.push({ label: "Tel. Personal", value: nutritionist.personalPhone });
  if (show("showEmail") && nutritionist.email)
    contactItems.push({ label: "Email", value: nutritionist.email });
  if (show("showInstagram") && nutritionist.instagram)
    contactItems.push({ label: "Instagram", value: nutritionist.instagram });
  if (show("showAddress") && nutritionist.address)
    contactItems.push({ label: "Dirección", value: nutritionist.address });

  const showWebsite = show("showWebsite") && !!nutritionist.website;

  return (
    <div style={{ width: "100%" }}>
      {(nameLeft.length > 0 || showWebsite) && (
        <div style={{ fontSize: "8px", color: "#1e293b", marginBottom: "2px" }}>
          <span style={{ fontWeight: 800 }}>{nameLeft.join(" ")}</span>
          {showWebsite && (
            <>
              <span style={{ fontWeight: 800, color: "#1e293b", margin: "0 6px" }}>|</span>
              <span style={{ fontWeight: 400, color: "#475569", textTransform: "uppercase" }}>
                {nutritionist.website}
              </span>
            </>
          )}
        </div>
      )}
      {contactItems.length > 0 && (
        <table style={{ borderCollapse: "collapse", fontSize: "7.5px", color: "#475569" }}>
          <tbody>
            <tr>
              {contactItems.map((item, i) => (
                <td
                  key={i}
                  style={{
                    paddingRight: i < contactItems.length - 1 ? "14px" : undefined,
                    verticalAlign: "middle",
                    whiteSpace: "nowrap",
                  }}
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

// ─── A4Wrapper ─────────────────────────────────────────────────────────────────
export const A4Wrapper: React.FC<{
  id?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}> = ({ id = "menu-print-area", children, footer }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  return (
    <div
      id={id}
      style={{
        fontFamily: ts.fontFamily,
        backgroundColor: "#ffffff",
        width: "210mm",
        height: "296mm",
        maxheight: "296mm",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "table",
        tableLayout: "fixed",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      <div
        id="menu-print-area-scaler"
        style={{ display: "table-row", height: "100%" }}
      >
        <div
          style={{
            fontSize: "10px",
            lineHeight: "1.4",
            padding: "14px 20px 8px 20px",
            boxSizing: "border-box",
            overflow: "hidden",
            display: "table-cell",
            verticalAlign: "top",
          }}
        >
          {children}
        </div>
      </div>

      <div style={{ display: "table-row" }}>
        <div
          style={{
            display: "table-cell",
            borderTop: "1px solid #e2e8f0",
            padding: "8px 20px 20px 20px",
            boxSizing: "border-box",
            verticalAlign: "top",
            backgroundColor: "#ffffff",
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
};

// ─── SplitCell ─────────────────────────────────────────────────────────────────
export const SplitCell: React.FC<{
  note: string;
  hydration: string;
  noteLabel?: string;
  flex?: number;
}> = ({ note, hydration, noteLabel, flex = 1 }) => {
  const ts: ThemeStyles = getThemeStyles(useVisualTheme());
  return (
    <div style={{ flex, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden" }}>
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
          {noteLabel || "NOTAS"}
        </div>
        <div style={{ padding: "6px 8px" }}>
          <div
            style={{
              color: "#334155",
              fontSize: `${7.5 * ts.fontSizeMultiplier}px`,
              fontWeight: 600,
              lineHeight: "1.3",
              whiteSpace: "pre-line",
            }}
          >
            {note}
          </div>
        </div>
      </div>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: ts.cardRadius, overflow: "hidden" }}>
        <div style={{ padding: "8px 14px" }}>
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
            💧 {hydration}
          </div>
        </div>
      </div>
    </div>
  );
};
