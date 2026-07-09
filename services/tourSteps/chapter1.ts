import { AppRoute } from '../../types';
import { store } from '../store';
import { tourService } from '../tourService';
import { TourChapter } from './types';

export const chapter1: TourChapter = {
  id: 1,
  title: 'Bienvenida + Crear paciente',
  steps: [
    {
      id: 'ch1-welcome',
      route: AppRoute.MAIN,
      target: '',
      standalone: true,
      autoNavigate: true,
      title: '¡Bienvenido a NutriFollow!',
      body: 'Este es tu portal digital para gestionar pacientes, evaluaciones, menús y citas. En este recorrido vas a conocer rápidamente el sistema creando un paciente de prueba, así te familiarizas con la estructura antes de tu primera consulta real.',
      advanceOn: { type: 'manual' },
    },
    {
      id: 'ch1-go-to-patients',
      route: AppRoute.MAIN,
      target: '[data-tour="nav-patients"]',
      title: 'Ve a la sección de Pacientes',
      body: 'Haz clic en "Pacientes" en el menú lateral. Ahí administras a todos tus pacientes.',
      placement: 'right',
      advanceOn: { type: 'click' },
    },
    {
      id: 'ch1-new-patient-btn',
      route: AppRoute.DASHBOARD,
      target: '[data-tour="dashboard-new-patient-btn"]',
      title: 'Crea tu primer paciente',
      body: 'Haz clic en "Nuevo Paciente" para comenzar.',
      placement: 'bottom',
      advanceOn: { type: 'click' },
    },
    {
      id: 'ch1-fill-patient-form',
      route: AppRoute.DASHBOARD,
      target: '[data-tour="dashboard-new-patient-modal"]',
      title: 'Llena los datos básicos',
      body: 'Escribe un nombre y apellido de prueba (ej. "Paciente Prueba") y los demás campos que quieras. Luego guarda el formulario.',
      placement: 'left',
      advanceOn: {
        type: 'poll',
        check: (ctx) => store.getPatients().some(p => !ctx.existingPatientIds.includes(p.id)),
      },
      onAdvance: (ctx) => {
        const newPatient = store.getPatients().find(p => !ctx.existingPatientIds.includes(p.id));
        if (newPatient) {
          tourService.setDemoPatient(newPatient.id, `${newPatient.firstName} ${newPatient.lastName}`);
        }
      },
    },
  ],
};
