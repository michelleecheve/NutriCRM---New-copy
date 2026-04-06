import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Users, LogOut, HeartPulse, Settings,
  ChevronDown, CreditCard, User, Eye, EyeOff, Home,
  ClipboardList, ShieldCheck, Menu, X
} from 'lucide-react';
import { AppRoute, UserProfile } from '../types';
import { authStore } from '../services/authStore';
import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, onLogout }) => {
  const [user, setUser]                             = useState<UserProfile>(authStore.getUserProfile());
  const [isProfileMenuOpen, setIsProfileMenuOpen]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen]     = useState(false);
  // Sidebar mode: auto-open on desktop (≥1024px), closed on tablet/mobile
  const [isSidebarOpen, setIsSidebarOpen]           = useState(window.innerWidth >= 1024);

  const currentUser = authStore.getCurrentUser();
  const role        = currentUser?.role ?? 'nutricionista';
  const navbarConfig = user.navbarConfig ?? 'sidebar';

  // Re-read profile when page changes or profile-updated event fires
  const refreshUser = useCallback(() => {
    setUser(authStore.getUserProfile());
  }, []);

  useEffect(() => {
    refreshUser();
  }, [activePage]);

  useEffect(() => {
    window.addEventListener('nutriflow-profile-updated', refreshUser);
    return () => window.removeEventListener('nutriflow-profile-updated', refreshUser);
  }, [refreshUser]);

  // Close mobile menu when navigating
  const handleNavigate = (route: string) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
    // In sidebar mode on tablet/mobile, also close sidebar
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const roleLabel: Record<string, string> = {
    admin:          'Administrador',
    nutricionista:  user.specialty || 'Nutricionista',
    recepcionista:  'Recepcionista',
  };

  // ── Shared nav items ─────────────────────────────────────────────────────────
  const NavItem = ({
    route,
    icon: Icon,
    label,
    extraActiveRoutes = [],
    compact = false,
  }: {
    route: string;
    icon: React.ElementType;
    label: string;
    extraActiveRoutes?: string[];
    compact?: boolean;
  }) => {
    const isActive = activePage === route || extraActiveRoutes.includes(activePage);
    return (
      <button
        onClick={() => handleNavigate(route)}
        className={`flex items-center gap-3 rounded-xl transition-all duration-200 font-medium
          ${compact
            ? 'px-3 py-2 text-sm'
            : 'w-full px-4 py-3'
          }
          ${isActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span>{label}</span>
      </button>
    );
  };

  // ── Shared nav links list ────────────────────────────────────────────────────
  const NavLinks = ({ compact = false }: { compact?: boolean }) => (
    <>
      {(role === 'nutricionista' || role === 'admin') && (
        <NavItem route={AppRoute.MAIN} icon={Home} label="Inicio" compact={compact} />
      )}
      {(role === 'recepcionista' || role === 'admin') && (
        <NavItem route={AppRoute.MAIN_RECEPTIONIST} icon={Home} label="Inicio" compact={compact} />
      )}
      {(role === 'nutricionista' || role === 'admin') && (
        <NavItem route={AppRoute.DASHBOARD} icon={Users} label="Pacientes" extraActiveRoutes={[AppRoute.PATIENT_DETAIL]} compact={compact} />
      )}
      {(role === 'nutricionista' || role === 'admin') && (
        <NavItem route={AppRoute.MENUS} icon={ClipboardList} label="Menús" compact={compact} />
      )}
      {(role === 'nutricionista' || role === 'admin') && (
        <NavItem route={AppRoute.PAYMENTS} icon={CreditCard} label="Pagos" compact={compact} />
      )}
      <NavItem route={AppRoute.CALENDAR} icon={Calendar} label="Calendario" compact={compact} />
      <NavItem route={AppRoute.PROFILE} icon={Settings} label="Configuración" compact={compact} />
      {role === 'admin' && (
        <NavItem route={AppRoute.ADMIN} icon={ShieldCheck} label="Administración" compact={compact} />
      )}
    </>
  );

  // ── Shared user dropdown ─────────────────────────────────────────────────────
  const UserMenu = () => (
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
            <span className="text-slate-600 font-bold text-sm">{user.name.charAt(0)}</span>
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
            onClick={() => { setIsProfileMenuOpen(false); handleNavigate(AppRoute.PROFILE); }}
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
  );

  // ── Mobile/tablet drawer (shared between both modes) ─────────────────────────
  const MobileDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <div
        className={`fixed inset-0 z-50 bg-white flex flex-col transition-all duration-300 ease-in-out lg:hidden
          ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">NutriFollow</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu Principal</p>
          <NavLinks />
        </nav>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TOPNAV MODE
  // ════════════════════════════════════════════════════════════════════════════
  if (navbarConfig === 'topnav') {
    return (
      <div className="flex flex-col h-screen bg-[#F9FAFB] font-sans text-slate-600">

        {/* Top navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 flex-shrink-0">
          {/* Left: hamburger (mobile/tablet) + logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors lg:hidden"
              title="Menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">NutriFollow</span>
            </div>
          </div>

          {/* Center: nav links (desktop only) */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLinks compact />
          </nav>

          {/* Right: notifications + user menu */}
          <div className="flex items-center gap-1">
            {role === 'nutricionista' && <NotificationBell onNavigate={onNavigate} />}
            <UserMenu />
          </div>
        </header>

        {/* Mobile/tablet drawer */}
        <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SIDEBAR MODE (default)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-slate-600">

      {/* Backdrop (mobile/tablet only) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
          fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-20
          ${isSidebarOpen ? 'w-full lg:w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10'}`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 min-w-[18rem]">
          <div className="flex items-center gap-3">
            <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">NutriFollow</span>
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
          <NavLinks />
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {/* Tablet/mobile: always show hamburger */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors lg:hidden"
              title="Menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Desktop: show only when sidebar is closed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors animate-in fade-in slide-in-from-left-2 hidden lg:block"
                title="Mostrar Menú"
              >
                <Eye className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {role === 'nutricionista' && <NotificationBell onNavigate={onNavigate} />}
            <UserMenu />
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
