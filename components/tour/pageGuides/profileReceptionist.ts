import { PageGuideStep } from '../pageGuideTypes';

export const profileReceptionistGuideSteps: PageGuideStep[] = [
  {
    id: 'profile-logo',
    target: '[data-tour="profile-logo"]',
    placement: 'bottom',
    title: 'Foto del consultorio (opcional)',
    body: 'Puedes subir una foto o logo si quieres, pero es completamente opcional para tu cuenta.',
  },
  {
    id: 'profile-nutri-data',
    target: '[data-tour="profile-nutri-data"]',
    placement: 'top',
    title: 'Tus datos',
    body: 'Aquí puedes editar tu nombre, teléfono y correo de contacto.',
  },
  {
    id: 'profile-vinculacion-nutricionistas',
    target: '[data-tour="profile-vinculacion-nutricionistas"]',
    placement: 'top',
    title: 'Vinculación con nutricionista',
    body: 'Aquí compartes tu código de vinculación con la nutricionista para que te vincule desde su perfil, o ingresas el código que ella te comparta para vincularte tú misma. Una vez vinculadas, podrás ver y gestionar su calendario de citas. Si trabajas con más de una nutricionista, puedes vincularte a todas y luego cambiar entre sus calendarios desde la página de Calendario.',
  },
  {
    id: 'profile-sistema',
    target: '[data-tour="profile-sistema"]',
    placement: 'top',
    title: 'Configuración de sistema',
    body: 'Aquí editas tu zona horaria, país, moneda y el tipo de navegación (barra lateral o superior) con la que quieres usar la plataforma.',
  },
  {
    id: 'profile-logout',
    target: '[data-tour="profile-logout"]',
    placement: 'top',
    title: 'Cerrar sesión',
    body: 'Desde aquí puedes cerrar tu sesión, y también encontrarás los enlaces a la Política de Privacidad y los Términos de Servicio.',
  },
  {
    id: 'profile-save-button',
    target: '[data-tour="profile-save-button"]',
    placement: 'left',
    title: 'Recuerda guardar tus cambios',
    body: 'Cada vez que edites algo en esta página, no olvides hacer clic en "Guardar Cambios" para que se apliquen.',
    nextLabel: 'Finalizar',
  },
];
