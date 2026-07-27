import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { useTourTarget } from './useTourTarget';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';
import { HideGuidesNotice } from './HideGuidesNotice';
import { MenuGuideHub } from './MenuGuideHub';
import { MenuIllustratedStepCard } from './MenuIllustratedStepCard';
import { PageGuideStep } from './pageGuideTypes';
import { isFormGuidesEnabled, subscribeFormGuidesEnabled } from '../../services/pageGuidePrefs';
import { getMenuIntroSteps, getMenuSec1Steps, getMenuSec2Steps, getMenuSec3Steps } from './pageGuides/menuForm';

type Phase = 'intro' | 'hub' | 'sec1' | 'sec2' | 'sec3';

interface MenuFormGuideButtonProps {
  expandSec1: () => void;
  expandSec2: () => void;
  expandSec3: () => void;
  label?: string;
  className?: string;
}

// Guía ramificada de MenuAddRead: un recorrido introductorio lineal (evaluación
// asignada + panorama de las 3 secciones) que desemboca en un "hub" desde donde el
// usuario elige qué sección profundizar. Cada sub-recorrido termina regresando al
// hub en vez de cerrar la guía, para poder seguir explorando otra sección.
export const MenuFormGuideButton: React.FC<MenuFormGuideButtonProps> = ({
  expandSec1, expandSec2, expandSec3, label = 'Guía de este formulario', className = '',
}) => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [enabled, setEnabled] = useState(() => isFormGuidesEnabled());
  const [showHideGuidesNote, setShowHideGuidesNote] = useState(false);

  const stepsByPhase: Record<Exclude<Phase, 'hub'>, PageGuideStep[]> = {
    intro: getMenuIntroSteps(),
    sec1: getMenuSec1Steps(expandSec1),
    sec2: getMenuSec2Steps(expandSec2),
    sec3: getMenuSec3Steps(expandSec3),
  };

  const currentSteps = phase !== 'hub' ? stepsByPhase[phase] : [];
  const step = active && phase !== 'hub' ? currentSteps[stepIndex] : null;
  const rect = useTourTarget(step?.target ?? null);

  useEffect(() => {
    step?.onBeforeShow?.();
  }, [step?.id]);

  useEffect(() => subscribeFormGuidesEnabled(() => setEnabled(isFormGuidesEnabled())), []);

  // Pasos con waitForClickTarget no tienen botón "Siguiente": avanzan solos cuando
  // el usuario hace click en el elemento real de la app (no en la tarjeta de la guía).
  useEffect(() => {
    const selector = step?.waitForClickTarget;
    if (!selector) return;
    const handleRealClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest(selector)) {
        setStepIndex(i => i + 1);
      }
    };
    document.addEventListener('click', handleRealClick, true);
    return () => document.removeEventListener('click', handleRealClick, true);
  }, [step?.id, step?.waitForClickTarget]);

  const close = () => { setActive(false); setPhase('intro'); setStepIndex(0); };
  const goToHub = () => { setPhase('hub'); setStepIndex(0); };

  const handleNext = () => {
    if (stepIndex + 1 >= currentSteps.length) { goToHub(); return; }
    setStepIndex(i => i + 1);
  };

  const startSection = (section: 'sec1' | 'sec2' | 'sec3') => {
    setPhase(section);
    setStepIndex(0);
  };

  if (!enabled) return null;

  return (
    <>
      <button
        data-tour="menu-form-guide-btn"
        onClick={() => { setActive(true); setPhase('intro'); setStepIndex(0); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all ${className}`}
      >
        <Compass className="w-4 h-4" />
        {label}
      </button>

      {active && phase === 'hub' && (
        <MenuGuideHub onPick={startSection} onClose={close} />
      )}

      {active && step && step.illustration && (
        <MenuIllustratedStepCard
          variant={step.illustration}
          title={step.title}
          body={step.body}
          stepLabel={`Paso ${stepIndex + 1} de ${currentSteps.length}`}
          nextLabel={step.nextLabel}
          canGoBack={stepIndex > 0}
          onNext={handleNext}
          onBack={() => setStepIndex(i => Math.max(0, i - 1))}
          onPauseLater={() => setShowHideGuidesNote(true)}
          onCloseCorner={close}
        />
      )}

      {active && step && !step.illustration && (
        <>
          {step.target && <TourSpotlight rect={rect} />}
          <TourTooltip
            rect={step.target ? rect : null}
            standalone={!step.target}
            standalonePosition={step.standalonePosition}
            placement={step.placement}
            title={step.title}
            body={step.body}
            stepLabel={`Paso ${stepIndex + 1} de ${currentSteps.length}`}
            nextLabel={step.nextLabel}
            showManualNext={!step.waitForClickTarget || !!step.waitForClickShowManualNext}
            canGoBack={stepIndex > 0}
            onNext={handleNext}
            onBack={() => setStepIndex(i => Math.max(0, i - 1))}
            onPauseLater={() => setShowHideGuidesNote(true)}
            dismissLabel="Ocultar guías"
            dismissIcon="eye-off"
            onCloseCorner={close}
          />
        </>
      )}

      {showHideGuidesNote && (
        <HideGuidesNotice onClose={() => setShowHideGuidesNote(false)} />
      )}
    </>
  );
};
