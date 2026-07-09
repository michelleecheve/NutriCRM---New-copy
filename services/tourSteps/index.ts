import { TourChapter } from './types';
import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';
import { chapter3 } from './chapter3';
import { chapter4 } from './chapter4';
import { chapter5 } from './chapter5';

// La práctica guiada por capítulos (crear un paciente de prueba de punta a punta)
// termina en el Capítulo 5. El resto de las páginas (Pagos, Calendario, Configuración,
// Menús global) se cubren con los botones "Guía de esta página" — ver components/tour/pageGuides.
export const chapters: TourChapter[] = [chapter1, chapter2, chapter3, chapter4, chapter5];

export function getChapter(chapterId: number): TourChapter | undefined {
  return chapters.find(c => c.id === chapterId);
}

// Títulos de los 5 capítulos, independientes de si ya están construidos —
// para poder listarlos completos (ej. en Configuración) aunque algunos aún no existan.
export const CHAPTER_TITLES: Record<number, string> = {
  1: 'Bienvenida + Crear paciente',
  2: 'Ingresar datos clínicos y crear una evaluación',
  3: 'Llenar los datos de una evaluación',
  4: 'Menú del paciente',
  5: 'Activar el portal del paciente y compartir el link',
};
