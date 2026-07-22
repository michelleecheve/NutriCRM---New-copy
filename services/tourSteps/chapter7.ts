import { AppRoute } from '../../types';
import { TourChapter } from './types';

export const chapter7: TourChapter = {
  id: 7,
  title: 'Cierre del recorrido y exploración de botones: Guía de formulario',
  steps: [
    {
      id: 'ch7-closing',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'config',
      target: '',
      standalone: true,
      autoNavigate: true,
      title: '¡Completaste la práctica guiada!',
      body: 'Ya conociste el recorrido completo de las pestañas de tu paciente: creaste uno de prueba, llenaste sus datos clínicos, registraste una evaluación, activaste su portal digital y revisaste Laboratorios, Fotos y Configuración. Ahora familiarízate con los formularios para crear un menú, una evaluación dietética o una medida — vas a encontrar botones de "Guía de este formulario" dentro de ellos que te darán más detalle para llenar tus registros con confianza.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch7-go-to-menus-tab',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'config',
      target: '[data-tour="patient-tab-menus"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Para darte un ejemplo...',
      body: 'Vamos a crear un menú de ejemplo. Haz clic en la pestaña "Menús".',
      advanceOn: { type: 'click' },
    },
    {
      id: 'ch7-create-menu-btn',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '[data-tour="patient-menus-new-btn"]',
      placement: 'bottom',
      title: 'Creemos un nuevo menú',
      body: 'Haz clic en "Nuevo Menú" para abrir el formulario.',
      advanceOn: { type: 'click' },
    },
    {
      id: 'ch7-menu-form-guide-btn',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '[data-tour="menu-form-guide-btn"]',
      placement: 'bottom',
      title: 'Tu guía dentro del formulario',
      body: 'En el formulario de crear menú, crear medidas y crear evaluación dietética vas a encontrar este botón como guía, para que te familiarices con cada formulario de registro de datos.',
      advanceOn: { type: 'manual' },
      nextLabel: '¡Voy a seguir explorando NutriFollow!',
    },
  ],
};
