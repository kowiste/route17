// How Home names things, in Spanish.

import { EMode } from '@/contracts/question'

export const MODE_TEXT: Readonly<Record<EMode, { title: string; subtitle: string }>> = {
  [EMode.Official]: {
    title: 'Modo oficial',
    subtitle: 'Las preguntas del manual del Instituto Cervantes, tal cual salen en el examen.',
  },
  [EMode.Game]: {
    title: 'Modo juego',
    subtitle: 'Preguntas nuestras sobre los mismos temas, con más chispa.',
  },
}

/** "¡Hola, Lucía!", or just "¡Hola!" without a name. */
export function greeting(name: string): string {
  return name.length > 0 ? `¡Hola, ${name}!` : '¡Hola!'
}
