import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Power,
  PowerOff,
  ExternalLink,
  Save,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
  Settings,
  Lock,
  Unlock,
} from "lucide-react";
import { Patient, GeneratedMenu, TrackingRow } from "../../types";
import { supabaseService } from "../../services/supabaseService";
import { supabase } from "../../services/supabase";
import { authStore } from "../../services/authStore";

interface Props {
  patient: Patient;
  onUpdate: (p: Patient) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getPortalBase(): string {
  return window.location.origin;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Plan compliance (based on full menu structure) ──────────────────────────

const PLAN_DAY_KEYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];
const PLAN_MEAL_ORDER = [
  "desayuno",
  "refaccion1",
  "almuerzo",
  "refaccion2",
  "cena",
];

function getMenuDayData(menu: GeneratedMenu, dayKey: string): any {
  const wm = menu.menuData?.weeklyMenu;
  if (!wm) return null;
  if (dayKey === "domingo") {
    const v2 = wm.domingoV2;
    if (v2?.desayuno) return v2;
    return wm.domingo ?? null;
  }
  return wm[dayKey] ?? null;
}

function getMealKeys(dayData: any): string[] {
  if (!dayData) return [];
  const order: string[] = dayData.mealsOrder?.length
    ? dayData.mealsOrder
    : PLAN_MEAL_ORDER;
  return order.filter((k: string) => dayData[k]?.title);
}

function getOrderedDayKeys(menuStartDate: string): string[] {
  const jsDay = new Date(menuStartDate + "T12:00:00").getDay();
  const startIdx = jsDay === 0 ? 6 : jsDay - 1;
  return [
    ...PLAN_DAY_KEYS.slice(startIdx),
    ...PLAN_DAY_KEYS.slice(0, startIdx),
  ];
}

/** Count total meal slots from the menu structure × plan duration, and completed from tracking_data */
function calcPlanCompliance(
  menu: GeneratedMenu,
  tracking: TrackingRow,
): { completed: number; total: number } {
  if (!tracking.menuStartDate) return { completed: 0, total: 0 };
  const orderedKeys = getOrderedDayKeys(tracking.menuStartDate);
  const start = new Date(tracking.menuStartDate + "T12:00:00");
  let total = 0;
  let completed = 0;

  for (let i = 0; i < tracking.durationDays; i++) {
    const dayKey = orderedKeys[i % 7];
    const dayData = getMenuDayData(menu, dayKey);
    const mealKeys = getMealKeys(dayData);
    total += mealKeys.length;

    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (const mk of mealKeys) {
      if (tracking.trackingData[dateStr]?.[mk]?.completed === true) completed++;
    }
  }
  return { completed, total };
}

function diffDays(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86400000,
  );
}

// ─── Plan status ──────────────────────────────────────────────────────────────

type PlanStatus = "unconfigured" | "not_started" | "active" | "finished";

function getPlanStatus(tracking: TrackingRow | null | undefined): PlanStatus {
  if (tracking === undefined) return "unconfigured"; // still loading
  if (!tracking) return "unconfigured";
  if (!tracking.menuStartDate) return "not_started";
  const today = todayStr();
  if (tracking.menuEndDate && today > tracking.menuEndDate) return "finished";
  return "active";
}

// ─── Message template ─────────────────────────────────────────────────────────

const DEFAULT_MESSAGE_TEMPLATE = `¡Hola! Te comparto tu menú digital. Puedes acceder a través del siguiente link: {link} y accede con este pin de acceso: {pin}. Te recomiendo usar esta página todos los días para poder medir tu progreso y llevar contigo tu plan alimenticio.`;

const MESSAGE_TEMPLATE_KEY = "nutriflow_portal_message_template";

// ─── Banner dismiss key ───────────────────────────────────────────────────────

function bannerDismissKey(patientId: string): string {
  return `nutriflow_newer_menu_dismissed_${patientId}`;
}

// ─── Step lock overlay ───────────────────────────────────────────────────────

const StepLockOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute inset-0 bg-white/75 rounded-xl z-10 flex items-center justify-center">
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
      <Lock className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-xs font-semibold text-slate-500">{message}</span>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const PatientDigitalMenu: React.FC<Props> = ({ patient, onUpdate }) => {
  const menus: GeneratedMenu[] = [...(patient.menus ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt ?? b.date).getTime() -
      new Date(a.createdAt ?? a.date).getTime(),
  );

  // ── Core state ──
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(
    menus[0]?.id ?? "",
  );
  const [pinInput, setPinInput] = useState(patient.accessCode ?? "");
  const [savingPin, setSavingPin] = useState(false);
  const [pinLocked, setPinLocked] = useState(true);

  // ── Tracking state ──
  const [tracking, setTracking] = useState<TrackingRow | null | undefined>(
    undefined,
  );
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [durationDays, setDurationDays] = useState(28);
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Portal goal state ──
  const [portalGoal, setPortalGoal] = useState(patient.portalGoal ?? "");
  const [savingGoal, setSavingGoal] = useState(false);
  const [savedGoal, setSavedGoal] = useState(false);

  // ── Measurements detail visibility ──
  const nutriDefault = authStore.getCurrentUser()?.profile?.portalConfig?.measurementsDetailDefault ?? true;
  const [showMeasurementsDetail, setShowMeasurementsDetail] = useState(
    patient.portalShowMeasurementsDetail ?? nutriDefault,
  );
  const [savingMeasVis, setSavingMeasVis] = useState(false);

  // ── Message template state ──
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    const profileMsg = authStore.getCurrentUser()?.profile?.shareDigitalMenuMessage;
    if (profileMsg) return profileMsg;
    return localStorage.getItem(MESSAGE_TEMPLATE_KEY) ?? DEFAULT_MESSAGE_TEMPLATE;
  });
  const [copiedMessage, setCopiedMessage] = useState(false);
  const saveTemplateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingTemplate, setEditingTemplate] = useState(false);

  // ── Step progression ──
  const [paso2Saved, setPaso2Saved] = useState<boolean>(() => !!(patient.portalGoal));

  // ── Extend plan state ──
  const [extendMode, setExtendMode] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);

  // ── Newer menu banner ──
  const [newerMenu, setNewerMenu] = useState<GeneratedMenu | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  const menuSelectorRef = useRef<HTMLDivElement>(null);

  const portalUrl = patient.accessToken
    ? `${getPortalBase()}/p/${patient.accessToken}`
    : null;

  // ── Load tracking when selectedMenuId changes ──
  const loadTracking = useCallback(
    async (menuId: string) => {
      if (!menuId || !patient.portalActive) return;
      setTrackingLoading(true);
      try {
        const row = await supabaseService.getPatientTracking(
          patient.id,
          menuId,
        );
        setTracking(row);
        if (row) setDurationDays(row.durationDays);
      } finally {
        setTrackingLoading(false);
      }
    },
    [patient.id, patient.portalActive],
  );

  useEffect(() => {
    if (patient.portalActive && selectedMenuId) {
      loadTracking(selectedMenuId);
    }
  }, [selectedMenuId, patient.portalActive, loadTracking]);

  // ── Newer menu banner detection ──
  useEffect(() => {
    if (!patient.portalActive || menus.length < 2 || !selectedMenuId) return;
    const dismissed = sessionStorage.getItem(bannerDismissKey(patient.id));
    if (dismissed === "true") return;
    const newest = menus[0];
    if (newest.id !== selectedMenuId) {
      setNewerMenu(newest);
      setBannerVisible(true);
    } else {
      setNewerMenu(null);
      setBannerVisible(false);
    }
  }, [selectedMenuId, patient.portalActive, patient.id, menus]);

  // ── Portal toggle ──
  async function handleTogglePortal() {
    setLoading(true);
    try {
      const activate = !patient.portalActive;
      const patch: Parameters<typeof supabaseService.updatePatientPortal>[1] = {
        portalActive: activate,
      };
      if (activate) {
        if (!patient.accessToken) patch.accessToken = generateUUID();
        if (!patient.accessCode) patch.accessCode = generatePin();
      }
      const updated = await supabaseService.updatePatientPortal(
        patient.id,
        patch,
      );
      onUpdate({ ...patient, ...updated });
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle measurements detail ──
  async function handleToggleMeasurementsDetail() {
    const next = !showMeasurementsDetail;
    setShowMeasurementsDetail(next);
    setSavingMeasVis(true);
    try {
      const updated = await supabaseService.updatePatientPortal(patient.id, {
        portalShowMeasurementsDetail: next,
      });
      onUpdate({ ...patient, ...updated });
    } catch {
      setShowMeasurementsDetail(!next); // revert on error
    } finally {
      setSavingMeasVis(false);
    }
  }

  // ── Save portal goal ──
  async function handleSaveGoal() {
    setSavingGoal(true);
    try {
      await supabase
        .from("patients")
        .update({ portal_goal: portalGoal || null })
        .eq("id", patient.id);
      onUpdate({ ...patient, portalGoal: portalGoal || null });
      setSavedGoal(true);
      setPaso2Saved(true);
      setTimeout(() => setSavedGoal(false), 2000);
    } finally {
      setSavingGoal(false);
    }
  }

  // ── Sync pinInput when patient.accessCode changes externally ──
  useEffect(() => {
    setPinInput(patient.accessCode ?? "");
  }, [patient.accessCode]);

  // ── Regenerate PIN ──
  async function handleRegeneratePin() {
    setLoading(true);
    try {
      const newPin = generatePin();
      const updated = await supabaseService.updatePatientPortal(patient.id, {
        accessCode: newPin,
      });
      onUpdate({ ...patient, ...updated });
      setPinInput(newPin);
    } finally {
      setLoading(false);
    }
  }

  // ── Save custom PIN ──
  async function handleSavePin() {
    if (!pinInput.trim() || pinInput === patient.accessCode) return;
    setSavingPin(true);
    try {
      const updated = await supabaseService.updatePatientPortal(patient.id, {
        accessCode: pinInput.trim(),
      });
      onUpdate({ ...patient, ...updated });
    } finally {
      setSavingPin(false);
    }
  }

  // ── Copy helpers ──
  function copyToClipboard(text: string, type: "link" | "pin") {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      }
    });
  }

  // ── Save config ──
  async function handleSaveConfig() {
    if (!selectedMenuId) return;
    setSavingConfig(true);
    try {
      const row = await supabaseService.savePatientTrackingConfig(
        patient.id,
        selectedMenuId,
        durationDays,
      );
      setTracking(row);
    } finally {
      setSavingConfig(false);
    }
  }

  // ── Extend plan ──
  async function handleExtendPlan() {
    if (!newEndDate || !selectedMenuId) return;
    setExtendLoading(true);
    try {
      await supabaseService.extendPlanEndDate(
        patient.id,
        selectedMenuId,
        newEndDate,
      );
      await loadTracking(selectedMenuId);
      setExtendMode(false);
      setNewEndDate("");
    } finally {
      setExtendLoading(false);
    }
  }

  // ── Banner handlers ──
  function handleAssignNewerMenu() {
    if (!newerMenu) return;
    setSelectedMenuId(newerMenu.id);
    setBannerVisible(false);
  }

  function handleDismissBanner() {
    sessionStorage.setItem(bannerDismissKey(patient.id), "true");
    setBannerVisible(false);
  }

  // ── Plan status ──
  const paso1Saved = tracking !== null && tracking !== undefined;
  const status = getPlanStatus(tracking);

  // ── Progress data (only when active) ──
  const progressData = (() => {
    if (status !== "active" || !tracking?.menuStartDate) return null;
    const today = todayStr();
    const elapsed = Math.max(1, diffDays(tracking.menuStartDate, today) + 1);
    const totalWeeks = Math.ceil(tracking.durationDays / 7);
    const currentWeek = Math.min(Math.ceil(elapsed / 7), totalWeeks);
    const pct = Math.min(
      100,
      Math.round((elapsed / tracking.durationDays) * 100),
    );
    const selectedMenu = menus.find((m) => m.id === selectedMenuId) ?? null;
    const { completed, total } = selectedMenu
      ? calcPlanCompliance(selectedMenu, tracking)
      : { completed: 0, total: 0 };
    const compliancePct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      elapsed,
      totalWeeks,
      currentWeek,
      pct,
      completed,
      total,
      compliancePct,
    };
  })();

  // ── Composed share message ──
  const composedMessage = messageTemplate
    .replace("{link}", portalUrl ?? "—")
    .replace("{pin}", pinInput || patient.accessCode || "—");

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Menú Digital del Paciente
            </h3>
            <p className="text-xs text-slate-400">Portal móvil personalizado</p>
          </div>
        </div>
        <button
          onClick={handleTogglePortal}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            patient.portalActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          } disabled:opacity-50`}
        >
          {patient.portalActive ? (
            <>
              <Power className="w-3.5 h-3.5" /> Activo
            </>
          ) : (
            <>
              <PowerOff className="w-3.5 h-3.5" /> Inactivo
            </>
          )}
        </button>
      </div>

      {/* ── Body ── */}
      {!patient.portalActive ? (
        <div className="px-5 py-8 text-center">
          <PowerOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            Portal desactivado
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Actívalo para compartir el acceso con el paciente.
          </p>
        </div>
      ) : (
        <div className="px-5 py-5 space-y-4">
          {/* ── Banner: menú más reciente ── */}
          {bannerVisible && newerMenu && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-semibold">
                    Hay un menú más reciente disponible:
                  </span>{" "}
                  {newerMenu.name || "Sin nombre"} ({newerMenu.date})
                  <br />
                  ¿Deseas asignarlo al portal?
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAssignNewerMenu}
                  className="flex-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-1.5 transition-colors"
                >
                  Sí, asignar
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="flex-1 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg py-1.5 transition-colors"
                >
                  No por ahora
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 1: Menú activo + Duración ── */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Paso 1. Selecciona Menú Activo Para Seguimiento
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Columna 1: selector de menú */}
              <div ref={menuSelectorRef}>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Menú activo
                </label>
                {menus.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    No hay menús creados para este paciente.
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedMenuId}
                      onChange={(e) => {
                        setSelectedMenuId(e.target.value);
                        setTracking(undefined);
                        setExtendMode(false);
                      }}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || "Sin nombre"} — {m.date}
                          {m.kcalToWork ? ` (${m.kcalToWork} kcal)` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Columna 2: duración del plan */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Duración del plan (días)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) =>
                    setDurationDays(Math.max(1, Number(e.target.value)))
                  }
                  className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              {/* Columna 3: resumen del seguimiento */}
              {status === "active" && progressData ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600">
                      Seguimiento
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-600 mb-1.5">
                    Día {progressData.elapsed} de {durationDays}
                  </div>
                  <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressData.pct}%` }}
                    />
                  </div>
                  {progressData.total > 0 ? (
                    <div className="text-xs text-slate-500">
                      <span
                        className={`font-semibold ${
                          progressData.compliancePct >= 75
                            ? "text-emerald-600"
                            : progressData.compliancePct >= 50
                              ? "text-amber-500"
                              : "text-red-500"
                        }`}
                      >
                        {progressData.compliancePct}%
                      </span>{" "}
                      cumplimiento ({progressData.completed}/
                      {progressData.total})
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Sin registros aún.</p>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* Indicador de estado + botón guardar */}
            {menus.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  {trackingLoading ? (
                    <div className="h-8 bg-slate-200 animate-pulse rounded-xl" />
                  ) : (
                    <>
                      {status === "unconfigured" && (
                        <span className="inline-flex items-center gap-1.5 bg-white text-slate-500 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Portal no configurado aún
                        </span>
                      )}
                      {status === "not_started" && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Paciente aún no ha iniciado
                        </span>
                      )}
                      {status === "active" &&
                        tracking?.menuStartDate &&
                        tracking.menuEndDate && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Activo — Inició el{" "}
                            {formatDate(tracking.menuStartDate)} · Finaliza el{" "}
                            {formatDate(tracking.menuEndDate)}
                          </span>
                        )}
                      {status === "finished" && tracking?.menuEndDate && (
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Plan finalizado el{" "}
                            {formatDate(tracking.menuEndDate)}
                          </span>
                          <div className="flex gap-2 pt-1">
                            {extendMode ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="date"
                                  value={newEndDate}
                                  min={todayStr()}
                                  onChange={(e) =>
                                    setNewEndDate(e.target.value)
                                  }
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                                <button
                                  onClick={handleExtendPlan}
                                  disabled={!newEndDate || extendLoading}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                                >
                                  {extendLoading ? "Guardando..." : "Confirmar"}
                                </button>
                                <button
                                  onClick={() => {
                                    setExtendMode(false);
                                    setNewEndDate("");
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setExtendMode(true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                                >
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  Extender plan
                                </button>
                                <button
                                  onClick={() =>
                                    menuSelectorRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors"
                                >
                                  Asignar nuevo menú
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={handleSaveConfig}
                  disabled={
                    savingConfig || !selectedMenuId || menus.length === 0
                  }
                  className="self-start flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-all flex-shrink-0"
                >
                  {savingConfig ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar
                </button>
              </div>
            )}
          </div>

          {/* ── Paso 2: Objetivo del paciente ── */}
          <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            {!paso1Saved && <StepLockOverlay message="Guarda el Paso 1 para continuar" />}
            <p className="text-sm font-semibold text-slate-700">
              Paso 2. Establece Objetivo del Paciente
            </p>
            <textarea
              value={portalGoal}
              onChange={(e) => setPortalGoal(e.target.value)}
              rows={2}
              placeholder="Ej: Bajar 5 kg en 3 meses, mejorar hábitos alimenticios..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-slate-400">
                El paciente lo verá en su portal y podrá editarlo.
              </p>
              <button
                onClick={handleSaveGoal}
                disabled={savingGoal}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {savingGoal ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : savedGoal ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {savedGoal ? "Guardado" : "Guardar"}
              </button>
            </div>
          </div>

          {/* ── Paso 2b: Visibilidad de medidas ── */}
          <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-4">
            {!paso1Saved && <StepLockOverlay message="Guarda el Paso 1 para continuar" />}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700">
                  Detalle de medidas en el portal
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {showMeasurementsDetail
                    ? "El paciente puede expandir sus medidas y ver todos los datos."
                    : "El paciente solo verá la tarjeta resumida, sin poder expandirla."}
                </p>
              </div>
              <button
                onClick={handleToggleMeasurementsDetail}
                disabled={savingMeasVis}
                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                  showMeasurementsDetail ? "bg-emerald-500" : "bg-slate-300"
                }`}
                title={showMeasurementsDetail ? "Desactivar detalle" : "Activar detalle"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    showMeasurementsDetail ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Paso 3: Compartir link + PIN ── */}
          <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            {!paso2Saved && <StepLockOverlay message="Guarda el Paso 2 para continuar" />}
            <p className="text-sm font-semibold text-slate-700">
              Paso 3. Compartir Link del Portal y Pin de acceso a paciente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Columna izquierda: Link del portal */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Link del portal
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono truncate min-w-0">
                    {portalUrl ?? "—"}
                  </div>
                  {portalUrl && (
                    <>
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex-shrink-0"
                        title="Abrir portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                      <button
                        onClick={() => copyToClipboard(portalUrl, "link")}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors flex-shrink-0"
                        title="Copiar link"
                      >
                        {copiedLink ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Columna derecha: Pin de acceso */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Pin de acceso
                  </label>
                  <button
                    onClick={() => setPinLocked((v) => !v)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                      pinLocked
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                    title={pinLocked ? "Desbloquear para editar" : "Bloquear PIN"}
                  >
                    {pinLocked ? (
                      <><Lock className="w-3 h-3" /> Desbloquear</>
                    ) : (
                      <><Unlock className="w-3 h-3" /> Bloquear</>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => !pinLocked && setPinInput(e.target.value)}
                    onBlur={() => !pinLocked && handleSavePin()}
                    onKeyDown={(e) => !pinLocked && e.key === "Enter" && handleSavePin()}
                    maxLength={4}
                    placeholder="—"
                    readOnly={pinLocked}
                    className={`flex-1 border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none min-w-0 transition-all ${
                      pinLocked
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none"
                        : "bg-white border-slate-200 text-slate-600 focus:ring-2 focus:ring-emerald-300"
                    }`}
                  />
                  {savingPin && (
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin flex-shrink-0" />
                  )}
                  <button
                    onClick={() => pinInput && copyToClipboard(pinInput, "pin")}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors flex-shrink-0"
                    title="Copiar PIN"
                  >
                    {copiedPin ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                  <button
                    onClick={handleRegeneratePin}
                    disabled={loading || pinLocked}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={pinLocked ? "Desbloquea para generar PIN aleatorio" : "Generar PIN aleatorio"}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {pinLocked
                    ? "PIN bloqueado. Toca «Desbloquear» para modificarlo."
                    : "El paciente ingresa este PIN la primera vez. Puedes personalizarlo."}
                </p>
              </div>
            </div>

            {/* ── Copia y envía mensaje ── */}
            <div className="pt-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                Copia y envía este mensaje a tu paciente
              </label>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={composedMessage}
                  rows={9}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 resize-none focus:outline-none"
                />
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setEditingTemplate((v) => !v)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
                      editingTemplate
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                    }`}
                    title="Configurar mensaje predeterminado"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(composedMessage)
                    .then(() => {
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 2000);
                    });
                }}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl transition-colors"
              >
                {copiedMessage ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedMessage ? "¡Copiado!" : "Copiar Mensaje"}
              </button>

              {editingTemplate && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-slate-400">
                    Configura la plantilla base del mensaje a compartir. Usa{" "}
                    <code className="bg-slate-100 px-1 rounded">
                      {"{link}"}
                    </code>{" "}
                    y{" "}
                    <code className="bg-slate-100 px-1 rounded">{"{pin}"}</code>{" "}
                    como marcadores de posición.
                  </p>
                  <textarea
                    value={messageTemplate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMessageTemplate(val);
                      localStorage.setItem(MESSAGE_TEMPLATE_KEY, val);
                      if (saveTemplateTimeout.current) clearTimeout(saveTemplateTimeout.current);
                      saveTemplateTimeout.current = setTimeout(() => {
                        const userId = authStore.getCurrentUser()?.id;
                        if (userId) supabaseService.updateProfile(userId, { shareDigitalMenuMessage: val });
                      }, 800);
                    }}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <button
                    onClick={() => {
                      setMessageTemplate(DEFAULT_MESSAGE_TEMPLATE);
                      localStorage.removeItem(MESSAGE_TEMPLATE_KEY);
                      const userId = authStore.getCurrentUser()?.id;
                      if (userId) supabaseService.updateProfile(userId, { shareDigitalMenuMessage: DEFAULT_MESSAGE_TEMPLATE });
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Restaurar predeterminado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
