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

// Asocia los eventos de GA a un usuario real (el id de profiles, no el email —
// GA4 pide no mandar PII en el user_id) para poder ver, en "Explorador de
// usuarios" de GA4, todo el recorrido de una misma persona sin importar en
// cuántos navegadores/dispositivos entre. Requiere activar "User-ID" en
// Admin → Configuración de datos → Identidad de informes en GA4.
export function setAnalyticsUser(userId: string, role?: string): void {
  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('set', 'user_id', userId);
      if (role) gtag('set', 'user_properties', { role });
    }
  } catch {
    // no-op
  }
}

export function clearAnalyticsUser(): void {
  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('set', 'user_id', null);
    }
  } catch {
    // no-op
  }
}
