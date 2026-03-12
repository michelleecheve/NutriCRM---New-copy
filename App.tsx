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
import { supabase } from './services/supabase';

function App() {
  const [user, setUser] = useState(authStore.getCurrentUser());
  const [currentRoute, setCurrentRoute] = useState<string>(
    authStore.isAuthenticated() ? getHomeRoute(authStore.getCurrentUser()?.role) : AppRoute.LOGIN
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Listen for auth changes to update UI
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = authStore.getCurrentUser();
      setUser(currentUser);
      
      if (!session) {
        // Only redirect to login if we are NOT on the register page
        if (currentRoute !== AppRoute.REGISTER) {
          setCurrentRoute(AppRoute.LOGIN);
          setSelectedPatientId(null);
        }
      } else if (currentRoute === AppRoute.LOGIN || currentRoute === AppRoute.REGISTER) {
        setCurrentRoute(getHomeRoute(currentUser?.role));
      }
    });

    return () => subscription.unsubscribe();
  }, [currentRoute]);

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

  const handleLogout = async () => {
    await authStore.logout();
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
        return <Login onLogin={handleLogin} onNavigateToRegister={() => setCurrentRoute(AppRoute.REGISTER)} />;

      case AppRoute.REGISTER:
        return <Register onBack={() => setCurrentRoute(AppRoute.LOGIN)} onSuccess={() => setCurrentRoute(getHomeRoute(authStore.getCurrentUser()?.role))} />;

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

  if (currentRoute === AppRoute.LOGIN || currentRoute === AppRoute.REGISTER) {
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