// What she reads when something goes wrong: a short, friendly Spanish
// sentence, never the technical message.

import { EErrorCode, isAppError } from '@/shared/errors/appError'

const MESSAGES: Readonly<Record<EErrorCode, string>> = {
  [EErrorCode.CorruptData]:
    'Las preguntas del juego tienen un error y no se pueden leer. Avisa a quien te regaló el juego.',
  [EErrorCode.NotFound]:
    'Este modo todavía no tiene preguntas. Vuelve al inicio y elige el otro modo.',
  [EErrorCode.InvalidState]: 'Eso no se puede hacer ahora mismo. Inténtalo otra vez.',
  [EErrorCode.InvalidInput]: 'Ese dato no es válido. Revísalo e inténtalo otra vez.',
}

/** What could not load (a question file offline, a lost connection) and anything unexpected. */
export const UNKNOWN_ERROR_MESSAGE =
  'Algo ha fallado al cargar el juego. Comprueba tu conexión e inténtalo otra vez.'

export function friendlyError(error: unknown): string {
  return isAppError(error) ? MESSAGES[error.code] : UNKNOWN_ERROR_MESSAGE
}

/** For a name that breaks the rules: what she has to fix. */
export function nameError(maxLength: number): string {
  return `Escribe tu nombre: entre 1 y ${maxLength} letras.`
}
