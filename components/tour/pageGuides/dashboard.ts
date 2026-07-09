import { PageGuideStep } from '../pageGuideTypes';

export const dashboardGuideSteps: PageGuideStep[] = [
  {
    id: 'dash-table',
    target: '[data-tour="dashboard-patients-table"]',
    placement: 'top',
    title: 'Tus pacientes registrados',
    body: 'Aquí verás la tabla con todos tus pacientes registrados. Haz clic en cualquiera para entrar a su ficha.',
  },
  {
    id: 'dash-search',
    target: '[data-tour="dashboard-search"]',
    placement: 'bottom',
    title: 'Buscador',
    body: 'Busca un paciente por nombre, correo, teléfono o fecha de nacimiento.',
  },
  {
    id: 'dash-sort',
    target: '[data-tour="dashboard-sort"]',
    placement: 'bottom',
    title: 'Ordenar pacientes',
    body: 'Aquí puedes filtrar el orden en el que ves a tus pacientes (más reciente, último visto, alfabético).',
  },
  {
    id: 'dash-filter-status',
    target: '[data-tour="dashboard-filter-status"]',
    placement: 'bottom',
    title: 'Filtrar por status',
    body: 'Filtra tu lista de pacientes por status, para ver por ejemplo solo los que tienen menú pendiente.',
  },
  {
    id: 'dash-config-status',
    target: '[data-tour="dashboard-config-status"]',
    placement: 'left',
    title: 'Configura tus status',
    body: 'Con este botón puedes configurar y modificar los status que quieras asignarle a tus pacientes.',
  },
  {
    id: 'dash-new-patient',
    target: '[data-tour="dashboard-new-patient-btn"]',
    placement: 'bottom',
    title: 'Nuevo paciente',
    body: 'Haz clic aquí para agregar un nuevo paciente.',
  },
];
