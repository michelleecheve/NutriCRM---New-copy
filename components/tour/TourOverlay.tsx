import React, { useEffect, useRef, useState } from 'react';
import { tourService } from '../../services/tourService';
import { authStore } from '../../services/authStore';
import { store } from '../../services/store';
import { prefsService } from '../../services/prefsService';
import { AppRoute } from '../../types';
import { useTourTarget } from './useTourTarget';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';
import { WelcomeAnnouncement } from './WelcomeAnnouncement';
import { TourResumeNotice } from './TourResumeNotice';
import { TourPollCtx } from '../../services/tourSteps/types';

interface TourOverlayProps {
  currentRoute: string;
  currentPatientTab?: string;
  onNavigate: (route: string) => void;
  onSelectPatient: (id: string, tab?: string) => void;
}

// Overlay flotante, independiente de toda la UI existente: se monta una vez en App.tsx
// como hermano de <Layout>/<PlanLimitModal>, y solo dibuja encima (spotlight + tarjeta),
// sin modificar ningún componente de la app salvo por los atributos data-tour= que marcan
// dónde puede "engancharse" para resaltar un elemento.
export const TourOverlay: React.FC<TourOverlayProps> = ({
  currentRoute, currentPatientTab, onNavigate, onSelectPatient,
}) => {
  const [, setVersion] = useState(0);
  const [showPauseNotice, setShowPauseNotice] = useState(false);

  useEffect(() => tourService.subscribe(() => setVersion(v => v + 1)), []);

  // Solo se evalúa una vez por carga real de página (recarga del navegador), no
  // cada vez que se navega a Inicio dentro de la misma sesión sin recargar.
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    const user = authStore.getCurrentUser();
    if (!user) return;
    const eligibleRole = user.role === 'nutricionista' || user.role === 'admin';
    const shouldShow =
      eligibleRole &&
      currentRoute === AppRoute.MAIN &&
      !prefsService.get('onboarding.welcomeDismissedForever', false) &&
      !prefsService.get('onboarding.finishedAt', undefined) &&
      !tourService.isActive();
    setShowWelcome(shouldShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = tourService.isActive() ? tourService.getCurrentStep() : null;
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Navegación automática para pasos que el tour dirige él mismo (saltos entre páginas)
  useEffect(() => {
    if (!step || !step.autoNavigate) return;
    const atRoute = currentRoute === step.route;
    const atTab = !step.tab || currentPatientTab === step.tab;
    if (atRoute && atTab) return;

    if (step.route === AppRoute.PATIENT_DETAIL) {
      const demoId = tourService.getDemoPatientId();
      if (demoId) onSelectPatient(demoId, step.tab);
    } else {
      onNavigate(step.route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, currentRoute, currentPatientTab]);

  // Polling acotado: solo mientras el paso activo lo requiere, se limpia al cambiar de paso
  useEffect(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (!step || step.advanceOn.type !== 'poll') return;

    const ctx: TourPollCtx = { existingPatientIds: store.getPatients().map(p => p.id) };
    const { check, intervalMs = 1200 } = step.advanceOn;

    pollIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (check(ctx)) {
        step.onAdvance?.(ctx);
        tourService.advanceStep();
      }
    }, intervalMs);

    return () => {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    };
  }, [step?.id]);

  // Avance por cambio de ruta/tab (sin listener, solo comparación en cada render)
  useEffect(() => {
    if (!step || step.advanceOn.type !== 'route') return;
    const rule = step.advanceOn;
    if (currentRoute === rule.route && (!rule.tab || currentPatientTab === rule.tab)) {
      tourService.advanceStep();
    }
  }, [step?.id, currentRoute, currentPatientTab]);

  // Avance por clic real del usuario — delegación en document (captura), no requiere que el
  // elemento ya exista al montar el efecto (ej. un botón dentro de un modal que abre después)
  useEffect(() => {
    if (!step || step.advanceOn.type !== 'click' || !step.target) return;
    const targetSelector = step.target;
    const handler = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.closest(targetSelector)) {
        const ctx: TourPollCtx = { existingPatientIds: store.getPatients().map(p => p.id) };
        step.onAdvance?.(ctx);
        tourService.advanceStep();
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [step?.id]);

  const targetSelector = step && !step.standalone ? step.target : null;
  const rect = useTourTarget(targetSelector);

  if (showWelcome) {
    return (
      <WelcomeAnnouncement
        onStartTour={() => {
          prefsService.set('onboarding.welcomeDismissedForever', true);
          tourService.start();
          setShowWelcome(false);
        }}
        onLater={() => setShowWelcome(false)}
        onNeverShowAgain={() => {
          prefsService.set('onboarding.welcomeDismissedForever', true);
          setShowWelcome(false);
        }}
      />
    );
  }

  if (showPauseNotice) {
    return (
      <TourResumeNotice
        onClose={() => {
          tourService.pause();
          setShowPauseNotice(false);
        }}
      />
    );
  }

  const atRoute = !!step && currentRoute === step.route;
  const atTab = !!step && (!step.tab || currentPatientTab === step.tab);
  const showingStep = !!step && atRoute && atTab;

  if (!showingStep || !step) {
    // El chip flotante "Iniciar/Continuar recorrido" se quitó por ahora — se puede
    // volver a agregar aquí más adelante si se decide retomarlo.
    return null;
  }

  const chapter = tourService.allChapters.find(c => c.id === tourService.getCurrentChapterId());
  const stepNumber = tourService.getCurrentStepIndex() + 1;
  const totalSteps = chapter?.steps.length ?? 1;

  return (
    <>
      {!step.standalone && <TourSpotlight rect={rect} />}
      <TourTooltip
        rect={step.standalone ? null : rect}
        standalone={!!step.standalone}
        standalonePosition={step.standalonePosition}
        placement={step.placement}
        title={step.title}
        body={step.body}
        stepLabel={`Capítulo ${chapter?.id ?? 1} · Paso ${stepNumber} de ${totalSteps}`}
        showManualNext={step.advanceOn.type === 'manual'}
        canGoBack={tourService.getCurrentStepIndex() > 0}
        onNext={() => tourService.advanceStep()}
        onBack={() => tourService.prevStep()}
        onPauseLater={() => setShowPauseNotice(true)}
      />
    </>
  );
};
