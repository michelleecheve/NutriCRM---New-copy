import { PageGuideStep } from '../pageGuideTypes';

export const mainPanelReceptionistGuideSteps: PageGuideStep[] = [
  {
    id: 'mp-recep-kpis',
    target: '[data-tour="mp-recep-kpis"]',
    placement: 'bottom',
    title: 'Tus números clave',
    body: 'Aquí verás cuántas nutricionistas tienes vinculadas, las citas de hoy, las próximas citas y el total de citas registradas.',
  },
  {
    id: 'mp-recep-nutris',
    target: '[data-tour="mp-recep-nutris"]',
    placement: 'top',
    title: 'Mis Nutricionistas',
    body: 'Aquí verás la lista de nutricionistas que tienes vinculadas. Haz clic en "Ver calendario" para ir directo a su agenda.',
  },
  {
    id: 'mp-recep-citas',
    target: '[data-tour="mp-recep-citas"]',
    placement: 'top',
    title: 'Citas Recientes',
    body: 'Aquí verás las próximas citas registradas, con su fecha, paciente y estado.',
  },
];
