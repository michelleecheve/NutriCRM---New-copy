import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, LogOut, HeartPulse, Settings,
  ChevronDown, CreditCard, User, Eye, EyeOff, Home,
  ClipboardList, ShieldCheck
} from 'lucide-react';
import { AppRoute, UserProfile } from '../types';
import { authStore } from '../services/authStore';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, onLogout }) => {
  const [user, setUser]                     = useState<UserProfile>(authStore.getUserProfile());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]   = useState(true);

  const currentUser = authStore.getCurrentUser();
  const role        = currentUser?.role ?? 'nutricionista';

  // Refresh user info when page changes
  useEffect(() => {
    setUser(authStore.getUserProfile());
  }, [activePage]);

  // Role label shown under name in header
  const roleLabel: Record<string, string> = {
    admin:          'Administrador',
    nutricionista:  user.specialty || 'Nutricionista',
    recepcionista:  'Recepcionista',
  };

  // ── Nav item helper ──────────────────────────────────────────────────────
  const NavBtn = ({
    route,
    icon: Icon,
    label,
    extraActiveRoutes = [],
  }: {
    route: string;
    icon: React.ElementType;
    label: string;
    extraActiveRoutes?: string[];
  }) => {
    const isActive = activePage === route || extraActiveRoutes.includes(activePage);
    return (
      <button
        onClick={() => onNavigate(route)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
          isActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-slate-600">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10'
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 min-w-[18rem]">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-600/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">NutriCRM</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Ocultar Menú"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-8 px-4 space-y-1 min-w-[18rem]">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Menu Principal
          </p>

          {/* Panel Principal — nutricionista + admin */}
          {(role === 'nutricionista' || role === 'admin') && (
            <NavBtn route={AppRoute.MAIN} icon={Home} label="Panel Principal" />
          )}

          {/* Panel Principal — recepcionista */}
          {(role === 'recepcionista' || role === 'admin') && (
            <NavBtn route={AppRoute.MAIN_RECEPTIONIST} icon={Home} label="Panel Principal" />
          )}

          {/* Pacientes — nutricionista + admin */}
          {(role === 'nutricionista' || role === 'admin') && (
            <NavBtn
              route={AppRoute.DASHBOARD}
              icon={Users}
              label="Pacientes"
              extraActiveRoutes={[AppRoute.PATIENT_DETAIL]}
            />
          )}

          {/* Menús — nutricionista + admin */}
          {(role === 'nutricionista' || role === 'admin') && (
            <NavBtn route={AppRoute.MENUS} icon={ClipboardList} label="Menús" />
          )}

          {/* Pagos — nutricionista + admin */}
          {(role === 'nutricionista' || role === 'admin') && (
            <NavBtn route={AppRoute.PAYMENTS} icon={CreditCard} label="Pagos" />
          )}

          {/* Calendario — todos */}
          <NavBtn route={AppRoute.CALENDAR} icon={LayoutDashboard} label="Calendario" />

          {/* Configuración — todos */}
          <NavBtn route={AppRoute.PROFILE} icon={Settings} label="Configuración" />

          {/* Admin — solo admin */}
          {role === 'admin' && (
            <NavBtn route={AppRoute.ADMIN} icon={ShieldCheck} label="Administración" />
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100 min-w-[18rem]">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors animate-in fade-in slide-in-from-left-2"
                title="Mostrar Menú"
              >
                <Eye className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors select-none"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{roleLabel[role]}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 font-bold text-sm">
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </div>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase">Cuenta</p>
                    <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); onNavigate(AppRoute.PROFILE); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Editar Perfil
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};