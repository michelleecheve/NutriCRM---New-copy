import { PageGuideStep } from '../pageGuideTypes';

// Factory (no array estático) porque el primer paso necesita expandir el panel
// "Configuración de Menús" — que está colapsado por default — antes de poder
// resaltar los 4 segmentos que contiene.
export function getMenusGuideSteps(expandConfigPanel: () => void): PageGuideStep[] {
  return [
    {
      id: 'menus-plantilla-base',
      target: '[data-tour="menus-plantilla-base"]',
      placement: 'right',
      title: 'Plantilla base del menú',
      body: 'Aquí encontrarás 4 segmentos. Este primero configura el diseño de la plantilla de tu menú: logo, títulos, colores, fuentes y más.',
      onBeforeShow: expandConfigPanel,
    },
    {
      id: 'menus-referencias',
      target: '[data-tour="menus-referencias"]',
      placement: 'right',
      title: 'Plantillas de referencias',
      body: 'Aquí agregas y guardas plantillas de contenido de menús, para reutilizarlas después.',
      onBeforeShow: expandConfigPanel,
    },
    {
      id: 'menus-recomendaciones',
      target: '[data-tour="menus-recomendaciones"]',
      placement: 'right',
      title: 'Plantillas de recomendaciones',
      body: 'Aquí agregas o guardas plantillas de recomendaciones para tus menús.',
      onBeforeShow: expandConfigPanel,
    },
    {
      id: 'menus-portal-pacientes',
      target: '[data-tour="menus-portal-pacientes"]',
      placement: 'right',
      title: 'Portal digital de pacientes',
      body: 'Aquí configuras el default de lo que quieres que tus pacientes vean en su portal digital.',
      onBeforeShow: expandConfigPanel,
    },
    {
      id: 'menus-historial',
      target: '[data-tour="menus-historial"]',
      placement: 'top',
      title: 'Historial de menús',
      body: 'Abajo encontrarás el historial de todos los menús que vayas creando.',
    },
  ];
}
