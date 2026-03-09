import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
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

function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(
    authStore.isAuthenticated() ? getHomeRoute(authStore.getCurrentUser()?.role) : AppRoute.LOGIN
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  // Returns the home route based on role
  function getHomeRoute(role?: UserRole): string {
    switch (role) {
      case 'admin':         return AppRoute.ADMIN;
      case 'recepcionista': return AppRoute.MAIN_RECEPTIONIST;
      default:              return AppRoute.MAIN;
    }
  }

  const handleLogin = (role: UserRole) => {
    setCurrentRoute(getHomeRoute(role));
  };

  const handleLogout = () => {
    authStore.logout();
    setCurrentRoute(AppRoute.LOGIN);
    setSelectedPatientId(null);
  };

  const handleNavigate = (page: string) => {
    // Guard: check if current user can access this page
    if (!authStore.canAccessPage(page)) return;
    setCurrentRoute(page);
    if (page === AppRoute.DASHBOARD) {
      setSelectedPatientId(null);
    }
  };

  const handleSelectPatient = (id: string, tab?: string) => {
    setSelectedPatientId(id);
    setInitialTab(tab);
    setCurrentRoute(AppRoute.PATIENT_DETAIL);
  };

  const renderContent = () => {
    const user = authStore.getCurrentUser();

    switch (currentRoute) {
      case AppRoute.LOGIN:
        return <Login onLogin={handleLogin} />;

      // ── Nutricionista / Admin pages ──
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

      // ── Recepcionista pages ──
      case AppRoute.MAIN_RECEPTIONIST:
        return <MainPanelReceptionist onNavigate={handleNavigate} />;

      // ── Shared pages ──
      case AppRoute.CALENDAR:
        return <CalendarPage />;

      case AppRoute.PROFILE:
        return <Profile />;

      // ── Admin only ──
      case AppRoute.ADMIN:
        return <AdminPanel />;

      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  if (currentRoute === AppRoute.LOGIN) {
    return renderContent();
  }

  return (
    <Layout
      activePage={currentRoute}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;