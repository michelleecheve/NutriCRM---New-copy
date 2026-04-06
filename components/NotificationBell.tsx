import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Users, CreditCard, X } from 'lucide-react';
import { store } from '../services/store';
import { AppRoute } from '../types';

interface NotifItem {
  id: string;
  Icon: React.ElementType;
  color: 'emerald' | 'blue' | 'amber' | 'orange' | 'red';
  title: string;
  description: string;
  route: AppRoute;
}

const COLOR = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    dot: 'bg-blue-500'    },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   dot: 'bg-amber-500'   },
  orange:  { bg: 'bg-orange-50',  icon: 'text-orange-600',  dot: 'bg-orange-500'  },
  red:     { bg: 'bg-red-50',     icon: 'text-red-600',     dot: 'bg-red-500'     },
};

function buildNotifications(): NotifItem[] {
  const today = new Date().toISOString().split('T')[0];

  const appointments = store.getAppointments();
  const notifs: NotifItem[] = [];

  // 1 — Citas hoy
  const todayAppts = appointments
    .filter(a => a.date === today && a.status !== 'Cancelada')
    .sort((a, b) => a.time.localeCompare(b.time));

  if (todayAppts.length > 0) {
    const next = todayAppts[0];
    notifs.push({
      id: 'today',
      Icon: Calendar,
      color: 'emerald',
      title: `${todayAppts.length} ${todayAppts.length === 1 ? 'cita' : 'citas'} hoy`,
      description: `Próxima: ${next.patientName} a las ${next.time.slice(0, 5)}`,
      route: AppRoute.CALENDAR,
    });
  }

  // 2 — Pacientes con Menú Pendiente
  const patients = store.getPatients();
  const menuPending = patients.filter(p => p.clinical.status === 'Menú Pendiente');
  if (menuPending.length > 0) {
    const names = menuPending.slice(0, 2).map(p => `${p.firstName} ${p.lastName}`).join(', ');
    notifs.push({
      id: 'menu',
      Icon: Users,
      color: 'amber',
      title: `${menuPending.length} ${menuPending.length === 1 ? 'paciente' : 'pacientes'} con Menú Pendiente`,
      description: menuPending.length > 2 ? `${names} y ${menuPending.length - 2} más` : names,
      route: AppRoute.DASHBOARD,
    });
  }

  // 4 — Facturas pendientes o vencidas
  const invoices      = store.getInvoices();
  const pending       = invoices.filter(i => i.status === 'Pendiente' || i.status === 'Vencido');
  const vencidasCount = pending.filter(i => i.status === 'Vencido').length;
  if (pending.length > 0) {
    notifs.push({
      id: 'invoices',
      Icon: CreditCard,
      color: vencidasCount > 0 ? 'red' : 'orange',
      title: `${pending.length} ${pending.length === 1 ? 'factura' : 'facturas'} sin cobrar`,
      description: vencidasCount > 0
        ? `${vencidasCount} vencida${vencidasCount > 1 ? 's' : ''}`
        : 'Pendientes de pago',
      route: AppRoute.PAYMENTS,
    });
  }

  return notifs;
}

interface Props {
  onNavigate: (route: string) => void;
}

export const NotificationBell: React.FC<Props> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const ref                 = useRef<HTMLDivElement>(null);

  // Recalculate every time the panel opens
  useEffect(() => {
    if (isOpen) setNotifs(buildNotifications());
  }, [isOpen]);

  // Initial load
  useEffect(() => { setNotifs(buildNotifications()); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="relative p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {notifs.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {notifs.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Notificaciones</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* List */}
          {notifs.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">Todo al día</p>
              <p className="text-xs text-slate-300 mt-0.5">Sin pendientes por ahora</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifs.map(({ id, Icon, color, title, description, route }) => {
                const c = COLOR[color];
                return (
                  <button
                    key={id}
                    onClick={() => { onNavigate(route); setIsOpen(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${c.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 leading-snug">{title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0 mt-2`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-50 bg-slate-50/30">
            <p className="text-[10px] text-slate-300 text-center">
              Actualizado al abrir · datos en tiempo real
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
