import { AppRoute } from '../../types';
import { TourChapter } from './types';

export const chapter4: TourChapter = {
  id: 4,
  title: 'Menú del paciente',
  steps: [
    {
      id: 'ch4-reenter-evaluation',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluations-row"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Entra a tu evaluación',
      body: 'Entra a la evaluación de tu paciente haciendo clic en ella (si ya estás dentro, solo haz clic en Siguiente).',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch4-create-menu',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-menu-section"]',
      placement: 'top',
      title: 'Crea el menú de esta evaluación',
      body: 'Cuando estés listo para armar el plan de alimentación, haz clic en Crear. Vas a ver un formulario con 3 secciones: cálculo nutricional, plantillas y referencias, y edición/preview. Tómate tu tiempo llenándolo, desde ahí también puedes exportar el PDF. Cuando termines y guardes, haz clic en Siguiente.',
      advanceOn: { type: 'manual' },
    },
  ],
};
