// The prize ladder: what each rung of the route is worth and which rungs are
// safe. Rung n (1-based) is asked in the comunidad ROUTE[n - 1].

import type { EComunidadID } from '@/contracts/comunidad'
import { ROUND_LENGTH, ROUTE, SAFE_RUNGS } from '@/contracts/route'
import { AppError, EErrorCode } from '@/shared/errors/appError'

/** Points per rung, rung 1 first. */
export const LADDER_POINTS: readonly number[] = [
  100, 200, 300, 500, 1_000, 1_500, 2_000, 3_000, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000,
  50_000, 75_000, 100_000,
]

/** The last rung: answering it right wins the round, and "¡Nacionalidad!". */
export const NATIONALITY_RUNG = ROUND_LENGTH

export interface Rung {
  /** 1–17. */
  readonly rung: number
  readonly comunidadID: EComunidadID
  readonly points: number
  /** Reaching it keeps its points even after a wrong answer. */
  readonly safe: boolean
  /** The last rung, Madrid. */
  readonly nationality: boolean
}

function checkRung(rung: number, min: number): void {
  if (!Number.isInteger(rung) || rung < min || rung > ROUND_LENGTH) {
    throw new AppError(
      EErrorCode.InvalidInput,
      `a rung is an integer from ${min} to ${ROUND_LENGTH}, got ${rung}`,
      { rung }
    )
  }
}

/** The points of a rung (1–17); 0 for rung 0, before her first right answer. */
export function pointsAt(rung: number): number {
  checkRung(rung, 0)
  if (rung === 0) return 0
  const points = LADDER_POINTS[rung - 1]
  if (points === undefined) {
    throw new AppError(EErrorCode.InvalidInput, `no points for rung ${rung}`, { rung })
  }
  return points
}

export function isSafeRung(rung: number): boolean {
  return SAFE_RUNGS.includes(rung)
}

/** What she keeps after a wrong answer, having climbed `reached` rungs: the points of the highest safe rung she has reached. */
export function safePointsAt(reached: number): number {
  checkRung(reached, 0)
  const safe = SAFE_RUNGS.filter((rung) => rung <= reached)
  return safe.length === 0 ? 0 : pointsAt(Math.max(...safe))
}

/** The comunidad where rung `rung` (1–17) is asked. */
export function comunidadAt(rung: number): EComunidadID {
  checkRung(rung, 1)
  const comunidadID = ROUTE[rung - 1]
  if (comunidadID === undefined) {
    throw new AppError(EErrorCode.InvalidInput, `no comunidad for rung ${rung}`, { rung })
  }
  return comunidadID
}

/**
 * Where she stands on the route after climbing `reached` rungs, as an index in
 * ROUTE (0–16, the map's stop): the stop of her next question, or Madrid once
 * she has won.
 */
export function stopOf(reached: number): number {
  checkRung(reached, 0)
  return Math.min(reached, ROUND_LENGTH - 1)
}

/** The 17 rungs, rung 1 (Canarias) first: what the prize ladder shows. */
export const LADDER: readonly Rung[] = ROUTE.map((comunidadID, i) => {
  const rung = i + 1
  return {
    rung,
    comunidadID,
    points: pointsAt(rung),
    safe: isSafeRung(rung),
    nationality: rung === NATIONALITY_RUNG,
  }
})
