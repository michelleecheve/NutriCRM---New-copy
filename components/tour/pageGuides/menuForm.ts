import { PageGuideStep } from '../pageGuideTypes';

// Recorrido introductorio: evaluación asignada, estructura del menú (Hoja 1/2/3,
// ilustradas) y panorama de las 3 secciones del formulario, una por una. Los
// encabezados de sección están siempre visibles, estén o no desplegados, así que
// no hace falta expandir nada aquí.
export function getMenuIntroSteps(): PageGuideStep[] {
  return [
    {
      id: 'menu-evaluation-link',
      target: '[data-tour="menu-evaluation-link"]',
      placement: 'bottom',
      title: 'Evaluación asignada',
      body: 'Cada menú se vincula a una evaluación (consulta) del paciente. La fecha del menú se toma automáticamente de la evaluación seleccionada aquí.',
    },
    {
      id: 'menu-parts-hoja1',
      illustration: 'hoja1',
      title: 'Hoja 1 — Menú',
      body: 'La primera hoja de tu menú incluye el encabezado con los datos del paciente, la tabla de porciones, el menú semanal o de intercambio de alimentos, y el pie de página.',
    },
    {
      id: 'menu-parts-hoja2',
      illustration: 'hoja2',
      title: 'Hoja 2 — Recomendaciones y Hábitos',
      body: 'La segunda hoja reúne las recomendaciones para tu paciente, organizadas en cuatro secciones: preparación de alimentos, restricciones específicas, hábitos saludables, y organización y horarios.',
    },
    {
      id: 'menu-parts-hoja3',
      illustration: 'hoja3',
      title: 'Hoja 3 — Recomendaciones para Comer Afuera (opcional)',
      body: 'De forma opcional, puedes agregar una tercera hoja con recomendaciones para cuando tu paciente coma fuera de casa: un título, notas generales y una tabla de restaurantes con opciones saludables. Una vez completes cada hoja, puedes guardarla como plantilla para reutilizarla en futuros menús.',
    },
    {
      id: 'menu-sec1-overview',
      target: '[data-tour="menu-sec1-header"]',
      placement: 'bottom',
      title: 'Cálculo Nutricional',
      body: 'En esta sección defines el requerimiento calórico de tu paciente y distribuyes sus calorías y nutrientes.',
    },
    {
      id: 'menu-sec2-overview',
      target: '[data-tour="menu-sec2-header"]',
      placement: 'bottom',
      title: 'Plantilla + Referencias',
      body: 'Aquí asignas las plantillas guardadas que quieres usar como base para las hojas de este menú.',
    },
    {
      id: 'menu-sec3-overview',
      target: '[data-tour="menu-sec3-header"]',
      placement: 'top',
      title: 'Edición y Preview',
      body: 'Y aquí completas el contenido del menú, y revisas cómo se verá antes de generarlo en PDF.',
    },
  ];
}

// Sub-recorrido de Cálculo Nutricional. Factory porque necesita expandir la
// sección (colapsada por default) antes de resaltar sus 3 sub-secciones.
export function getMenuSec1Steps(expandSec1: () => void): PageGuideStep[] {
  return [
    {
      id: 'menu-sec1-open',
      target: '[data-tour="menu-sec1-header"]',
      placement: 'bottom',
      title: 'Cálculo Nutricional',
      body: 'Comencemos por aquí. Haz clic en "Cálculo Nutricional" para abrir esta sección.',
    },
    {
      id: 'menu-sec1-sub1',
      target: '[data-tour="menu-sec1-sub1"]',
      placement: 'bottom',
      title: 'Sub-sección 1 — Cálculo VET',
      body: 'Ingresa los datos del paciente. Según su nivel de actividad física, el sistema calcula el requerimiento calórico. Define el objetivo con el que trabajarás en el campo "KCAL a Trabajar". En los valores calculados, el ícono (i) muestra más detalle de cada campo, y el ícono (x) muestra la fórmula utilizada.',
      onBeforeShow: expandSec1,
    },
    {
      id: 'menu-sec1-sub2',
      target: '[data-tour="menu-sec1-sub2"]',
      placement: 'top',
      title: 'Sub-sección 2 — Distribución de Calorías',
      body: 'Distribuye el KCAL objetivo en porcentajes entre carbohidratos, proteína y grasa. Estos cálculos se generan una vez definido el KCAL a Trabajar en la Sub-sección 1; pasa el cursor sobre el ícono (x) para ver la fórmula de cada uno.',
      onBeforeShow: expandSec1,
    },
    {
      id: 'menu-sec1-sub3',
      target: '[data-tour="menu-sec1-sub3"]',
      placement: 'top',
      title: 'Sub-sección 3 — Distribución de Nutrientes',
      body: 'Distribuye los nutrientes por porciones de alimento. El botón "Ver Lista de Intercambio" muestra cómo se calcula el valor nutricional de cada porción.',
      onBeforeShow: expandSec1,
      nextLabel: 'Volver al menú',
    },
  ];
}

// Sub-recorrido de Plantilla + Referencias.
export function getMenuSec2Steps(expandSec2: () => void): PageGuideStep[] {
  return [
    {
      id: 'menu-sec2-open',
      target: '[data-tour="menu-sec2-header"]',
      placement: 'bottom',
      title: 'Plantilla + Referencias',
      body: 'Cada menú que completes puede guardarse como plantilla, para usarse como referencia en futuros menús. Aquí asignas esas plantillas para copiarlas después desde Edición y Preview.',
      onBeforeShow: expandSec2,
    },
    {
      id: 'menu-sec2-referencias',
      target: '[data-tour="menu-sec2-referencias"]',
      placement: 'bottom',
      title: 'Referencias seleccionadas',
      body: 'Corresponde a la Hoja 1 del menú. Selecciona una plantilla de menú semanal guardada previamente: al asignarla, se copiará su tabla de porciones y las comidas de cada día y tiempo de comida. Haz clic en "Agregar referencias" para elegir hasta 3.',
      onBeforeShow: expandSec2,
    },
    {
      id: 'menu-sec2-recomendaciones',
      target: '[data-tour="menu-sec2-recomendaciones"]',
      placement: 'top',
      title: 'Recomendaciones seleccionadas',
      body: 'Corresponde a la Hoja 2 (Recomendaciones Generales) y, de forma opcional, a la Hoja 3 (Recomendaciones para Comer Afuera). Selecciona las plantillas guardadas que quieras asignar a este menú.',
      onBeforeShow: expandSec2,
      nextLabel: 'Volver al menú',
    },
  ];
}

// Sub-recorrido de Edición y Preview.
export function getMenuSec3Steps(expandSec3: () => void): PageGuideStep[] {
  return [
    {
      id: 'menu-sec3-open',
      target: '[data-tour="menu-sec3-header"]',
      placement: 'bottom',
      title: 'Edición y Preview',
      body: 'En esta sección completas el contenido del plan alimenticio que entregarás a tu paciente.',
      onBeforeShow: expandSec3,
    },
    {
      id: 'menu-sec3-start',
      target: '[data-tour="menu-sec3-start-buttons"]',
      placement: 'bottom',
      title: 'Empieza tu menú',
      body: 'Inicia un menú en blanco, o cópialo a partir de alguna de las plantillas de referencia que asignaste en la sección anterior.',
      onBeforeShow: expandSec3,
    },
    {
      id: 'menu-sec3-tabla-preview',
      target: '[data-tour="menu-sec3-tabla-preview"]',
      placement: 'bottom',
      title: 'Tabla y Vista Previa',
      body: 'Edita la tabla de porciones, los tiempos de comida, las comidas por día, y la hoja de recomendaciones y hábitos. Cambia a "Vista Previa" para revisar cómo se verá el PDF final.',
      onBeforeShow: expandSec3,
      nextLabel: 'Volver al menú',
    },
  ];
}
