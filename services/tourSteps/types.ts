export interface TourPollCtx {
  /** ids de pacientes que ya existían cuando este paso se activó (snapshot) */
  existingPatientIds: string[];
}

export type TourAdvanceRule =
  | { type: 'click' }
  | { type: 'poll'; check: (ctx: TourPollCtx) => boolean; intervalMs?: number }
  | { type: 'route'; route: string; tab?: string }
  | { type: 'manual' };

export interface TourStep {
  id: string;
  route: string;
  tab?: string;
  /** selector CSS del elemento a resaltar. Ignorado si standalone=true. */
  target: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  advanceOn: TourAdvanceRule;
  /** texto del botón de avance manual, en vez de "Siguiente" (ej. cierre de un capítulo con una invitación distinta) */
  nextLabel?: string;
  pinnedReminder?: boolean;
  optional?: boolean;
  /** tarjeta sin spotlight, no bloquea ningún elemento real (bienvenida, cierres de capítulo, "explora esta página") */
  standalone?: boolean;
  /** dónde se posiciona la tarjeta cuando standalone=true. Default 'center'. Usa una esquina cuando el usuario necesita interactuar con la página de fondo mientras la tarjeta está abierta. */
  standalonePosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** el tour navega automáticamente a route/tab en vez de esperar que el usuario haga clic */
  autoNavigate?: boolean;
  /** se ejecuta justo antes de avanzar a este paso al siguiente — para efectos secundarios como capturar el id del paciente recién creado */
  onAdvance?: (ctx: TourPollCtx) => void;
}

export interface TourChapter {
  id: number;
  title: string;
  steps: TourStep[];
}
