// Small dice helpers on top of the seeded `Random`.

import type { Random } from '@/shared/random/random'

/** True with the given probability (0–1). */
export function chance(random: Random, probability: number): boolean {
  return random.next() < probability
}

/** An integer in [min, max], both included. */
export function between(random: Random, min: number, max: number): number {
  return min + random.int(max - min + 1)
}

/** One of the outcomes, each with its weight (weights need not sum to 1). */
export function weighted<T>(random: Random, outcomes: readonly (readonly [T, number])[]): T {
  const total = outcomes.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random.next() * total
  for (const [outcome, weight] of outcomes) {
    if (roll < weight) return outcome
    roll -= weight
  }
  const last = outcomes[outcomes.length - 1]
  if (last === undefined) throw new RangeError('weighted(): no outcomes')
  return last[0]
}
