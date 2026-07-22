import { AppRoute } from '../../types';
import { TourChapter } from './types';

export const chapter4: TourChapter = {
  id: 4,
  title: 'Activar el portal del paciente y compartir el link',
  steps: [
    {
      id: 'ch4-go-to-menus-tab',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '[data-tour="patient-tab-menus"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Vamos al tab de Menús',
      body: 'Aquí es donde aparecerán los menús de tu paciente conforme los vayas creando.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch4-activate-portal',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'menus',
      target: '[data-tour="patient-menus-digital-portal"]',
      placement: 'top',
      title: 'Activa el portal digital de tu paciente',
      body: 'Activa el menú digital del paciente para generar un link. Tu paciente podrá entrar desde su celular y ver su menú de forma interactiva. Copia y comparte ese link con tu paciente. Cuando termines, haz clic en Siguiente para seguir con Laboratorios y Fotos.',
      advanceOn: { type: 'manual' },
    },
  ],
};
