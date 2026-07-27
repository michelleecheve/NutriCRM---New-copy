import { prefsService } from './prefsService';

const EVENT_NAME = 'nutriflow:page-guides-toggled';
const FORM_EVENT_NAME = 'nutriflow:form-guides-toggled';

export function isPageGuidesEnabled(): boolean {
  return prefsService.get('onboarding.pageGuidesEnabled', true);
}

export function setPageGuidesEnabled(enabled: boolean): void {
  prefsService.set('onboarding.pageGuidesEnabled', enabled);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribePageGuidesEnabled(cb: () => void): () => void {
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
}

// Interruptor independiente para las guías de formularios (Medición, Bioimpedancia,
// Evaluación dietética y Menú) — separado del interruptor general de guías de página.
export function isFormGuidesEnabled(): boolean {
  return prefsService.get('onboarding.formGuidesEnabled', true);
}

export function setFormGuidesEnabled(enabled: boolean): void {
  prefsService.set('onboarding.formGuidesEnabled', enabled);
  window.dispatchEvent(new CustomEvent(FORM_EVENT_NAME));
}

export function subscribeFormGuidesEnabled(cb: () => void): () => void {
  window.addEventListener(FORM_EVENT_NAME, cb);
  return () => window.removeEventListener(FORM_EVENT_NAME, cb);
}
