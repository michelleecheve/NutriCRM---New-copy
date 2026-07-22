import { AppRoute } from '../../types';
import { TourChapter } from './types';

export const chapter2: TourChapter = {
  id: 2,
  title: 'Ingresar datos clínicos',
  steps: [
    {
      id: 'ch2-enter-patient',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'clinical',
      target: '[data-tour="patient-tabs-bar"]',
      autoNavigate: true,
      placement: 'bottom',
      title: 'Ya tienes tu primer paciente',
      body: 'Aquí en estas pestañas encontrarás los archivos de tu paciente y de tus evaluaciones.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch2-fill-clinical',
      route: AppRoute.PATIENT_DETAIL,
      tab: 'clinical',
      target: '',
      standalone: true,
      standalonePosition: 'bottom-left',
      title: 'Empecemos con la página de Clínica',
      body: 'Aquí registras la historia clínica de tu paciente: motivo de consulta, antecedentes, alergias, medicamentos, etc. Llena algunos campos con datos de prueba y ==no olvides guardar, cada pestaña se guarda por separado==. Cuando termines, haz clic en Siguiente.',
      advanceOn: { type: 'manual' },
    },
  ],
};
