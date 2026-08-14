import { PageGuideStep } from '../pageGuideTypes';

// Factory porque los pasos de Suscripción, Vinculación con Recepcionistas y
// Configuración de Sistema necesitan expandir esas secciones (colapsadas por
// default) antes de resaltarlas — mismo patrón que getProfileReceptionistGuideSteps.
export function getProfileGuideSteps(
  expandSubscription: () => void,
  expandVinculacionRecepcionistas: () => void,
  expandSistema: () => void,
): PageGuideStep[] {
  return [
    {
      id: 'profile-logo',
      target: '[data-tour="profile-logo"]',
      placement: 'bottom',
      title: 'Logo del consultorio',
      body: 'Sube el logo de tu consultorio o clínica. Se muestra en el membrete de los menús PDF que le entregas a tus pacientes.',
    },
    {
      id: 'profile-nutri-data',
      target: '[data-tour="profile-nutri-data"]',
      placement: 'top',
      title: 'Tus datos de nutricionista',
      body: 'Estos son los datos que tus pacientes verían en el pie de página del PDF de su menú. En Configuración de Menús puedes elegir exactamente cuáles de estos datos se muestran y cuáles no.',
    },
    {
      id: 'profile-subscription',
      target: '[data-tour="profile-subscription"]',
      placement: 'top',
      title: 'Tu suscripción',
      body: 'Aquí ves el plan que tienes activo, y puedes actualizarlo o cambiar tu método de pago.',
      onBeforeShow: expandSubscription,
    },
    {
      id: 'profile-vinculacion-recepcionistas',
      target: '[data-tour="profile-vinculacion-recepcionistas"]',
      placement: 'top',
      title: 'Vinculación con recepcionistas',
      body: 'Comparte tu código con tu recepcionista para vincularla a tu cuenta. Una vez vinculada, ella podrá gestionar tu calendario de citas sin acceso al resto de tu información clínica.',
      onBeforeShow: expandVinculacionRecepcionistas,
    },
    {
      id: 'profile-sistema',
      target: '[data-tour="profile-sistema"]',
      placement: 'top',
      title: 'Configuración de sistema',
      body: 'Aquí editas tu zona horaria, país, moneda y el tipo de navegación (barra lateral o superior) con la que quieres usar la plataforma.',
      onBeforeShow: expandSistema,
    },
    {
      id: 'profile-logout',
      target: '[data-tour="profile-logout"]',
      placement: 'top',
      title: 'Cerrar sesión',
      body: 'Desde aquí puedes cerrar tu sesión, y también encontrarás los enlaces a la Política de Privacidad y los Términos de Servicio.',
    },
  ];
}
