import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { useTourTarget } from './useTourTarget';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';
import { PageGuideStep } from './pageGuideTypes';
import { isPageGuidesEnabled, subscribePageGuidesEnabled } from '../../services/pageGuidePrefs';

interface PageGuideButtonProps {
  steps: PageGuideStep[];
  label?: string;
  className?: string;
}

// Guía interactiva de una sola página, autocontenida: no depende del recorrido
// por capítulos ni de ningún estado persistido — cada vez que se abre empieza
// desde el paso 1. Pensado para poder repetirse cuando el usuario quiera,
// sin necesidad de "recordar" en qué paso se quedó.
export const PageGuideButton: React.FC<PageGuideButtonProps> = ({
  steps, label = 'Guía de esta página', className = '',
}) => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [enabled, setEnabled] = useState(() => isPageGuidesEnabled());

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
        className={`flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all ${className}`}
      >
        <Compass className="w-4 h-4 text-emerald-400" />
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
            showManualNext
            canGoBack={stepIndex > 0}
            onNext={handleNext}
            onBack={() => setStepIndex(i => Math.max(0, i - 1))}
            onPauseLater={close}
            dismissLabel="Cerrar guía"
          />
        </>
      )}
    </>
  );
};
