import { prefsService } from './prefsService';

const EVENT_NAME = 'nutriflow:page-guides-toggled';

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
