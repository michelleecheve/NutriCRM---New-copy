import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Smartphone, Copy, Check, RefreshCw, ChevronDown, Power, PowerOff,
  ExternalLink, Save, AlertTriangle, CalendarClock, TrendingUp,
} from 'lucide-react';
import { Patient, GeneratedMenu, TrackingRow } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../services/supabase';

interface Props {
  patient: Patient;
  onUpdate: (p: Patient) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getPortalBase(): string {
  return window.location.origin;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Count completed meals and total tracked meals in tracking_data JSONB */
function calcCompliance(trackingData: Record<string, any>): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  for (const dayData of Object.values(trackingData)) {
    if (typeof dayData !== 'object' || dayData === null) continue;
    for (const mealData of Object.values(dayData)) {
      if (typeof mealData !== 'object' || mealData === null) continue;
      if ('completed' in (mealData as any)) {
        total++;
        if ((mealData as any).completed === true) completed++;
      }
    }
  }
  return { completed, total };
}

function diffDays(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86400000
  );
}

// ─── Plan status ──────────────────────────────────────────────────────────────

type PlanStatus = 'unconfigured' | 'not_started' | 'active' | 'finished';

function getPlanStatus(tracking: TrackingRow | null | undefined): PlanStatus {
  if (tracking === undefined) return 'unconfigured'; // still loading
  if (!tracking) return 'unconfigured';
  if (!tracking.menuStartDate) return 'not_started';
  const today = todayStr();
  if (tracking.menuEndDate && today > tracking.menuEndDate) return 'finished';
  return 'active';
}

// ─── Banner dismiss key ───────────────────────────────────────────────────────

function bannerDismissKey(patientId: string): string {
  return `nutriflow_newer_menu_dismissed_${patientId}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PatientDigitalMenu: React.FC<Props> = ({ patient, onUpdate }) => {
  const menus: GeneratedMenu[] = [...(patient.menus ?? [])].sort(
    (a, b) => new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime()
  );

  // ── Core state ──
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id ?? '');

  // ── Tracking state ──
  const [tracking, setTracking] = useState<TrackingRow | null | undefined>(undefined);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [durationDays, setDurationDays] = useState(28);
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Portal goal state ──
  const [portalGoal, setPortalGoal] = useState(patient.portalGoal ?? '');
  const [savingGoal, setSavingGoal] = useState(false);
  const [savedGoal, setSavedGoal] = useState(false);

  // ── Extend plan state ──
  const [extendMode, setExtendMode] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);

  // ── Newer menu banner ──
  const [newerMenu, setNewerMenu] = useState<GeneratedMenu | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  const menuSelectorRef = useRef<HTMLDivElement>(null);

  const portalUrl = patient.accessToken
    ? `${getPortalBase()}/p/${patient.accessToken}`
    : null;

  // ── Load tracking when selectedMenuId changes ──
  const loadTracking = useCallback(async (menuId: string) => {
    if (!menuId || !patient.portalActive) return;
    setTrackingLoading(true);
    try {
      const row = await supabaseService.getPatientTracking(patient.id, menuId);
      setTracking(row);
      if (row) setDurationDays(row.durationDays);
    } finally {
      setTrackingLoading(false);
    }
  }, [patient.id, patient.portalActive]);

  useEffect(() => {
    if (patient.portalActive && selectedMenuId) {
      loadTracking(selectedMenuId);
    }
  }, [selectedMenuId, patient.portalActive, loadTracking]);

  // ── Newer menu banner detection ──
  useEffect(() => {
    if (!patient.portalActive || menus.length < 2 || !selectedMenuId) return;
    const dismissed = sessionStorage.getItem(bannerDismissKey(patient.id));
    if (dismissed === 'true') return;
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
      const patch: Parameters<typeof supabaseService.updatePatientPortal>[1] = { portalActive: activate };
      if (activate) {
        if (!patient.accessToken) patch.accessToken = generateUUID();
        if (!patient.accessCode)  patch.accessCode  = generatePin();
      }
      const updated = await supabaseService.updatePatientPortal(patient.id, patch);
      onUpdate({ ...patient, ...updated });
    } finally {
      setLoading(false);
    }
  }

  // ── Save portal goal ──
  async function handleSaveGoal() {
    setSavingGoal(true);
    try {
      await supabase.from('patients').update({ portal_goal: portalGoal || null }).eq('id', patient.id);
      onUpdate({ ...patient, portalGoal: portalGoal || null });
      setSavedGoal(true);
      setTimeout(() => setSavedGoal(false), 2000);
    } finally {
      setSavingGoal(false);
    }
  }

  // ── Regenerate PIN ──
  async function handleRegeneratePin() {
    setLoading(true);
    try {
      const updated = await supabaseService.updatePatientPortal(patient.id, { accessCode: generatePin() });
      onUpdate({ ...patient, ...updated });
    } finally {
      setLoading(false);
    }
  }

  // ── Copy helpers ──
  function copyToClipboard(text: string, type: 'link' | 'pin') {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'link') {
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
      const row = await supabaseService.savePatientTrackingConfig(patient.id, selectedMenuId, durationDays);
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
      await supabaseService.extendPlanEndDate(patient.id, selectedMenuId, newEndDate);
      await loadTracking(selectedMenuId);
      setExtendMode(false);
      setNewEndDate('');
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
    sessionStorage.setItem(bannerDismissKey(patient.id), 'true');
    setBannerVisible(false);
  }

  // ── Plan status ──
  const status = getPlanStatus(tracking);

  // ── Progress data (only when active) ──
  const progressData = (() => {
    if (status !== 'active' || !tracking?.menuStartDate) return null;
    const today = todayStr();
    const elapsed = Math.max(1, diffDays(tracking.menuStartDate, today) + 1);
    const totalWeeks = Math.ceil(tracking.durationDays / 7);
    const currentWeek = Math.min(Math.ceil(elapsed / 7), totalWeeks);
    const pct = Math.min(100, Math.round((elapsed / tracking.durationDays) * 100));
    const { completed, total } = calcCompliance(tracking.trackingData);
    const compliancePct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { elapsed, totalWeeks, currentWeek, pct, completed, total, compliancePct };
  })();

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
            <h3 className="font-semibold text-slate-800 text-sm">Menú Digital del Paciente</h3>
            <p className="text-xs text-slate-400">Portal móvil personalizado</p>
          </div>
        </div>
        <button
          onClick={handleTogglePortal}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            patient.portalActive
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          } disabled:opacity-50`}
        >
          {patient.portalActive
            ? <><Power className="w-3.5 h-3.5" /> Activo</>
            : <><PowerOff className="w-3.5 h-3.5" /> Inactivo</>
          }
        </button>
      </div>

      {/* ── Body ── */}
      {!patient.portalActive ? (
        <div className="px-5 py-8 text-center">
          <PowerOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Portal desactivado</p>
          <p className="text-xs text-slate-400 mt-1">Actívalo para compartir el acceso con el paciente.</p>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">

          {/* ── Link compartible ── */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              Link del portal
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono truncate">
                {portalUrl ?? '—'}
              </div>
              {portalUrl && (
                <>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex-shrink-0"
                    title="Abrir portal"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(portalUrl, 'link')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors flex-shrink-0"
                    title="Copiar link"
                  >
                    {copiedLink
                      ? <Check className="w-4 h-4 text-emerald-600" />
                      : <Copy className="w-4 h-4 text-emerald-600" />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── PIN ── */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              PIN de acceso
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-2xl font-bold tracking-[0.35em] text-slate-800">
                  {patient.accessCode ?? '—'}
                </span>
              </div>
              <button
                onClick={() => patient.accessCode && copyToClipboard(patient.accessCode, 'pin')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors flex-shrink-0"
                title="Copiar PIN"
              >
                {copiedPin
                  ? <Check className="w-4 h-4 text-emerald-600" />
                  : <Copy className="w-4 h-4 text-emerald-600" />}
              </button>
              <button
                onClick={handleRegeneratePin}
                disabled={loading}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex-shrink-0 disabled:opacity-50"
                title="Regenerar PIN"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              El paciente ingresa este PIN la primera vez que abre el link.
            </p>
          </div>

          {/* ── Objetivo del paciente ── */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              Objetivo del paciente
            </label>
            <textarea
              value={portalGoal}
              onChange={(e) => setPortalGoal(e.target.value)}
              rows={2}
              placeholder="Ej: Bajar 5 kg en 3 meses, mejorar hábitos alimenticios..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-400">
                El paciente lo verá en su portal y podrá editarlo.
              </p>
              <button
                onClick={handleSaveGoal}
                disabled={savingGoal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {savingGoal ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : savedGoal ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {savedGoal ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-slate-100" />

          {/* ── Banner: menú más reciente ── */}
          {bannerVisible && newerMenu && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-semibold">Hay un menú más reciente disponible:</span>{' '}
                  {newerMenu.name || 'Sin nombre'} ({newerMenu.date})
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

          {/* ── Selector de menú activo ── */}
          <div ref={menuSelectorRef}>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              Menú activo para seguimiento
            </label>
            {menus.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
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
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || 'Sin nombre'} — {m.date}
                      {m.kcalToWork ? ` (${m.kcalToWork} kcal)` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* ── Duración del plan ── */}
          {menus.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
                Duración del plan (días)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                  className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig || !selectedMenuId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  {savingConfig
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Save className="w-3.5 h-3.5" />
                  }
                  Guardar configuración
                </button>
              </div>
            </div>
          )}

          {/* ── Indicador de estado ── */}
          {menus.length > 0 && (
            <div>
              {trackingLoading ? (
                <div className="h-8 bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <>
                  {/* Status badge */}
                  {status === 'unconfigured' && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Portal no configurado aún
                    </span>
                  )}
                  {status === 'not_started' && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Paciente aún no ha iniciado
                    </span>
                  )}
                  {status === 'active' && tracking?.menuStartDate && tracking.menuEndDate && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Activo — Inició el {formatDate(tracking.menuStartDate)} · Finaliza el {formatDate(tracking.menuEndDate)}
                    </span>
                  )}
                  {status === 'finished' && tracking?.menuEndDate && (
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Plan finalizado el {formatDate(tracking.menuEndDate)}
                      </span>
                      <div className="flex gap-2 pt-1">
                        {extendMode ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="date"
                              value={newEndDate}
                              min={todayStr()}
                              onChange={(e) => setNewEndDate(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            />
                            <button
                              onClick={handleExtendPlan}
                              disabled={!newEndDate || extendLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                            >
                              {extendLoading ? 'Guardando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => { setExtendMode(false); setNewEndDate(''); }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setExtendMode(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Extender plan
                            </button>
                            <button
                              onClick={() => menuSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
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
          )}

          {/* ── Resumen visual (solo cuando activo) ── */}
          {status === 'active' && progressData && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">Resumen del seguimiento</span>
              </div>

              {/* Semana actual */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Semana {progressData.currentWeek} de {progressData.totalWeeks}</span>
                <span className="font-medium text-slate-800">{progressData.pct}% del plan</span>
              </div>

              {/* Barra de progreso del plan */}
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressData.pct}%` }}
                />
              </div>

              {/* Cumplimiento */}
              {progressData.total > 0 ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Cumplimiento general</span>
                  <span className={`font-semibold ${
                    progressData.compliancePct >= 75 ? 'text-emerald-600' :
                    progressData.compliancePct >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {progressData.compliancePct}%
                    <span className="text-slate-400 font-normal ml-1">
                      ({progressData.completed}/{progressData.total} comidas)
                    </span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sin registros de comidas aún.</p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
