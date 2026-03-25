import React, { useState, useEffect } from "react";
import { UtensilsCrossed, TrendingUp, User, Lock } from "lucide-react";
import { GeneratedMenu, TrackingRow } from "../../types";
import { OnboardingView } from "./OnboardingView";
import { DayMenuView } from "./DayMenuView";
import { ProgressView } from "./ProgressView";
import { ProfileView } from "./ProfileView";

// ─── Shared interfaces ────────────────────────────────────────────────────────

export interface PortalPatient {
  id: string;
  firstName: string;
  lastName: string;
  accessCode?: string;
  portalGoal?: string;
}

export interface PortalNutritionist {
  name: string;
  specialty: string;
  professionalTitle?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  personalPhone?: string;
  instagram?: string;
  website?: string;
  address?: string;
}

export interface MeasurementEntry {
  date?: string;
  weight?: number;
  height?: number;
  imc?: number;
  age?: number;
  gender?: string;
  bodyFatPct?: number;
  leanMassPct?: number;
  leanMassKg?: number;
  fatKg?: number;
  muscleKg?: number;
  boneMass?: number;
  residualMass?: number;
  biceps?: number;
  triceps?: number;
  subscapular?: number;
  supraspinal?: number;
  abdomen?: number;
  thigh?: number;
  calf?: number;
  iliacCrest?: number;
  skinfoldSum?: number;
  humerus?: number;
  femur?: number;
  wrist?: number;
  armRelaxed?: number;
  armContracted?: number;
  waist?: number;
  umbilical?: number;
  hip?: number;
  abdominalLow?: number;
  thighRight?: number;
  thighLeft?: number;
  calfGirth?: number;
  endomorfo?: number;
  mesomorfo?: number;
  ectomorfo?: number;
  diagnosticN?: string;
  subjectiveValuation?: string;
  metaComplied?: boolean;
}

export interface BioEntry {
  date?: string;
  weight?: number;
  height?: number;
  imc?: number;
  age?: number;
  gender?: string;
  bodyFatPct?: number;
  waterPct?: number;
  muscleMass?: number;
  boneMass?: number;
  visceralFat?: number;
  bmr?: number;
  metabolicAge?: number;
  physiqueRating?: number;
  waist?: number;
  umbilical?: number;
  hip?: number;
  thighLeft?: number;
  thighRight?: number;
  abdominalLow?: number;
  calfGirth?: number;
  armRelaxed?: number;
  armContracted?: number;
  metaComplied?: string;
}

interface Props {
  token: string;
  patient: PortalPatient;
  menus: GeneratedMenu[];
  activeTracking: TrackingRow | null;
  allTracking: TrackingRow[];
  nutritionist: PortalNutritionist;
  measurements?: MeasurementEntry[];
  bioMeasurements?: BioEntry[];
  onTrackingUpdate: (t: TrackingRow) => void;
}

type Tab = "menu" | "progreso" | "perfil";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function calcCompliance(trackingData: Record<string, any>): {
  completed: number;
  total: number;
} {
  let completed = 0;
  let total = 0;
  for (const day of Object.values(trackingData)) {
    if (!day || typeof day !== "object") continue;
    for (const meal of Object.values(day)) {
      if (!meal || typeof meal !== "object") continue;
      if ("completed" in (meal as any)) {
        total++;
        if ((meal as any).completed === true) completed++;
      }
    }
  }
  return { completed, total };
}

// ─── Plan finished screen ─────────────────────────────────────────────────────

interface FinishedProps {
  tracking: TrackingRow;
  nutritionist: PortalNutritionist;
}

const PlanFinishedScreen: React.FC<FinishedProps> = ({
  tracking,
  nutritionist,
}) => {
  const { completed, total } = calcCompliance(tracking.trackingData);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{
        minHeight: "calc(100vh - 64px)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="text-6xl mb-4">🏆</div>
      <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#2D5A4B" }}>
        ¡Lo lograste!
      </h1>

      {tracking.menuStartDate && tracking.menuEndDate && (
        <p className="text-sm text-gray-500 mb-5">
          Completaste tu plan del{" "}
          <span className="font-semibold text-gray-700">
            {formatDate(tracking.menuStartDate)}
          </span>{" "}
          al{" "}
          <span className="font-semibold text-gray-700">
            {formatDate(tracking.menuEndDate)}
          </span>
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-6 w-full max-w-xs">
        <div
          className="flex-1 p-4 rounded-2xl text-center"
          style={{ backgroundColor: "#E8F0EC" }}
        >
          <p className="text-2xl font-extrabold" style={{ color: "#2D5A4B" }}>
            {pct}%
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#4B7A68" }}>
            Cumplimiento
          </p>
        </div>
        <div
          className="flex-1 p-4 rounded-2xl text-center"
          style={{ backgroundColor: "#E8F0EC" }}
        >
          <p className="text-2xl font-extrabold" style={{ color: "#2D5A4B" }}>
            {completed}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#4B7A68" }}>
            Comidas ✓
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
        Contacta a tu nutricionista para continuar con tu siguiente plan.
      </p>

      {nutritionist.phone && (
        <a
          href={`https://wa.me/${nutritionist.phone.replace(/\D/g, "")}`}
          className="px-8 rounded-2xl text-white font-bold text-sm flex items-center gap-2"
          style={{ backgroundColor: "#2D5A4B", minHeight: "52px" }}
        >
          💬 Contactar a {nutritionist.name}
        </a>
      )}
    </div>
  );
};

// ─── No plan screen ───────────────────────────────────────────────────────────

const NoPlanScreen: React.FC<{ nutritionist: PortalNutritionist }> = ({
  nutritionist,
}) => (
  <div
    className="flex flex-col items-center justify-center px-6 text-center"
    style={{ minHeight: "calc(100vh - 64px)" }}
  >
    <div className="text-5xl mb-4">📋</div>
    <h1 className="text-xl font-bold text-gray-800 mb-2">Sin plan asignado</h1>
    <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
      {nutritionist.name} aún no ha asignado un plan nutricional. Contáctale
      para que configure tu acceso.
    </p>
  </div>
);

// ─── PortalShell ──────────────────────────────────────────────────────────────

export const PortalShell: React.FC<Props> = ({
  token,
  patient,
  menus,
  activeTracking,
  allTracking,
  nutritionist,
  measurements,
  bioMeasurements,
  onTrackingUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [lockedToast, setLockedToast] = useState(false);

  useEffect(() => {
    if (!lockedToast) return;
    const t = setTimeout(() => setLockedToast(false), 2500);
    return () => clearTimeout(t);
  }, [lockedToast]);

  const menuView = (() => {
    if (!activeTracking) return "no_plan";
    if (!activeTracking.menuStartDate) return "onboarding";
    const today = todayStr();
    if (activeTracking.menuEndDate && today > activeTracking.menuEndDate)
      return "finished";
    return "active";
  })();

  const activeMenu = activeTracking
    ? (menus.find((m) => m.id === activeTracking.menuId) ?? menus[0] ?? null)
    : (menus[0] ?? null);

  const tabs: {
    key: Tab;
    label: string;
    Icon: React.FC<{ className?: string }>;
  }[] = [
    { key: "menu", label: "Menú", Icon: UtensilsCrossed },
    { key: "progreso", label: "Progreso", Icon: TrendingUp },
    { key: "perfil", label: "Perfil", Icon: User },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1c1c1e",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          height: "100vh",
          backgroundColor: "white",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Content ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {activeTab === "menu" && (
            <>
              {menuView === "no_plan" && (
                <NoPlanScreen nutritionist={nutritionist} />
              )}

              {menuView === "onboarding" && (
                <OnboardingView
                  patient={patient}
                  nutritionist={nutritionist}
                  activeTracking={activeTracking}
                  onStart={onTrackingUpdate}
                />
              )}

              {menuView === "active" && activeMenu && activeTracking && (
                <DayMenuView
                  patient={patient}
                  menu={activeMenu}
                  tracking={activeTracking}
                  nutritionist={nutritionist}
                  onTrackingUpdate={onTrackingUpdate}
                />
              )}

              {menuView === "finished" && activeTracking && (
                <PlanFinishedScreen
                  tracking={activeTracking}
                  nutritionist={nutritionist}
                />
              )}
            </>
          )}

          {activeTab === "progreso" && (
            <ProgressView
              patient={patient}
              menus={menus}
              activeTracking={activeTracking}
              allTracking={allTracking}
              activeMenu={activeMenu}
              measurements={measurements}
              bioMeasurements={bioMeasurements}
            />
          )}

          {activeTab === "perfil" && (
            <ProfileView
              token={token}
              patient={patient}
              nutritionist={nutritionist}
              activeTracking={activeTracking}
            />
          )}
        </div>

        {/* ── Locked toast ── */}
        {lockedToast && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              backgroundColor: "#1A2E25",
              color: "white",
              borderRadius: "14px",
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
              whiteSpace: "nowrap",
              animation: "fadeInUp 0.2s ease",
            }}
          >
            <Lock size={14} strokeWidth={2.5} />
            Inicia tu plan para desbloquear
          </div>
        )}

        {/* ── Tab bar ── */}
        <div
          className="flex items-end"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div
            className="w-full flex items-center px-3"
            style={{
              height: "72px",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(45,90,75,0.08)",
              boxShadow: "0 -4px 24px rgba(45,90,75,0.10)",
            }}
          >
            {tabs.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              const isLocked =
                menuView === "onboarding" &&
                (key === "progreso" || key === "perfil");
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isLocked) {
                      setLockedToast(true);
                      return;
                    }
                    setActiveTab(key);
                  }}
                  className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    minHeight: "56px",
                    opacity: isLocked ? 0.45 : 1,
                  }}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <span
                      className="absolute inset-x-2 top-1 bottom-1 rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #2D5A4B 0%, #3d7a63 100%)",
                        boxShadow: "0 4px 14px rgba(45,90,75,0.35)",
                      }}
                    />
                  )}
                  <span className="relative flex flex-col items-center gap-0.5">
                    {isLocked ? (
                      <Lock
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#8FA89E",
                          strokeWidth: 2,
                        }}
                      />
                    ) : (
                      <Icon
                        className="transition-all duration-200"
                        style={{
                          width: isActive ? "20px" : "19px",
                          height: isActive ? "20px" : "19px",
                          color: isActive ? "#ffffff" : "#8FA89E",
                          strokeWidth: isActive ? 2.2 : 1.8,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: isActive ? "0.04em" : "0.02em",
                        color: isActive ? "#ffffff" : "#8FA89E",
                      }}
                    >
                      {label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      </div>
    </div>
  );
};
