import { PageGuideStep } from '../pageGuideTypes';
import { TabType } from '../../../pages/PatientDetail';

// Factory porque cada bloque de pasos necesita cambiar de pestaña (setActiveTab)
// antes de poder resaltar el contenido de esa pestaña, ya que cada una solo
// monta su contenido cuando está activa.
export function getPatientGuideSteps(setActiveTab: (tab: TabType) => void): PageGuideStep[] {
  return [
    {
      id: 'patient-tabs-overview',
      target: '[data-tour="patient-tabs-bar"]',
      placement: 'bottom',
      title: 'La ficha de tu paciente',
      body: 'Estas son todas las pestañas de la ficha: Clínica, Evaluaciones, Evaluación Dietética, Medidas, Menús, Laboratorios, Fotos y Configuración. Cada una guarda su información por separado.',
    },

    // ── Clínica ───────────────────────────────────────────────────────────
    {
      id: 'patient-tab-clinical',
      target: '[data-tour="patient-tab-clinical"]',
      placement: 'bottom',
      title: 'Clínica',
      body: 'Aquí pondrás la información personal y clínica del paciente cuando inicies la consulta: motivo, antecedentes, alergias, medicamentos, etc. Recuerda dar Guardar antes de saltar al siguiente tab, cada pestaña se guarda de forma independiente.',
      onBeforeShow: () => setActiveTab('clinical'),
    },

    // ── Evaluaciones ──────────────────────────────────────────────────────
    {
      id: 'patient-tab-appointments',
      target: '[data-tour="patient-tab-appointments"]',
      placement: 'bottom',
      title: 'Evaluaciones',
      body: 'Ahora vamos a Evaluaciones.',
      onBeforeShow: () => setActiveTab('appointments'),
    },
    {
      id: 'patient-evaluations-panel',
      target: '[data-tour="patient-evaluations-panel"]',
      placement: 'top',
      title: 'Una evaluación por cada consulta',
      body: 'Por cada nueva consulta debes crear una evaluación. Piénsala como una carpeta bajo una fecha. Todo lo que registres después (notas, medidas, dietética, menú, fotos) queda guardado dentro de esa fecha, para que puedas seguir el progreso de tu paciente consulta a consulta.',
    },

    // ── Evaluación Dietética ──────────────────────────────────────────────
    {
      id: 'patient-tab-dietary',
      target: '[data-tour="patient-tab-dietary"]',
      placement: 'bottom',
      title: 'Evaluación Dietética',
      body: 'Ahora vamos a Evaluación Dietética.',
      onBeforeShow: () => setActiveTab('dietary'),
    },
    {
      id: 'patient-dietary-preferences',
      target: '[data-tour="patient-dietary-preferences"]',
      placement: 'bottom',
      title: 'Preferencias y aversiones',
      body: 'Aquí anotas las preferencias y aversiones alimentarias del paciente. Es información general que se mantiene a lo largo del tiempo, no ligada a una fecha específica.',
    },
    {
      id: 'patient-dietary-new-btn',
      target: '[data-tour="patient-dietary-new-btn"]',
      placement: 'left',
      title: 'Nueva evaluación dietética',
      body: 'Haz clic aquí cuando estés listo para hacer el recordatorio de 24 horas y la frecuencia de consumo de alimentos con tu paciente, ligado a la fecha de evaluación actual.',
    },

    // ── Medidas ───────────────────────────────────────────────────────────
    {
      id: 'patient-tab-measurements',
      target: '[data-tour="patient-tab-measurements"]',
      placement: 'bottom',
      title: 'Medidas',
      body: 'Ahora vamos a Medidas.',
      onBeforeShow: () => setActiveTab('measurements'),
    },
    {
      id: 'patient-measurements-cards',
      target: ['[data-tour="patient-measurements-anthro-card"]', '[data-tour="patient-measurements-bio-card"]'],
      placement: 'bottom',
      title: 'Dos tipos de medidas',
      body: 'Puedes crear medidas Antropométricas o de Bioimpedancia. Al hacer clic en cada sección verás la comparación entre las distintas fechas medidas, el historial completo, y dentro de Antropométricas también la carta de somatotipo (somatocarta) de tu paciente.',
    },

    // ── Menús ─────────────────────────────────────────────────────────────
    {
      id: 'patient-tab-menus',
      target: '[data-tour="patient-tab-menus"]',
      placement: 'bottom',
      title: 'Menús',
      body: 'Ahora vamos a Menús.',
      onBeforeShow: () => setActiveTab('menus'),
    },
    {
      id: 'patient-menus-new-btn',
      target: '[data-tour="patient-menus-new-btn"]',
      placement: 'left',
      title: 'Crea el menú de tu paciente',
      body: 'Aquí podrás ir creando los menús de tu paciente, uno por cada evaluación.',
    },
    {
      id: 'patient-menus-digital-portal',
      target: '[data-tour="patient-menus-digital-portal"]',
      placement: 'top',
      title: 'Menú digital del paciente',
      body: 'Al activar el menú digital del paciente, generas un link para que tu paciente entre desde su celular y vea su menú de forma interactiva, sin necesidad de un PDF.',
    },

    // ── Laboratorios ──────────────────────────────────────────────────────
    {
      id: 'patient-tab-labs',
      target: '[data-tour="patient-tab-labs"]',
      placement: 'bottom',
      title: 'Laboratorios',
      body: 'Ahora vamos a Laboratorios.',
      onBeforeShow: () => setActiveTab('labs'),
    },
    {
      id: 'patient-labs-upload',
      target: '[data-tour="patient-labs-upload"]',
      placement: 'bottom',
      title: 'Adjunta resultados de laboratorio',
      body: 'Aquí puedes adjuntar los archivos de laboratorio de tu paciente (PDF o imágenes).',
    },
    {
      id: 'patient-labs-interpretation',
      target: '[data-tour="patient-labs-interpretation"]',
      placement: 'top',
      title: 'Interpretación de cada laboratorio',
      body: 'Y abajo puedes escribir la interpretación o análisis clínico de cada archivo que subas.',
    },

    // ── Fotos ─────────────────────────────────────────────────────────────
    {
      id: 'patient-tab-photos',
      target: '[data-tour="patient-tab-photos"]',
      placement: 'bottom',
      title: 'Fotos',
      body: 'Ahora vamos a Fotos.',
      onBeforeShow: () => setActiveTab('photos'),
    },
    {
      id: 'patient-photos-gallery',
      target: '[data-tour="patient-photos-gallery"]',
      placement: 'bottom',
      title: 'Galería de progreso',
      body: 'Aquí subes las fotos de progreso que te comparta tu paciente, para llevar un registro visual de su evolución.',
    },

    // ── Configuración ─────────────────────────────────────────────────────
    {
      id: 'patient-tab-config',
      target: '[data-tour="patient-tab-config"]',
      placement: 'bottom',
      title: 'Configuración',
      body: 'Por último, Configuración.',
      onBeforeShow: () => setActiveTab('config'),
    },
    {
      id: 'patient-config-export',
      target: '[data-tour="patient-config-export"]',
      placement: 'bottom',
      title: 'Exportar en .doc',
      body: 'Descarga toda la información clínica del paciente y el contenido de cada evaluación en un archivo .doc. Es útil como respaldo personal.',
    },
    {
      id: 'patient-config-delete',
      target: '[data-tour="patient-config-delete"]',
      placement: 'top',
      title: 'Eliminar paciente',
      body: 'Y aquí puedes eliminar permanentemente a este paciente y todos sus registros. Ten cuidado con este botón, la acción no se puede deshacer.',
    },
  ];
}
