// The route of a round: one comunidad per question, ending in Madrid.

import { EComunidadID } from './comunidad'

/** How many questions a round has: one per comunidad. */
export const ROUND_LENGTH = 17

/** The comunidades in the order she visits them; rung n (1-based) is ROUTE[n - 1]. */
export const ROUTE: readonly EComunidadID[] = [
  EComunidadID.Canarias,
  EComunidadID.Andalucia,
  EComunidadID.Murcia,
  EComunidadID.Valenciana,
  EComunidadID.Baleares,
  EComunidadID.Cataluna,
  EComunidadID.Aragon,
  EComunidadID.Navarra,
  EComunidadID.Rioja,
  EComunidadID.PaisVasco,
  EComunidadID.Cantabria,
  EComunidadID.Asturias,
  EComunidadID.Galicia,
  EComunidadID.CastillaYLeon,
  EComunidadID.Extremadura,
  EComunidadID.CastillaLaMancha,
  EComunidadID.Madrid,
]

/** The safe rungs (1-based): reaching one keeps its points even after a wrong answer. */
export const SAFE_RUNGS: readonly number[] = [5, 10]
