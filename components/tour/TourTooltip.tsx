import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, Clock } from 'lucide-react';

interface TourTooltipProps {
  rect: DOMRect | null;
  standalone: boolean;
  standalonePosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  title: string;
  body: string;
  stepLabel: string;
  showManualNext: boolean;
  canGoBack: boolean;
  onNext: () => void;
  onBack: () => void;
  onPauseLater: () => void;
  dismissLabel?: string;
}

const MARGIN = 14;

function computePosition(
  rect: DOMRect,
  placement: TourTooltipProps['placement'],
  size: { w: number; h: number },
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fits = {
    bottom: rect.bottom + MARGIN + size.h <= vh,
    top: rect.top - MARGIN - size.h >= 0,
    right: rect.right + MARGIN + size.w <= vw,
    left: rect.left - MARGIN - size.w >= 0,
  };

  let actual: 'bottom' | 'top' | 'right' | 'left' =
    placement && placement !== 'auto' ? placement : 'bottom';
  if (!fits[actual]) {
    actual = (['bottom', 'top', 'right', 'left'] as const).find(p => fits[p]) ?? 'bottom';
  }

  let top = 0;
  let left = 0;
  switch (actual) {
    case 'bottom': top = rect.bottom + MARGIN; left = rect.left; break;
    case 'top': top = rect.top - MARGIN - size.h; left = rect.left; break;
    case 'right': top = rect.top; left = rect.right + MARGIN; break;
    case 'left': top = rect.top; left = rect.left - MARGIN - size.w; break;
  }

  left = Math.min(Math.max(8, left), vw - size.w - 8);
  top = Math.min(Math.max(8, top), vh - size.h - 8);
  return { top, left };
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  rect, standalone, standalonePosition = 'center', placement, title, body, stepLabel,
  showManualNext, canGoBack, onNext, onBack, onPauseLater, dismissLabel = 'Continuar después',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (standalone || !rect || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    setPos(computePosition(rect, placement, { w: width, h: height }));
  }, [rect, standalone, placement, title, body]);

  const CORNER_OFFSET = 24;
  const cornerStyle: Record<string, React.CSSProperties> = {
    'top-left': { top: CORNER_OFFSET, left: CORNER_OFFSET },
    'top-right': { top: CORNER_OFFSET, right: CORNER_OFFSET },
    'bottom-left': { bottom: CORNER_OFFSET, left: CORNER_OFFSET },
    'bottom-right': { bottom: CORNER_OFFSET, right: CORNER_OFFSET },
  };

  let style: React.CSSProperties;
  if (standalone && standalonePosition !== 'center') {
    style = { position: 'fixed', ...cornerStyle[standalonePosition] };
  } else if (standalone) {
    style = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  } else if (!rect) {
    // El elemento resaltado desapareció (ej. un formulario reemplazó al botón que
    // abrió) — se va a una esquina en vez de centrarse, para no tapar el formulario.
    style = { position: 'fixed', ...cornerStyle['bottom-right'] };
  } else {
    style = {
      position: 'fixed',
      top: pos?.top ?? -9999,
      left: pos?.left ?? -9999,
      visibility: pos ? 'visible' : 'hidden',
    };
  }

  return (
    <div
      ref={cardRef}
      style={{ ...style, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[320px] max-w-[90vw]"
    >
      <div className="mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">{stepLabel}</span>
      </div>
      <h3 className="font-bold text-slate-900 text-base mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{body}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPauseLater}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" /> {dismissLabel}
        </button>
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {showManualNext && (
            <button
              onClick={onNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
