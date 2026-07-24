import { PageGuideStep } from '../pageGuideTypes';

export function getMeasurementFormGuideSteps(): PageGuideStep[] {
  return [
    {
      id: 'measurement-evaluation-link',
      target: '[data-tour="measurement-evaluation-link"]',
      placement: 'bottom',
      title: 'Evaluación asignada',
      body: 'Este registro de medidas queda ligado a la evaluación (consulta) seleccionada aquí. Cambia la evaluación si quieres asociar estas medidas a otra fecha.',
    },
    {
      id: 'measurement-datos-generales',
      target: '[data-tour="measurement-datos-generales"]',
      placement: 'bottom',
      title: 'Datos generales',
      body: 'Aquí registras género, edad, peso, talla y si el paciente cumplió su meta. Estos datos son la base para calcular el resto del formulario.',
    },
    {
      id: 'measurement-pliegues',
      target: '[data-tour="measurement-pliegues"]',
      placement: 'top',
      title: 'Pliegues Cutáneos (mm)',
      body: 'Registra aquí los 8 pliegues cutáneos del paciente, en milímetros. El campo Suma de Pliegues, ==resaltado en verde, se calcula automáticamente== a partir de esos 8 valores.',
    },
    {
      id: 'measurement-diametros',
      target: '[data-tour="measurement-diametros"]',
      placement: 'top',
      title: 'Diámetros Óseos (cm)',
      body: 'Aquí registras los diámetros de muñeca, húmero y fémur del paciente, en centímetros.',
    },
    {
      id: 'measurement-perimetros',
      target: '[data-tour="measurement-perimetros"]',
      placement: 'top',
      title: 'Perímetros Corporales (cm)',
      body: 'Y aquí los perímetros corporales del paciente: brazo, pantorrilla, cintura, cadera, muslo, entre otros.',
    },
    {
      id: 'measurement-composicion',
      target: '[data-tour="measurement-composicion"]',
      placement: 'top',
      title: 'Composición Corporal',
      body: 'Todos los campos de esta sección están ==resaltados en verde porque son cálculos automáticos==, generados a partir de los datos que ya registraste. No necesitas llenarlos a mano.',
    },
    {
      id: 'measurement-formula-icon',
      target: '[data-tour="measurement-formula-icon"]',
      placement: 'right',
      title: 'Consulta la fórmula de cada cálculo',
      body: 'Al pasar el cursor (o hacer clic) sobre el ícono de información (i) de cualquier campo calculado, verás la fórmula exacta que usamos para obtener ese valor.',
    },
    {
      id: 'measurement-somatotipo',
      target: '[data-tour="measurement-somatotipo"]',
      placement: 'top',
      title: 'Somatotipo',
      body: 'Estos valores conforman el somatotipo del paciente (endomorfo, mesomorfo, ectomorfo) y las coordenadas X, Y que luego se grafican en la somatocarta.',
    },
    {
      id: 'measurement-notas',
      target: '[data-tour="measurement-notas"]',
      placement: 'top',
      title: 'Notas',
      body: 'Aquí puedes anotar observaciones adicionales sobre este registro de medidas.',
    },
    {
      id: 'measurement-save-btn',
      target: '[data-tour="measurement-save-btn"]',
      placement: 'top',
      title: 'Guarda tu registro',
      body: 'No olvides dar clic en Guardar para no perder la información de este formulario.',
      nextLabel: 'Finalizar',
    },
  ];
}
