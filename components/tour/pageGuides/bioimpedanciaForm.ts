import { PageGuideStep } from '../pageGuideTypes';

export function getBioimpedanciaFormGuideSteps(): PageGuideStep[] {
  return [
    {
      id: 'bioimpedancia-evaluation-link',
      target: '[data-tour="bioimpedancia-evaluation-link"]',
      placement: 'bottom',
      title: 'Fecha de la evaluación',
      body: 'La fecha de este registro de bioimpedancia se toma automáticamente de la evaluación (consulta) asignada aquí. Cambia la evaluación si quieres asociar este registro a otra fecha.',
    },
    {
      id: 'bioimpedancia-datos-generales',
      target: '[data-tour="bioimpedancia-datos-generales"]',
      placement: 'bottom',
      title: 'Datos generales',
      body: 'Aquí registras género, edad, peso, talla y todos los valores que arroja tu báscula de bioimpedancia: % grasa, agua corporal, masa muscular, grasa visceral, masa ósea, metabolismo basal y edad metabólica.',
    },
    {
      id: 'bioimpedancia-perimetros',
      target: '[data-tour="bioimpedancia-perimetros"]',
      placement: 'top',
      title: 'Perímetros Corporales (cm)',
      body: 'Aquí registras los perímetros corporales del paciente: brazo, pantorrilla, cintura, cadera, muslo, entre otros.',
    },
    {
      id: 'bioimpedancia-notas',
      target: '[data-tour="bioimpedancia-notas"]',
      placement: 'top',
      title: 'Notas',
      body: 'Aquí puedes anotar observaciones adicionales sobre este registro de bioimpedancia.',
    },
    {
      id: 'bioimpedancia-interpretation',
      target: '[data-tour="bioimpedancia-interpretation"]',
      placement: 'top',
      title: 'Interpretación Visual en Tiempo Real',
      body: 'Cuando llenes tus medidas aquí arriba, aquí irá apareciendo la interpretación gráfica de cada valor, comparado contra sus rangos de referencia.',
    },
    {
      id: 'bioimpedancia-save-btn',
      target: '[data-tour="bioimpedancia-save-btn"]',
      placement: 'top',
      title: 'Guarda tu registro',
      body: 'No olvides dar clic en Guardar para no perder la información de este formulario.',
      nextLabel: 'Finalizar',
    },
  ];
}
