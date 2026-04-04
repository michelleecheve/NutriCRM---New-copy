import React, { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Loader2, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { googleCalendarService } from '../../services/googleCalendarService';

interface CalendarGoogleSyncProps {
  userId: string;
}

type Status = 'loading' | 'connected' | 'disconnected';

export const CalendarGoogleSync: React.FC<CalendarGoogleSyncProps> = ({ userId }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    googleCalendarService.loadTokens(userId).then(connected => {
      setStatus(connected ? 'connected' : 'disconnected');
      if (connected) {
        // Silently renew watch if needed
        googleCalendarService.renewWatchIfNeeded(userId).catch(() => {});
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
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Google Calendar</span>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleConnect}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
          )}
          Conectar Google Calendar
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
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Google Calendar sincronizado
      </button>

      {showMenu && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-56">
            <button
              onClick={handleRenewWatch}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Renovar sincronización
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Desconectar cuenta
            </button>
          </div>
        </>
      )}
    </div>
  );
};
