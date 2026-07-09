import { PageGuideStep } from '../pageGuideTypes';

export const calendarGuideSteps: PageGuideStep[] = [
  {
    id: 'calendar-grid',
    target: '[data-tour="calendar-grid"]',
    placement: 'right',
    title: 'Tu calendario',
    body: 'Este es el grid de tu calendario. Haz clic en cualquier día para crear una cita, o en una cita existente para editarla.',
  },
  {
    id: 'calendar-agenda-hoy',
    target: '[data-tour="calendar-agenda-hoy"]',
    placement: 'left',
    title: 'Agenda de hoy',
    body: 'Aquí verás tus citas programadas para hoy.',
  },
  {
    id: 'calendar-proximas-citas',
    target: '[data-tour="calendar-proximas-citas"]',
    placement: 'left',
    title: 'Próximas citas',
    body: 'Aquí verás tus citas de los próximos 5 días.',
  },
  {
    id: 'calendar-historial',
    target: '[data-tour="calendar-historial"]',
    placement: 'top',
    title: 'Registro histórico de citas',
    body: 'Aquí tienes el registro completo de todas tus citas históricas.',
  },
  {
    id: 'calendar-google-sync',
    target: '[data-tour="calendar-google-tools"]',
    placement: 'bottom',
    title: 'Conecta Google Calendar',
    body: 'Con "Conectar Google Calendar" sincronizas tu agenda para llevarla contigo, y con "Tips Google Calendar" ves cómo escribir tus eventos para que se importen correctamente.',
  },
  {
    id: 'calendar-new-appt',
    target: '[data-tour="calendar-new-appt-btn"]',
    placement: 'bottom',
    title: 'Nueva cita',
    body: 'Haz clic aquí para agendar una nueva cita.',
  },
];
