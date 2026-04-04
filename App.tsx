import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
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
import { Landing } from './pages/Landing';

const OAUTH_CALLBACK_ROUTE = '__oauth_callback__';

// Maps URL paths to app routes so deep links and OAuth callbacks work correctly.
// Unknown paths are left as AppRoute.LANDING — onAuthReady redirects
// authenticated users away from it to their home page.
const PATH_TO_ROUTE: Record<string, string> = {
  '/login':         AppRoute.LOGIN,
  '/register':      AppRoute.REGISTER,
  '/reset-password':AppRoute.RESET_PASSWORD,
  '/calendar':      AppRoute.CALENDAR,
  '/payments':      AppRoute.PAYMENTS,
  '/profile':       AppRoute.PROFILE,
  '/menus':         AppRoute.MENUS,
  '/dashboard':     AppRoute.DASHBOARD,
  '/admin':         AppRoute.ADMIN,
};

function getInitialRoute(): string {
  const path = window.location.pathname;

  if (path.startsWith('/privacy-policy'))   { window.location.replace('/privacy-policy.html');   return AppRoute.LANDING; }
  if (path.startsWith('/terms-of-service')) { window.location.replace('/terms-of-service.html'); return AppRoute.LANDING; }

  // OAuth popup callback — post code to opener and close this window
  if (path === '/oauth/google/callback') {
    const params = new URLSearchParams(window.location.search);
    if (window.opener) {
      window.opener.postMessage(
        { type: 'GOOGLE_OAUTH_CALLBACK', code: params.get('code'), error: params.get('error') },
        window.location.origin,
      );
      window.close();
    }
    return OAUTH_CALLBACK_ROUTE;
  }

  return PATH_TO_ROUTE[path] ?? AppRoute.LANDING;
}

function getHomeRoute(role?: UserRole): string {
  switch (role) {
    case 'admin':         return AppRoute.ADMIN;
    case 'recepcionista': return AppRoute.MAIN_RECEPTIONIST;
    default:              return AppRoute.MAIN;
  }
}

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute());
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Suscribirse a cuando authStore termina de cargar
    const unsub = authStore.onAuthReady(() => {
      const user = authStore.getCurrentUser();
      setIsAuthReady(true);

      if (user) {
        setCurrentRoute(prev => {
          // Redirect to home from any unauthenticated-only page or unknown URL (LANDING)
          if (
            prev === AppRoute.LOGIN ||
            prev === AppRoute.REGISTER ||
            prev === AppRoute.LANDING
          ) {
            return getHomeRoute(user.role);
          }
          return prev;
        });
      } else {
        setCurrentRoute(prev => {
          if (
            prev === AppRoute.REGISTER ||
            prev === AppRoute.RESET_PASSWORD ||
            prev === AppRoute.LOGIN ||
            prev === AppRoute.LANDING
          ) return prev;
          return AppRoute.LANDING;
        });
        setSelectedPatientId(null);
      }
    });

    // Detectar cuando Supabase manda un token de recuperación de contraseña
    const unsubRecovery = authStore.onPasswordRecovery(() => {
      setIsAuthReady(true);
      setCurrentRoute(AppRoute.RESET_PASSWORD);
    });

    return () => { unsub(); unsubRecovery(); };
  }, []);

  const handleLogin = (role: UserRole) => {
    setCurrentRoute(getHomeRoute(role));
  };

  const handleLogout = async () => {
    await authStore.logout();
    window.location.href = '/login';
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
        <div className="animate-pulse">
          <img src="/logo_nutrifollow.png" alt="NutriFollow" className="w-16 h-16 rounded-2xl object-contain" />
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-bold text-lg">NutriFollow</p>
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
      case OAUTH_CALLBACK_ROUTE:
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Autorizando con Google... Esta ventana se cerrará.</p>
          </div>
        );

      case AppRoute.LANDING:
        return <Landing />;

      case AppRoute.LOGIN:
        return <Login onLogin={handleLogin} onNavigateToRegister={() => setCurrentRoute(AppRoute.REGISTER)} onNavigateToLanding={() => setCurrentRoute(AppRoute.LANDING)} />;

      case AppRoute.REGISTER:
        return <Register onBack={() => setCurrentRoute(AppRoute.LOGIN)} onSuccess={() => setCurrentRoute(getHomeRoute(authStore.getCurrentUser()?.role))} />;

      case AppRoute.RESET_PASSWORD:
        return <ResetPassword onSuccess={() => setCurrentRoute(AppRoute.LOGIN)} />;

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
        return <Profile onLogout={handleLogout} />;

      case AppRoute.ADMIN:
        return <AdminPanel />;

      default:
        return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentRoute(AppRoute.LANDING)} />;
    }
  };

  if (currentRoute === AppRoute.LANDING || currentRoute === AppRoute.LOGIN || currentRoute === AppRoute.REGISTER || currentRoute === AppRoute.RESET_PASSWORD) {
    return renderContent();
  }

  return (
    <Layout activePage={currentRoute} onNavigate={handleNavigate} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}

export default App;