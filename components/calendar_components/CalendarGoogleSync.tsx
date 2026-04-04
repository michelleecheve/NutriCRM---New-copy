import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, RefreshCw, AlertCircle, Upload, AlertTriangle } from 'lucide-react';
import { googleCalendarService } from '../../services/googleCalendarService';
import { Appointment } from '../../types';

interface CalendarGoogleSyncProps {
  userId: string;
  iconOnly?: boolean;
  appointments?: Appointment[];
}

type Status = 'loading' | 'connected' | 'disconnected';

export const CalendarGoogleSync: React.FC<CalendarGoogleSyncProps> = ({ userId, iconOnly = false, appointments = [] }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [watchExpired, setWatchExpired] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResult, setBulkResult] = useState<{ synced: number; skipped: number } | null>(null);

  useEffect(() => {
    googleCalendarService.loadTokens(userId).then(connected => {
      setStatus(connected ? 'connected' : 'disconnected');
      if (connected) {
        const expired = googleCalendarService.isWatchExpired();
        setWatchExpired(expired);
        // Intenta renovar automáticamente; si lo logra, quita el warning
        googleCalendarService.renewWatchIfNeeded(userId)
          .then(() => setWatchExpired(false))
          .catch(() => {}); // si falla, el warning permanece para renovación manual
      }
    });
  }, [userId]);

  const handleConnect = async () => {
    setError(null);
    setBusy(true);
    try {
      await googleCalendarService.connect(userId);
      setStatus('connected');
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo conectar con Google Calendar');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setShowMenu(false);
    setBusy(true);
    try {
      await googleCalendarService.disconnect(userId);
      setStatus('disconnected');
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const handleRenewWatch = async () => {
    setShowMenu(false);
    setBusy(true);
    try {
      await googleCalendarService.setupWatch(userId);
      setWatchExpired(false);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  // Citas sin googleEventId de los últimos 30 días hasta el futuro
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const recentPending = appointments.filter(a => !a.googleEventId && a.date >= cutoff);

  const handleBulkExport = async () => {
    setShowMenu(false);
    setBulkResult(null);
    if (recentPending.length === 0) {
      setBulkResult({ synced: 0, skipped: 0 });
      return;
    }
    setBusy(true);
    setBulkProgress({ done: 0, total: recentPending.length });
    try {
      const result = await googleCalendarService.bulkExportToGoogle(
        recentPending,
        userId,
        (done, total) => setBulkProgress({ done, total }),
      );
      setBulkResult(result);
    } catch {
      // ignore
    } finally {
      setBusy(false);
      setBulkProgress(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        {!iconOnly && <span>Google Calendar</span>}
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleConnect}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
          )}
          {!iconOnly && 'Conectar Google Calendar'}
        </button>
        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>
    );
  }

  // connected
  const pendingCount = recentPending.length;

  return (
    <div className="relative flex flex-col items-end gap-1">
      <button
        onClick={() => {
          if (watchExpired) {
            handleRenewWatch();
          } else {
            setShowMenu(v => !v);
            setBulkResult(null);
          }
        }}
        disabled={busy}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
          watchExpired
            ? 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : watchExpired ? (
          <AlertTriangle className="w-4 h-4" />
        ) : iconOnly ? (
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        {!iconOnly && (
          busy && watchExpired ? 'Renovando...' :
          bulkProgress ? `Exportando ${bulkProgress.done}/${bulkProgress.total}...` :
          watchExpired ? 'Sincronización vencida · Renovar' :
          'Google Calendar sincronizado'
        )}
      </button>

      {/* Bulk export feedback */}
      {bulkProgress && (
        <p className="text-xs text-emerald-600 font-medium">
          Exportando {bulkProgress.done} de {bulkProgress.total}...
        </p>
      )}
      {bulkResult && !bulkProgress && (
        <p className="text-xs text-emerald-700 font-medium">
          {bulkResult.synced > 0
            ? `✓ ${bulkResult.synced} cita${bulkResult.synced !== 1 ? 's' : ''} exportada${bulkResult.synced !== 1 ? 's' : ''} a Google Calendar`
            : 'Todas las citas del último mes ya estaban sincronizadas'}
          {bulkResult.skipped > 0 && ` · ${bulkResult.skipped} no se pudo${bulkResult.skipped !== 1 ? 'ieron' : ''} exportar`}
        </p>
      )}

      {showMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-72">

            {/* Bulk export */}
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Citas existentes</p>
            </div>
            <button
              onClick={handleBulkExport}
              disabled={pendingCount === 0}
              className="w-full flex items-start gap-3 px-4 py-2.5 pb-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="flex-1 text-left">
                <span className="font-medium">
                  {pendingCount > 0
                    ? `Exportar ${pendingCount} cita${pendingCount !== 1 ? 's' : ''} a Google Calendar`
                    : 'Todo sincronizado'}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  {pendingCount > 0
                    ? 'Citas de los últimos 30 días que aún no aparecen en Google Calendar'
                    : 'Las citas de los últimos 30 días ya están en Google Calendar'}
                </span>
              </span>
            </button>

            <div className="border-t border-slate-100" />

            {/* Renew watch — solo visible cuando no hay warning activo */}
            {!watchExpired && (
              <>
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Conexión</p>
                </div>
                <button
                  onClick={handleRenewWatch}
                  className="w-full flex items-start gap-3 px-4 py-2.5 pb-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="flex-1 text-left">
                    <span className="font-medium">Renovar sincronización</span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      Se renueva automáticamente al abrir NutriFollow
                    </span>
                  </span>
                </button>
              </>
            )}

            <div className="border-t border-slate-100" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Desconectar cuenta de Google
            </button>
          </div>
        </>
      )}
    </div>
  );
};
