import { PageGuideStep } from '../pageGuideTypes';

export const mainPanelGuideSteps: PageGuideStep[] = [
  {
    id: 'mp-kpis',
    target: '[data-tour="mainpanel-kpis"]',
    placement: 'bottom',
    title: 'Tus números clave',
    body: 'En estos 3 KPIs verás tus pacientes nuevos, citas agendadas y menús pendientes por entregar, según el rango de fechas que elijas.',
  },
  {
    id: 'mp-priority-menus',
    target: '[data-tour="mainpanel-priority-menus"]',
    placement: 'top',
    title: 'Atención prioritaria',
    body: 'Aquí verás a los pacientes con menú pendiente de entregar. Haz clic en cualquiera de ellos para ir directo a su ficha y crear su menú.',
  },
  {
    id: 'mp-income-chart',
    target: '[data-tour="mainpanel-income-chart"]',
    placement: 'top',
    title: 'Comportamiento de ingresos',
    body: 'Aquí verás una gráfica de tus ingresos conforme vayas agregando pagos en la sección de Pagos. Puedes cambiar el rango (año, 3M, 6M, 1A) y qué se muestra en ella.',
  },
  {
    id: 'mp-agenda',
    target: '[data-tour="mainpanel-agenda"]',
    placement: 'left',
    title: 'Tu agenda de hoy',
    body: 'A la derecha tendrás tu agenda del día, actualizándose conforme vayas agregando citas desde el Calendario.',
  },
  {
    id: 'mp-date-filter',
    target: '[data-tour="mainpanel-date-filter"]',
    placement: 'bottom',
    title: 'Filtra por fecha',
    body: 'Con estos filtros de fecha puedes ajustar el rango que se refleja en los KPIs y en la gráfica de ingresos.',
  },
];
