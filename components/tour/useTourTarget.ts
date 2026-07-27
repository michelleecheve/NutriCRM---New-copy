import { useEffect, useState } from 'react';

type TourTargetSelector = string | string[] | null | undefined;

function measureUnion(selectors: string[]): DOMRect | null {
  let union: DOMRect | null = null;
  for (const sel of selectors) {
    // querySelectorAll (no solo el primer match) para poder resaltar una columna
    // completa de una tabla cuando varias celdas comparten el mismo data-tour.
    const els = document.querySelectorAll(sel);
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      union = union
        ? new DOMRect(
            Math.min(union.left, r.left),
            Math.min(union.top, r.top),
            Math.max(union.right, r.right) - Math.min(union.left, r.left),
            Math.max(union.bottom, r.bottom) - Math.min(union.top, r.top),
          )
        : r;
    });
  }
  return union;
}

// Resuelve uno o varios selectores CSS a un único DOMRect (unión, si son varios)
// y se re-mide en resize/scroll/mutaciones del DOM. null si no hay selector o
// el/los elemento(s) todavía no existen (ej. un modal que se está abriendo).
export function useTourTarget(selector: TourTargetSelector): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const key = Array.isArray(selector) ? selector.join('|') : selector ?? '';

  useEffect(() => {
    const selectors = Array.isArray(selector) ? selector : selector ? [selector] : [];
    if (selectors.length === 0) {
      setRect(null);
      return;
    }

    let raf: number | null = null;
    let scrolledForThisStep = false;

    // Al entrar a un paso nuevo, si su elemento no está totalmente visible, hace
    // scroll automático hacia él (una sola vez por paso) para que la usuaria no
    // tenga que desplazarse manualmente para ver el siguiente punto de la guía.
    const scrollIntoViewIfNeeded = () => {
      if (scrolledForThisStep) return;
      let el: Element | null = null;
      for (const sel of selectors) {
        el = document.querySelector(sel);
        if (el) break;
      }
      if (!el) return;
      scrolledForThisStep = true;
      const r = el.getBoundingClientRect();
      const fullyVisible = r.top >= 0 && r.bottom <= window.innerHeight;
      if (!fullyVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const measure = () => {
      setRect(measureUnion(selectors));
      scrollIntoViewIfNeeded();
    };

    const scheduleMeasure = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();

    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, true);

    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Fallback por si un elemento aparece/desaparece sin disparar la mutación observada arriba
    const interval = setInterval(measure, 500);

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
      mutationObserver.disconnect();
      clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return rect;
}
