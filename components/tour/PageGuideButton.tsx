import React, { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { useTourTarget } from "./useTourTarget";
import { TourSpotlight } from "./TourSpotlight";
import { TourTooltip } from "./TourTooltip";
import { HideGuidesNotice } from "./HideGuidesNotice";
import { PageGuideStep } from "./pageGuideTypes";
import {
  isPageGuidesEnabled,
  subscribePageGuidesEnabled,
  isFormGuidesEnabled,
  subscribeFormGuidesEnabled,
} from "../../services/pageGuidePrefs";

interface PageGuideButtonProps {
  steps: PageGuideStep[];
  label?: string;
  className?: string;
  /** 'dark' (default) es el botón sólido usado en la mayoría de páginas. 'light' es un botón discreto blanco/gris, usado en formularios donde no debe competir con el botón de Guardar. 'icon' es un botonsito circular con "?", pensado para ir dentro del encabezado de una sub-sección específica (ej. Tabla de Porciones) y mostrar solo los pasos de esa sub-sección. */
  variant?: "dark" | "light" | "icon";
  /** si es true, la guía arranca sola al montar el componente (una sola vez), sin esperar el click del botón — pensado para llegar desde otra página con la guía ya activa. */
  autoStart?: boolean;
  /** paso en el que arranca cuando autoStart es true — default 0 (el primero). */
  autoStartStepIndex?: number;
  /** se llama justo después de arrancar por autoStart, para que quien controla ese flag lo apague y no se vuelva a disparar en el siguiente render/mount. */
  onAutoStartConsumed?: () => void;
}

// Guía interactiva de una sola página, autocontenida: no depende del recorrido
// por capítulos ni de ningún estado persistido — cada vez que se abre empieza
// desde el paso 1. Pensado para poder repetirse cuando el usuario quiera,
// sin necesidad de "recordar" en qué paso se quedó.
export const PageGuideButton: React.FC<PageGuideButtonProps> = ({
  steps,
  label = "Guía de esta página",
  className = "",
  variant = "dark",
  autoStart = false,
  autoStartStepIndex = 0,
  onAutoStartConsumed,
}) => {
  // Las variantes 'light' e 'icon' se usan dentro de formularios (Medición,
  // Bioimpedancia, Evaluación dietética, sub-secciones del Menú) y responden al
  // interruptor de "Guías de formularios"; 'dark' responde al de "Guías de cada página".
  const isFormVariant = variant === "light" || variant === "icon";
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [enabled, setEnabled] = useState(() =>
    isFormVariant ? isFormGuidesEnabled() : isPageGuidesEnabled(),
  );
  const [showHideGuidesNote, setShowHideGuidesNote] = useState(false);

  const step = active ? steps[stepIndex] : null;
  const rect = useTourTarget(step?.target ?? null);

  useEffect(() => {
    step?.onBeforeShow?.();
  }, [step?.id]);

  useEffect(() => {
    if (isFormVariant) {
      return subscribeFormGuidesEnabled(() =>
        setEnabled(isFormGuidesEnabled()),
      );
    }
    return subscribePageGuidesEnabled(() => setEnabled(isPageGuidesEnabled()));
  }, [isFormVariant]);

  useEffect(() => {
    if (autoStart) {
      setActive(true);
      setStepIndex(autoStartStepIndex);
      onAutoStartConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const close = () => {
    setActive(false);
    setStepIndex(0);
  };

  const handleNext = () => {
    if (stepIndex + 1 >= steps.length) {
      close();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  if (!enabled) return null;

  const open = () => {
    setActive(true);
    setStepIndex(0);
  };

  return (
    <>
      {variant === "icon" ? (
        // span en vez de button: este botonsito suele ir dentro del encabezado de una
        // sub-sección, que a veces ya es un <button> clicable para expandir/colapsar —
        // anidar un <button> ahí sería HTML inválido.
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              open();
            }
          }}
          title={label}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 text-[11px] font-black cursor-pointer transition-all select-none ${className}`}
        >
          ?
        </span>
      ) : (
        <button
          type="button"
          onClick={open}
          className={
            variant === "light"
              ? `flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all ${className}`
              : `flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all ${className}`
          }
        >
          <Compass
            className={
              variant === "light" ? "w-4 h-4" : "w-4 h-4 text-emerald-400"
            }
          />
          {label}
        </button>
      )}

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
            onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
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
