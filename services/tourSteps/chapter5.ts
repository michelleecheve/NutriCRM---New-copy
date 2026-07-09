import { AppRoute } from '../../types';
import { TourChapter } from './types';

export const chapter5: TourChapter = {
  id: 5,
  title: 'Activar el portal del paciente y compartir el link',
  steps: [
    {
      id: 'ch5-go-to-menus-tab',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '[data-tour="patient-tab-menus"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Vamos al tab de Menús',
      body: 'Aquí verás el menú que acabas de crear en la lista de menús de tu paciente.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch5-activate-portal',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '[data-tour="patient-menus-digital-portal"]',
      placement: 'top',
      title: 'Activa el portal digital de tu paciente',
      body: 'Activa el menú digital del paciente para generar un link. Tu paciente podrá entrar desde su celular y ver su menú de forma interactiva. Copia y comparte ese link con tu paciente.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch5-closing',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '',
      standalone: true,
      title: '¡Completaste la práctica guiada!',
      body: 'Recorriste todo el flujo: creaste un paciente de prueba, llenaste sus datos clínicos, registraste una evaluación completa, armaste su menú y activaste su portal digital. Así de simple es tu día a día con NutriFollow.',
      advanceOn: { type: 'manual' },
    },
  ],
};
