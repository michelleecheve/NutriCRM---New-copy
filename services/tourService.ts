import { prefsService } from './prefsService';
import { chapters, getChapter } from './tourSteps';
import { TourStep } from './tourSteps/types';

const TOTAL_CHAPTERS = 7;

class TourService {
  private listeners: Set<() => void> = new Set();

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  isActive(): boolean {
    return prefsService.get('onboarding.active', false);
  }

  // Marca un capítulo como "empezado" de forma independiente del puntero currentChapter,
  // para que el status "En progreso" de otros capítulos no se pierda solo porque el
  // usuario está ahora mismo repasando un capítulo distinto (ej. reiniciar el cap 1).
  private markStarted(chapterId: number): void {
    const started = prefsService.get<number[]>('onboarding.chaptersStarted', []);
    if (!started.includes(chapterId)) {
      prefsService.set('onboarding.chaptersStarted', [...started, chapterId]);
    }
  }

  start(): void {
    prefsService.set('onboarding.active', true);
    prefsService.set('onboarding.currentChapter', 1);
    prefsService.set('onboarding.currentStepIndex', 0);
    this.markStarted(1);
    this.notify();
  }

  pause(): void {
    prefsService.set('onboarding.active', false);
    this.notify();
  }

  resume(): void {
    prefsService.set('onboarding.active', true);
    this.notify();
  }

  getCurrentChapterId(): number {
    return prefsService.get('onboarding.currentChapter', 1);
  }

  getCurrentStepIndex(): number {
    return prefsService.get('onboarding.currentStepIndex', 0);
  }

  getCurrentStep(): TourStep | null {
    const chapter = getChapter(this.getCurrentChapterId());
    if (!chapter) return null;
    return chapter.steps[this.getCurrentStepIndex()] ?? null;
  }

  advanceStep(): void {
    const chapterId = this.getCurrentChapterId();
    const chapter = getChapter(chapterId);
    if (!chapter) return;
    const nextIndex = this.getCurrentStepIndex() + 1;
    if (nextIndex >= chapter.steps.length) {
      this.completeChapter(chapterId);
      return;
    }
    prefsService.set('onboarding.currentStepIndex', nextIndex);
    this.notify();
  }

  prevStep(): void {
    const index = this.getCurrentStepIndex();
    if (index > 0) prefsService.set('onboarding.currentStepIndex', index - 1);
    this.notify();
  }

  completeChapter(chapterId: number): void {
    const completed = prefsService.get<number[]>('onboarding.chaptersCompleted', []);
    if (!completed.includes(chapterId)) {
      prefsService.set('onboarding.chaptersCompleted', [...completed, chapterId]);
    }
    const nextChapterId = chapterId + 1;
    if (nextChapterId <= TOTAL_CHAPTERS) {
      prefsService.set('onboarding.currentChapter', nextChapterId);
      prefsService.set('onboarding.currentStepIndex', 0);
      this.markStarted(nextChapterId);
      // Si ese capítulo todavía no está construido, se pausa en vez de marcar "terminado"
      // (evita romper el chip de reanudar mientras se van agregando capítulos por fases).
      prefsService.set('onboarding.active', !!getChapter(nextChapterId));
    } else {
      prefsService.set('onboarding.active', false);
      prefsService.set('onboarding.finishedAt', new Date().toISOString());
    }
    this.notify();
  }

  resumeChapter(chapterId: number): void {
    prefsService.set('onboarding.currentChapter', chapterId);
    prefsService.set('onboarding.currentStepIndex', 0);
    prefsService.set('onboarding.active', true);
    this.markStarted(chapterId);
    this.notify();
  }

  resetChapter(chapterId: number): void {
    const completed = prefsService.get<number[]>('onboarding.chaptersCompleted', []);
    const skipped = prefsService.get<number[]>('onboarding.chaptersSkipped', []);
    prefsService.set('onboarding.chaptersCompleted', completed.filter(c => c !== chapterId));
    prefsService.set('onboarding.chaptersSkipped', skipped.filter(c => c !== chapterId));
    this.resumeChapter(chapterId);
  }

  resetAll(): void {
    prefsService.set('onboarding.active', false);
    prefsService.set('onboarding.currentChapter', 1);
    prefsService.set('onboarding.currentStepIndex', 0);
    prefsService.set('onboarding.chaptersCompleted', []);
    prefsService.set('onboarding.chaptersSkipped', []);
    prefsService.set('onboarding.chaptersStarted', []);
    prefsService.set('onboarding.finishedAt', undefined);
    this.notify();
  }

  getChapterStatus(chapterId: number): 'completed' | 'skipped' | 'in_progress' | 'not_started' {
    const completed = prefsService.get<number[]>('onboarding.chaptersCompleted', []);
    const skipped = prefsService.get<number[]>('onboarding.chaptersSkipped', []);
    const started = prefsService.get<number[]>('onboarding.chaptersStarted', []);
    if (skipped.includes(chapterId)) return 'skipped';
    if (completed.includes(chapterId)) return 'completed';
    if (started.includes(chapterId) || this.getCurrentChapterId() === chapterId) return 'in_progress';
    return 'not_started';
  }

  getDemoPatientId(): string | null {
    return prefsService.get('onboarding.demoPatientId', null);
  }

  getDemoPatientName(): string | null {
    return prefsService.get('onboarding.demoPatientName', null);
  }

  setDemoPatient(id: string, name: string): void {
    prefsService.set('onboarding.demoPatientId', id);
    prefsService.set('onboarding.demoPatientName', name);
    this.notify();
  }

  clearDemoPatient(): void {
    prefsService.set('onboarding.demoPatientId', null);
    this.notify();
  }

  hasAnyProgress(): boolean {
    const completed = prefsService.get<number[]>('onboarding.chaptersCompleted', []);
    const skipped = prefsService.get<number[]>('onboarding.chaptersSkipped', []);
    return completed.length > 0 || skipped.length > 0 || this.getCurrentStepIndex() > 0 || this.getCurrentChapterId() > 1;
  }

  get totalChapters(): number {
    return TOTAL_CHAPTERS;
  }

  get allChapters() {
    return chapters;
  }
}

export const tourService = new TourService();
