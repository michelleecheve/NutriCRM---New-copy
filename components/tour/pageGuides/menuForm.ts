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

// Pasos de Encabezado, reutilizados tanto por el recorrido completo de Edición y
// Preview como por el botonsito "?" propio de esa sub-sección.
export function getMenuSec3EncabezadoSteps(): PageGuideStep[] {
  return [
    {
      id: 'menu-sec3-encabezado',
      target: '[data-tour="menu-sec3-encabezado"]',
      placement: 'bottom',
      title: 'Encabezado del menú',
      body: 'Aquí completas la información de tu paciente que aparece en el encabezado: título del plan, nombre, edad, peso y porcentaje de grasa. El ícono de ojo junto a cada campo te permite ocultarlo en la vista previa y el PDF, por si no quieres mostrar ese dato.',
    },
  ];
}

// Pasos de Tabla de Porciones, reutilizados igual que los de Encabezado.
export function getMenuSec3PortionsSteps(): PageGuideStep[] {
  return [
    {
      id: 'menu-sec3-portions-concepto',
      target: '[data-tour="menu-sec3-portions"]',
      placement: 'bottom',
      title: 'Tabla de porciones',
      body: 'Define cuántas porciones de cada grupo de alimentos (lácteos, vegetales, frutas, cereales, carnes y grasas) tendrá cada tiempo de comida. La fila "Totales" suma las porciones de todos los tiempos, y la fila "Ref. Sec. 2" muestra la distribución que calculaste en Cálculo Nutricional, para comparar.',
    },
    {
      id: 'menu-sec3-portions-acciones',
      target: '[data-tour="menu-sec3-portions"]',
      placement: 'bottom',
      title: 'Más opciones en la tabla de porciones',
      body: 'Con los botones de esta sección puedes agregar o eliminar tiempos de comida, y reordenarlos con las flechas. Si marcas "¿Paciente vegetariano?", la columna de carnes se mostrará como "🥚 Proteína" en el diseño del menú. Un consejo importante: no repitas el nombre de dos tiempos de comida.',
    },
  ];
}

// Pasos de Menú Semanal, reutilizados igual que los anteriores.
export function getMenuSec3WeeklySteps(): PageGuideStep[] {
  return [
    {
      id: 'menu-sec3-weekly-intro',
      target: '[data-tour="menu-sec3-weekly"]',
      placement: 'bottom',
      title: 'Menú semanal',
      body: 'Aquí completas y editas las comidas de cada tiempo, día por día. Dentro de una misma celda puedes usar Enter para listar varias opciones en el mismo tiempo de comida.',
    },
    {
      id: 'menu-sec3-weekly-tiempo-lunes',
      target: ['[data-tour="menu-sec3-weekly-tiempo-col"]', '[data-tour="menu-sec3-weekly-lunes-col"]'],
      placement: 'bottom',
      title: 'Tiempos de comida configurados',
      body: 'Dentro del menú semanal puedes configurar los tiempos de comida que definiste en la tabla de porciones, y podrás completarlos para cada día de la semana.',
    },
    {
      id: 'menu-sec3-weekly-daycopy',
      target: '[data-tour="menu-sec3-weekly-daycopy"]',
      placement: 'bottom',
      title: 'Copiar un día completo',
      body: 'En la esquina derecha de cada columna de día hay dos íconos: uno para copiar ese día completo, y otro para pegarlo en otro día. Así puedes armar un día y replicarlo rápidamente en el resto de la semana.',
    },
    {
      id: 'menu-sec3-weekly-copypaste',
      target: ['[data-tour="menu-sec3-weekly-copypaste-desktop"]', '[data-tour="menu-sec3-weekly-copypaste-mobile"]'],
      placement: 'bottom',
      title: 'Copiar y pegar el menú completo',
      body: 'También puedes copiar y pegar el menú completo con este botón. Al hacer click verás las instrucciones para copiar la estructura del menú como texto y volver a pegarla ya editada.',
    },
    {
      id: 'menu-sec3-weekly-domingo',
      target: ['[data-tour="menu-sec3-weekly-domingo-toggle-desktop"]', '[data-tour="menu-sec3-weekly-domingo-toggle-mobile"]'],
      placement: 'bottom',
      title: 'Domingo libre',
      body: 'Con este switch decides cómo tratar el domingo. En "Domingo Libre" no planificas comidas específicas, solo dejas una nota general y la hidratación recomendada. En "Semana Completa" llenas cada tiempo de comida igual que los demás días.',
    },
    {
      id: 'menu-sec3-domingo-notes',
      target: '[data-tour="menu-sec3-domingo-notes"]',
      placement: 'top',
      title: 'Notas y agua recomendada',
      body: 'Debajo del menú semanal puedes llenar una nota u observación (recomendamos que sea corta y puntual) y la cantidad de agua recomendada para ese día.',
    },
  ];
}

// Pasos de Hoja Recomendaciones y Hábitos, reutilizados igual que los anteriores.
export function getMenuSec3Page2Steps(): PageGuideStep[] {
  return [
    {
      id: 'menu-sec3-page2',
      target: '[data-tour="menu-sec3-page2"]',
      placement: 'bottom',
      title: 'Recomendaciones y hábitos',
      body: 'Esta es la Hoja 2 de tu menú. Aquí editas el título de la sección y, dentro de cada una de las 4 categorías (preparación de alimentos, restricciones específicas, hábitos saludables, y organización y horarios), puedes cambiar el emoji, el título, y agregar o quitar las recomendaciones que quieras.',
    },
  ];
}

// Pasos de Hoja Recomendaciones al Comer Fuera, reutilizados igual que los anteriores.
export function getMenuSec3Page3Steps(): PageGuideStep[] {
  return [
    {
      id: 'menu-sec3-page3-content',
      target: '[data-tour="menu-sec3-page3-content"]',
      placement: 'top',
      title: 'Título y notas generales',
      body: 'Edita el título de la hoja y escribe un texto libre con tus recomendaciones generales para cuando tu paciente coma fuera de casa.',
    },
    {
      id: 'menu-sec3-page3-toggle',
      target: '[data-tour="menu-sec3-page3-toggle"]',
      placement: 'bottom',
      title: 'Recomendaciones al comer fuera',
      body: 'Esta Hoja 3 es opcional y viene oculta por defecto. Actívala con este botón cuando quieras que aparezca en la vista previa, el PDF y el portal de tu paciente.',
    },
    {
      id: 'menu-sec3-page3-table',
      target: '[data-tour="menu-sec3-page3-table"]',
      placement: 'top',
      title: 'Tabla de restaurantes',
      body: 'Arma tu propia tabla de opciones: agrega o elimina columnas y filas según la información que quieras compartir, por ejemplo tipo de restaurante, platillo recomendado, o qué evitar.',
    },
  ];
}

// Sub-recorrido de Edición y Preview. Es el más largo de los tres: guía paso a paso
// la construcción completa de un menú, usando un menú en blanco como demostración.
// Algunos pasos usan waitForClickTarget en vez de "Siguiente": esperan a que la
// usuaria haga click en el botón real de la app para avanzar solas.
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
      id: 'menu-sec3-start-blank',
      target: '[data-tour="menu-sec3-start-blank-btn"]',
      placement: 'bottom',
      title: 'Empieza tu menú',
      body: 'Haz click en "Iniciar Menú en Blanco" para esta demostración. Si ya diste click en iniciar, haz click en "Siguiente".',
      onBeforeShow: expandSec3,
      waitForClickTarget: '[data-tour="menu-sec3-start-blank-btn"]',
      waitForClickShowManualNext: true,
    },
    {
      id: 'menu-sec3-tabla-preview-switch',
      target: '[data-tour="menu-sec3-tabla-preview"]',
      placement: 'bottom',
      title: 'Editar en Tabla o Vista Previa',
      body: 'Con este switch cambias entre dos modos: "Editar en Tabla" para completar toda la información del menú, y "Vista Previa" para revisar cómo se verá el PDF final. Puedes ir y venir entre ambos las veces que quieras.',
      onBeforeShow: expandSec3,
    },
    {
      id: 'menu-sec3-return-editor',
      target: ['[data-tour="menu-sec3-editar-tabla-btn"]', '[data-tour="menu-sec3-tipo-menu"]'],
      placement: 'bottom',
      title: 'De vuelta en el editor',
      body: 'Regresando al editor del menú. Primero selecciona qué tipo de menú quieres hacer: Menú Semanal o Intercambio de Alimentos. Cambiar esto cambia cómo se ve tu plantilla en PDF. Por ahora continuaremos con el Menú Semanal.',
      onBeforeShow: expandSec3,
    },
    ...getMenuSec3EncabezadoSteps(),
    ...getMenuSec3PortionsSteps(),
    ...getMenuSec3WeeklySteps(),
    ...getMenuSec3Page2Steps(),
    ...getMenuSec3Page3Steps(),
    {
      id: 'menu-sec3-goto-preview',
      target: '[data-tour="menu-sec3-vista-previa-btn"]',
      placement: 'bottom',
      title: 'Vista previa',
      body: 'Vamos a la vista previa para que veas cómo se va viendo tu menú. Haz click en "Vista Previa" para continuar.',
      waitForClickTarget: '[data-tour="menu-sec3-vista-previa-btn"]',
    },
    {
      id: 'menu-sec3-config-diseno',
      target: '[data-tour="menu-sec3-config-diseno-btn"]',
      placement: 'bottom',
      title: 'Configura el diseño',
      body: 'Estando en Vista Previa también puedes configurar el diseño de este menú con este botón: colores, tipografía y el layout de las hojas. Haz click en "Configurar diseño" para verlo.',
      waitForClickTarget: '[data-tour="menu-sec3-config-diseno-btn"]',
    },
    {
      id: 'menu-sec3-design-modal-overview',
      target: '[data-tour="menu-sec3-design-modal"]',
      placement: 'top',
      title: 'Configurar diseño para este menú',
      body: 'Aquí personalizas cómo se ve tu menú en PDF: el estilo de plantilla, los colores y la tipografía, el layout de las hojas (para ajustar cuánto texto entra en cada una), y también puedes cambiar el modo de domingo. Cuando termines, da click en "Listo" o en la X para cerrar esta pantalla.',
      waitForClickTarget: '[data-tour="menu-sec3-design-modal-listo-btn"], [data-tour="menu-sec3-design-modal-close-btn"]',
    },
    {
      id: 'menu-sec3-top-buttons-1',
      target: ['[data-tour="menu-sec3-btn-borrar-pagina"]', '[data-tour="menu-sec3-btn-copiar-plantillas"]'],
      placement: 'bottom',
      title: 'Borrar página y copiar de plantillas',
      body: 'Si quieres borrar una página en específico, o todas las páginas para empezar de cero, usa el botón "Borrar página". Si previamente guardaste menús como plantillas, usa "Copiar de Plantillas" para pegarlos en este menú.',
    },
    {
      id: 'menu-sec3-top-buttons-2',
      target: ['[data-tour="menu-sec3-btn-guardar-plantilla"]', '[data-tour="menu-sec3-btn-exportar-pdf"]'],
      placement: 'bottom',
      title: 'Guardar como plantilla y exportar PDF',
      body: 'Si este menú está listo, usa "Guardar como Plantilla" para guardar cada página de forma individual y reutilizarla después. Para generar el documento final usa "Exportar PDF".',
    },
    {
      id: 'menu-sec3-pdf-tip',
      target: '[data-tour="menu-sec3-config-diseno-btn"]',
      placement: 'bottom',
      title: '¿Qué pasa si mi menú no cabe en una hoja A4?',
      body: 'Si notas que el menú se alarga y se pasa del formato A4 por tener mucha información, por ejemplo en las notas o en los tiempos de comida, prueba las opciones del botón "Configurar diseño" en Layout de Hojas. Ahí puedes ajustar cuánto texto entra en cada hoja hasta encontrar la opción que mejor acomode tu contenido. Te recomendamos probar las distintas opciones.',
    },
    {
      id: 'menu-sec3-save',
      target: '[data-tour="menu-sec3-save-btn"]',
      placement: 'top',
      title: 'Guarda tus cambios',
      body: 'No olvides guardar tus datos antes de salir.',
    },
    {
      id: 'menu-sec3-closing',
      title: '¡Listo!',
      body: 'Espero que esta guía te haya sido útil. Si tienes dudas, puedes escribirnos a nutrifollow.app@outlook.com.',
      standalonePosition: 'center',
      nextLabel: 'Volver al menú',
    },
  ];
}
