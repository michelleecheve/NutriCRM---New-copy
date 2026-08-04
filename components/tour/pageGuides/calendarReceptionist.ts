import { PageGuideStep } from '../pageGuideTypes';

export const calendarReceptionistGuideSteps: PageGuideStep[] = [
  {
    id: 'calendar-nutri-selector',
    target: '[data-tour="calendar-nutri-selector"]',
    placement: 'bottom',
    title: 'Calendario de tu nutricionista',
    body: 'Aquí ves de qué nutricionista es el calendario que estás consultando. Si tienes más de una nutricionista vinculada, puedes usar "Elegir Calendario" para cambiar entre sus agendas.',
  },
  {
    id: 'calendar-new-appt',
    target: '[data-tour="calendar-new-appt-btn"]',
    placement: 'bottom',
    title: 'Nueva cita',
    body: 'Haz clic aquí para agendar una nueva cita en el calendario que estás viendo.',
  },
  {
    id: 'calendar-grid',
    target: [
      '[data-tour="calendar-grid"]',
      '[data-tour="calendar-view-toggle"]',
      '[data-tour="calendar-filtro"]',
    ],
    placement: 'right',
    title: 'Tu calendario',
    body: 'Este es el calendario de citas. Puedes cambiar entre vista Mes o Semana, filtrar por estado de la cita, y hacer clic en cualquier día para crear una cita o en una cita existente para editarla.',
  },
  {
    id: 'calendar-agenda-hoy',
    target: '[data-tour="calendar-agenda-hoy"]',
    placement: 'left',
    title: 'Agenda de hoy',
    body: 'Aquí verás las citas programadas para hoy.',
  },
  {
    id: 'calendar-proximas-citas',
    target: '[data-tour="calendar-proximas-citas"]',
    placement: 'left',
    title: 'Próximas citas',
    body: 'Aquí verás las citas de los próximos 5 días.',
  },
  {
    id: 'calendar-historial',
    target: '[data-tour="calendar-historial"]',
    placement: 'top',
    title: 'Registro histórico de citas',
    body: 'Aquí tienes el registro completo de todas las citas históricas.',
    nextLabel: 'Finalizar',
  },
];
