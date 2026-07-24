import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { useTourTarget } from './useTourTarget';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';
import { HideGuidesNotice } from './HideGuidesNotice';
import { PageGuideStep } from './pageGuideTypes';
import { isPageGuidesEnabled, subscribePageGuidesEnabled } from '../../services/pageGuidePrefs';

interface PageGuideButtonProps {
  steps: PageGuideStep[];
  label?: string;
  className?: string;
  /** 'dark' (default) es el botón sólido usado en la mayoría de páginas. 'light' es un botón discreto blanco/gris, usado en formularios donde no debe competir con el botón de Guardar. */
  variant?: 'dark' | 'light';
}

// Guía interactiva de una sola página, autocontenida: no depende del recorrido
// por capítulos ni de ningún estado persistido — cada vez que se abre empieza
// desde el paso 1. Pensado para poder repetirse cuando el usuario quiera,
// sin necesidad de "recordar" en qué paso se quedó.
export const PageGuideButton: React.FC<PageGuideButtonProps> = ({
  steps, label = 'Guía de esta página', className = '', variant = 'dark',
}) => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [enabled, setEnabled] = useState(() => isPageGuidesEnabled());
  const [showHideGuidesNote, setShowHideGuidesNote] = useState(false);

  const step = active ? steps[stepIndex] : null;
  const rect = useTourTarget(step?.target ?? null);

  useEffect(() => {
    step?.onBeforeShow?.();
  }, [step?.id]);

  useEffect(() => subscribePageGuidesEnabled(() => setEnabled(isPageGuidesEnabled())), []);

  const close = () => { setActive(false); setStepIndex(0); };

  const handleNext = () => {
    if (stepIndex + 1 >= steps.length) { close(); return; }
    setStepIndex(i => i + 1);
  };

  if (!enabled) return null;

  return (
    <>
      <button
        onClick={() => { setActive(true); setStepIndex(0); }}
        className={
          variant === 'light'
            ? `flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all ${className}`
            : `flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all ${className}`
        }
      >
        <Compass className={variant === 'light' ? 'w-4 h-4' : 'w-4 h-4 text-emerald-400'} />
        {label}
      </button>

      {step && (
        <>
          {step.target && <TourSpotlight rect={rect} />}
          <TourTooltip
            rect={step.target ? rect : null}
            standalone={!step.target}
            standalonePosition={step.standalonePosition}
            placement={step.placement}
            title={step.title}
            body={step.body}
            stepLabel={`Paso ${stepIndex + 1} de ${steps.length}`}
            nextLabel={step.nextLabel}
            showManualNext
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
