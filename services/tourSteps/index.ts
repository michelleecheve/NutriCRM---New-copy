import { TourChapter } from './types';
import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';
import { chapter3 } from './chapter3';
import { chapter4 } from './chapter4';
import { chapter5 } from './chapter5';
import { chapter6 } from './chapter6';
import { chapter7 } from './chapter7';

// La práctica guiada por capítulos (crear un paciente de prueba de punta a punta)
// termina en el Capítulo 7. Los formularios de creación (menú, evaluación dietética,
// medidas) se cubren aparte con los botones "Guía de esta página" — ver components/tour/pageGuides.
export const chapters: TourChapter[] = [chapter1, chapter2, chapter3, chapter4, chapter5, chapter6, chapter7];

export function getChapter(chapterId: number): TourChapter | undefined {
  return chapters.find(c => c.id === chapterId);
}

// Títulos de los 7 capítulos, independientes de si ya están construidos —
// para poder listarlos completos (ej. en Configuración) aunque algunos aún no existan.
export const CHAPTER_TITLES: Record<number, string> = {
  1: 'Bienvenida + Crear paciente',
  2: 'Ingresar datos clínicos',
  3: 'Crear una evaluación',
  4: 'Activar el portal del paciente y compartir el link',
  5: 'Laboratorios y fotos de progreso',
  6: 'Configuración del paciente',
  7: 'Cierre del recorrido y exploración de botones: Guía de formulario',
};
