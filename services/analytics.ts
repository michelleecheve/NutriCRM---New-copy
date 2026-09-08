// Envía eventos a Google Analytics (gtag.js, cargado directo en index.html).
// Nunca debe romper un flujo real (registro, login) si el script de GA no
// cargó (ad blockers, sin red, etc.) — por eso todo va envuelto en try/catch.
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }
  } catch {
    // no-op
  }
}
