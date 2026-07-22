import { AppRoute } from '../../types';
import { TourChapter } from './types';

// Cubre desde entrar a la pestaña de Evaluaciones hasta explorar cada sección de
// una evaluación: notas, dietética, medidas, somatocarta, menú, laboratorios y
// fotos. El menú solo se muestra como overview (qué hace el formulario) — armarlo
// paso a paso queda para una guía futura, por eso su target es la tarjeta completa
// y no exige llenarlo. Igual con el resto de secciones: se resalta la tarjeta
// completa (no solo el botón "Crear") para que el highlight no desaparezca justo
// cuando el formulario se abre — eso hacía que la tarjeta del tour se recentrara y
// tapara el formulario.
export const chapter3: TourChapter = {
  id: 3,
  title: 'Crear una evaluación',
  steps: [
    {
      id: 'ch3-go-to-evaluations',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'clinical',
      target: '[data-tour="patient-tab-appointments"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Ahora vamos a Evaluaciones',
      body: 'Haz clic en la pestaña "Evaluaciones".',
      advanceOn: { type: 'click' },
    },
    {
      id: 'ch3-create-evaluation-btn',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluations-create-today-btn"]',
      placement: 'bottom',
      title: 'Crea tu evaluación de hoy',
      body: 'Cada consulta que tengas con tu paciente empieza creando una evaluación. Haz clic en "Crear evaluación de hoy" (si ya la habías creado antes, solo haz clic en Siguiente).',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch3-enter-evaluation',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluations-row"]',
      placement: 'bottom',
      title: 'Entra a la evaluación creada',
      body: 'Haz clic en la evaluación que acabas de crear para abrirla.',
      advanceOn: { type: 'click' },
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
      id: 'ch3-menu',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'appointments',
      target: '[data-tour="evaluation-menu-section"]',
      placement: 'top',
      title: 'El menú de esta evaluación',
      body: 'Cuando estés listo para armar el plan de alimentación, puedes crearlo desde aquí en Crear. Vas a ver un formulario mucho más extenso, con 3 secciones: cálculo nutricional, plantillas y referencias, y edición/preview con opción a exportar en PDF. No te preocupes ahorita por aprender a hacerlo solo, más adelante te enseñaremos paso a paso.',
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
      body: 'Y aquí subes las fotos de progreso de esta consulta. Cuando termines de explorar esta evaluación, haz clic en Siguiente.',
      advanceOn: { type: 'manual' },
    },
  ],
};
