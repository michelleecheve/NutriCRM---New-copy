import React, { useMemo, useState } from 'react';
import {
  ShieldCheck, Save, RotateCcw, ChevronDown, ChevronRight, Info, Bug
} from 'lucide-react';
import { authStore, DEFAULT_PERMISSIONS } from '../services/authStore';
import { PagePermission, UserRole } from '../types';

const ROLES: { key: UserRole; label: string; color: string; dot: string }[] = [
  { key: 'admin',         label: 'Admin',          color: 'text-violet-600', dot: 'bg-violet-500' },
  { key: 'nutricionista', label: 'Nutricionista',   color: 'text-emerald-600', dot: 'bg-emerald-500' },
  { key: 'recepcionista', label: 'Recepcionista',   color: 'text-blue-600',   dot: 'bg-blue-500'   },
];

// OJO: debe coincidir con la key que usa authStore
const PERMISSIONS_KEY = 'nutricrm_permissions_v1.1';

type InjectionReport = {
  injectedPages: string[];  // pageId
  injectedModules: { pageId: string; moduleId: string }[];
};

const buildInjectionReport = (stored: PagePermission[] | null, defaults: PagePermission[]): InjectionReport => {
  const report: InjectionReport = { injectedPages: [], injectedModules: [] };

  if (!stored || !Array.isArray(stored)) {
    // Si no había nada guardado, no lo consideramos "inyección": es primera vez.
    return report;
  }

  const storedPageIds = new Set(stored.map(p => p.pageId));

  for (const defPage of defaults) {
    if (!storedPageIds.has(defPage.pageId)) {
      report.injectedPages.push(defPage.pageId);
      continue;
    }

    const stPage = stored.find(p => p.pageId === defPage.pageId);
    const stModuleIds = new Set((stPage?.modules ?? []).map(m => m.moduleId));

    for (const defMod of defPage.modules ?? []) {
      if (!stModuleIds.has(defMod.moduleId)) {
        report.injectedModules.push({ pageId: defPage.pageId, moduleId: defMod.moduleId });
      }
    }
  }

  return report;
};

export const AdminPanel: React.FC = () => {
  const [permissions, setPermissions] = useState<PagePermission[]>(authStore.getPermissions());
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [saved, setSaved]             = useState(false);

  // ── Debug: detectar inyección (comparando stored vs defaults) ──────────────
  const injectionReport = useMemo(() => {
    try {
      const raw = localStorage.getItem(PERMISSIONS_KEY);
      const stored = raw ? (JSON.parse(raw) as PagePermission[]) : null;
      return buildInjectionReport(stored, DEFAULT_PERMISSIONS);
    } catch {
      return { injectedPages: [], injectedModules: [] };
    }
  }, []);

  const showInjectionBanner =
    injectionReport.injectedPages.length > 0 || injectionReport.injectedModules.length > 0;

  const toggle = (pageId: string) =>
    setExpanded(prev => ({ ...prev, [pageId]: !prev[pageId] }));

  const togglePageRole = (pageId: string, role: UserRole) => {
    setPermissions(prev =>
      prev.map(p => {
        if (p.pageId !== pageId) return p;
        const roles = p.roles.includes(role)
          ? p.roles.filter(r => r !== role)
          : [...p.roles, role];
        return { ...p, roles };
      })
    );
  };

  const toggleModuleRole = (pageId: string, moduleId: string, role: UserRole) => {
    setPermissions(prev =>
      prev.map(p => {
        if (p.pageId !== pageId || !p.modules) return p;
        return {
          ...p,
          modules: p.modules.map(m => {
            if (m.moduleId !== moduleId) return m;
            const roles = m.roles.includes(role)
              ? m.roles.filter(r => r !== role)
              : [...m.roles, role];
            return { ...m, roles };
          }),
        };
      })
    );
  };

  const handleSave = () => {
    authStore.updatePermissions(permissions);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Recomendación: mantenerlo como botón de emergencia
  const handleReset = () => {
    if (!confirm('¿Restaurar todos los permisos a los valores por defecto?')) return;
    setPermissions(DEFAULT_PERMISSIONS);
    authStore.updatePermissions(DEFAULT_PERMISSIONS);
  };

  // Checkbox UI
  const Checkbox = ({
    checked, disabled, onChange, color
  }: { checked: boolean; disabled: boolean; onChange: () => void; color: string }) => (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`w-5 h-5 rounded-[5px] flex items-center justify-center transition-all border-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? `${color} border-transparent` : 'bg-white border-slate-300 hover:border-slate-400'}`}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );

  const checkboxColor: Record<UserRole, string> = {
    admin: 'bg-violet-500',
    nutricionista: 'bg-emerald-500',
    recepcionista: 'bg-blue-500',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-violet-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
          </div>
          <p className="text-slate-500 text-sm">Controla qué rol tiene acceso a cada página y módulo del sistema.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all"
            title="Volver a los permisos por defecto"
          >
            <RotateCcw className="w-4 h-4" /> Restablecer a defaults
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all text-white
              ${saved ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Guardado ✓' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Debug banner: solo aparece si detecta inyección real */}
      {showInjectionBanner && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Bug className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">Depuración: se detectaron permisos nuevos y fueron inyectados automáticamente.</p>

            {injectionReport.injectedPages.length > 0 && (
              <p className="mt-1">
                <span className="font-bold">Páginas nuevas:</span>{' '}
                <span className="font-mono">{injectionReport.injectedPages.join(', ')}</span>
              </p>
            )}

            {injectionReport.injectedModules.length > 0 && (
              <p className="mt-1">
                <span className="font-bold">Módulos nuevos:</span>{' '}
                <span className="font-mono">
                  {injectionReport.injectedModules
                    .map(m => `${m.pageId}/${m.moduleId}`)
                    .join(', ')}
                </span>
              </p>
            )}

            <p className="mt-2 text-amber-800">
              Si esto no era esperado, revisa el historial de cambios de <span className="font-mono">DEFAULT_PERMISSIONS</span>.
            </p>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="flex gap-3 bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4">
        <Info className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-violet-700">
          Configura los permisos para cada rol, incluyendo <strong>Admin</strong>.
          Los cambios se aplican inmediatamente después de guardar.
        </p>
      </div>

      {/* Role legend */}
      <div className="flex gap-3 flex-wrap">
        {ROLES.map(r => (
          <div key={r.key} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full">
            <div className={`w-2 h-2 rounded-full ${r.dot}`} />
            <span className={`text-xs font-bold ${r.color}`}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Permissions table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_130px_130px] px-6 py-3 bg-slate-50 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Página / Módulo</span>
          {ROLES.map(r => (
            <span key={r.key} className={`text-xs font-bold uppercase tracking-wider text-center ${r.color}`}>
              {r.label}
            </span>
          ))}
        </div>

        {/* Rows */}
        {permissions.map((page, idx) => {
          const isExpanded  = expanded[page.pageId];
          const hasModules  = !!page.modules?.length;
          const isLast      = idx === permissions.length - 1;

          return (
            <div key={page.pageId}>
              {/* Page row */}
              <div className={`grid grid-cols-[1fr_100px_130px_130px] px-6 py-4 items-center
                ${!isLast || isExpanded ? 'border-b border-slate-100' : ''}`}
              >
                <div
                  className={`flex items-center gap-2 ${hasModules ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => hasModules && toggle(page.pageId)}
                >
                  {hasModules ? (
                    isExpanded
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className="text-sm font-semibold text-slate-800">{page.label}</span>
                  {hasModules && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {page.modules!.length} módulos
                    </span>
                  )}
                </div>

                {ROLES.map(role => (
                  <div key={role.key} className="flex justify-center">
                    <Checkbox
                      checked={page.roles.includes(role.key)}
                      disabled={false}
                      onChange={() => togglePageRole(page.pageId, role.key)}
                      color={checkboxColor[role.key]}
                    />
                  </div>
                ))}
              </div>

              {/* Module rows */}
              {isExpanded && page.modules?.map((mod, mIdx) => {
                const isLastMod = mIdx === page.modules!.length - 1;
                return (
                  <div
                    key={mod.moduleId}
                    className={`grid grid-cols-[1fr_100px_130px_130px] pl-14 pr-6 py-3 bg-slate-50/60 items-center
                      ${!isLastMod || !isLast ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-sm text-slate-600">{mod.label}</span>
                    </div>
                    {ROLES.map(role => (
                      <div key={role.key} className="flex justify-center">
                        <Checkbox
                          checked={mod.roles.includes(role.key)}
                          disabled={false}
                          onChange={() => toggleModuleRole(page.pageId, mod.moduleId, role.key)}
                          color={checkboxColor[role.key]}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};