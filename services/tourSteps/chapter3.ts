import { AppRoute } from '../../types';
import { TourChapter } from './types';

// Dentro de la evaluación recién creada. El menú queda excluido a propósito —
// eso es el Capítulo 4. Los targets son la sección/tarjeta completa (no solo el
// botón "Crear") para que el highlight no desaparezca justo cuando el formulario
// se abre — eso hacía que la tarjeta del tour se recentrara y tapara el formulario.
export const chapter3: TourChapter = {
  id: 3,
  title: 'Llenar los datos de una evaluación',
  steps: [
    {
      id: 'ch3-reenter-evaluation',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluations-row"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Retomemos donde te quedaste',
      body: 'Entra de nuevo a la evaluación que creaste haciendo clic en ella (si ya estás dentro, solo haz clic en Siguiente).',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-notes',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-notes-section"]',
      placement: 'bottom',
      title: 'Notas de evaluación',
      body: 'Aquí puedes escribir observaciones generales de esta consulta: cómo llegó tu paciente, cómo se sintió, cualquier nota clínica relevante del día.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-dietary',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-dietary-section"]',
      placement: 'top',
      title: 'Evaluación dietética',
      body: 'Cuando estés listo para preguntarle a tu paciente qué comió y su frecuencia de consumo de alimentos, haz clic en Crear. Tómate tu tiempo llenándola y guárdala.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-measurements',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-measurements-section"]',
      placement: 'top',
      title: 'Medidas',
      body: 'Aquí creas la medida Antropométrica o de Bioimpedancia de esta consulta. Haz la prueba con alguna de las dos.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-somatocarta',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-somatocarta-section"]',
      placement: 'top',
      title: 'Somatocarta',
      body: 'Si registraste una medida antropométrica con los datos X/Y, aquí puedes crear la carta de somatotipo de tu paciente para esta fecha.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-labs',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-labs-section"]',
      placement: 'top',
      title: 'Laboratorios',
      body: 'Aquí subes los resultados de laboratorio que te comparta tu paciente, ligados a esta fecha de evaluación.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-photos',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-photos-section"]',
      placement: 'top',
      title: 'Fotos de progreso',
      body: 'Y aquí subes las fotos de progreso de esta consulta. Cuando termines de explorar esta evaluación, haz clic en Siguiente para pasar al menú.',
      advanceOn: { type: 'manual' },
    },
  ],
};
