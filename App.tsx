import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MainPanel } from './pages/MainPanel';
import { MainPanelReceptionist } from './pages/MainPanelReceptionist';
import { Dashboard } from './pages/Dashboard';
import { PatientDetail } from './pages/PatientDetail';
import { Payments } from './pages/Payments';
import { CalendarPage } from './pages/Calendar';
import { Profile } from './pages/Profile';
import { Menus } from './pages/Menus';
import { AdminPanel } from './pages/Admin';
import { AppRoute, UserRole } from './types';
import { authStore } from './services/authStore';

function getHomeRoute(role?: UserRole): string {
  switch (role) {
    case 'admin':         return AppRoute.ADMIN;
    case 'recepcionista': return AppRoute.MAIN_RECEPTIONIST;
    default:              return AppRoute.MAIN;
  }
}

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>(AppRoute.LOGIN);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Suscribirse a cuando authStore termina de cargar
    const unsub = authStore.onAuthReady(() => {
      const user = authStore.getCurrentUser();
      setIsAuthReady(true);

      if (user) {
        setCurrentRoute(prev => {
          // Solo redirigir si estamos en login/register
          if (prev === AppRoute.LOGIN || prev === AppRoute.REGISTER) {
            return getHomeRoute(user.role);
          }
          return prev;
        });
      } else {
        setCurrentRoute(prev => {
          if (prev !== AppRoute.REGISTER) return AppRoute.LOGIN;
          return prev;
        });
        setSelectedPatientId(null);
      }
    });

    return () => unsub();
  }, []);

  const handleLogin = (role: UserRole) => {
    setCurrentRoute(getHomeRoute(role));
  };

  const handleLogout = async () => {
    await authStore.logout();
    setCurrentRoute(AppRoute.LOGIN);
    setSelectedPatientId(null);
  };

  const handleNavigate = (page: string) => {
    if (!authStore.canAccessPage(page)) return;
    setCurrentRoute(page);
    if (page === AppRoute.DASHBOARD) setSelectedPatientId(null);
  };

  const handleSelectPatient = (id: string, tab?: string) => {
    setSelectedPatientId(id);
    setInitialTab(tab);
    setCurrentRoute(AppRoute.PATIENT_DETAIL);
  };

  // ── Pantalla de loading mientras authStore carga ──
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-bold text-lg">NutriCRM</p>
          <p className="text-slate-400 text-sm mt-1">Cargando...</p>
        </div>
        <div className="flex gap-1 mt-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.LOGIN:
        return <Login onLogin={handleLogin} onNavigateToRegister={() => setCurrentRoute(AppRoute.REGISTER)} />;

      case AppRoute.REGISTER:
        return <Register onBack={() => setCurrentRoute(AppRoute.LOGIN)} onSuccess={() => setCurrentRoute(getHomeRoute(authStore.getCurrentUser()?.role))} />;

      case AppRoute.MAIN:
        return <MainPanel onSelectPatient={handleSelectPatient} />;

      case AppRoute.DASHBOARD:
        return <Dashboard onSelectPatient={handleSelectPatient} />;

      case AppRoute.PATIENT_DETAIL:
        if (!selectedPatientId) return <Dashboard onSelectPatient={handleSelectPatient} />;
        return (
          <PatientDetail
            patientId={selectedPatientId}
            initialTab={initialTab}
            onBack={() => handleNavigate(AppRoute.DASHBOARD)}
          />
        );

      case AppRoute.PAYMENTS:
        return <Payments />;

      case AppRoute.MENUS:
        return <Menus onSelectPatient={handleSelectPatient} />;

      case AppRoute.MAIN_RECEPTIONIST:
        return <MainPanelReceptionist onNavigate={handleNavigate} />;

      case AppRoute.CALENDAR:
        return <CalendarPage />;

      case AppRoute.PROFILE:
        return <Profile />;

      case AppRoute.ADMIN:
        return <AdminPanel />;

      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  if (currentRoute === AppRoute.LOGIN || currentRoute === AppRoute.REGISTER) {
    return renderContent();
  }

  return (
    <Layout activePage={currentRoute} onNavigate={handleNavigate} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}

export default App;