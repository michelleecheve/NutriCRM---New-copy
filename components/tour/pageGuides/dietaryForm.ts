import { PageGuideStep } from '../pageGuideTypes';

export function getDietaryFormGuideSteps(): PageGuideStep[] {
  return [
    {
      id: 'dietary-evaluation-link',
      target: '[data-tour="dietary-evaluation-link"]',
      placement: 'bottom',
      title: 'Evaluación asignada',
      body: 'Este registro dietético queda ligado a la evaluación (consulta) seleccionada aquí. Cambia la evaluación si quieres asociar este recordatorio a otra fecha.',
    },
    {
      id: 'dietary-general-data',
      target: '[data-tour="dietary-general-data"]',
      placement: 'bottom',
      title: 'Datos generales',
      body: 'Aquí registras cuántas comidas al día hace el paciente, los alimentos que evita y notas adicionales sobre su conducta alimentaria.',
    },
    {
      id: 'dietary-recall-24h',
      target: '[data-tour="dietary-recall-24h"]',
      placement: 'top',
      title: 'Recordatorio de 24 Horas',
      body: 'Registra cada tiempo de comida del último día del paciente: hora, lugar y los alimentos consumidos. Usa "Añadir fila" para agregar cada tiempo de comida.',
    },
    {
      id: 'dietary-food-frequency',
      target: '[data-tour="dietary-food-frequency"]',
      placement: 'top',
      title: 'Frecuencia de Consumo de Alimentos',
      body: 'Marca qué tan seguido el paciente consume cada grupo de alimentos: diario, semanal, mensual, rara vez o nunca. Haz clic en la celda donde se cruzan el grupo de alimento y la frecuencia para marcarla.',
    },
    {
      id: 'dietary-save-btn',
      target: '[data-tour="dietary-save-btn"]',
      placement: 'top',
      title: 'Guarda tu registro',
      body: 'No olvides dar clic en Guardar para no perder la información de este formulario.',
      nextLabel: 'Finalizar',
    },
  ];
}
