// El público: the audience votes on the options still on screen. The right
// option gets most of the vote, less clearly on harder questions; on the
// hardest, one time in 10 a wrong option leads.

import type { Difficulty, QuestionData } from '@/contracts/question'
import type { Random } from '@/shared/random/random'
import { between, chance } from './odds'
import { remainingOptions, remainingWrongOptions } from './options'

export interface AudienceVote {
  /** Per option, in the question's order: whole percentages summing to 100; removed options get 0. */
  readonly percentages: readonly number[]
}

/** The share of the leading option, in percent, by difficulty. */
export const AUDIENCE_LEAD_SHARE: Readonly<Record<Difficulty, { min: number; max: number }>> = {
  1: { min: 60, max: 85 },
  2: { min: 45, max: 70 },
  3: { min: 30, max: 55 },
}

/** How often a wrong option leads the vote, by difficulty. */
export const AUDIENCE_MISLEAD_CHANCE: Readonly<Record<Difficulty, number>> = {
  1: 0,
  2: 0,
  3: 0.1,
}

/** The smallest whole share that still beats every other option among `count`. */
function leadMinimum(count: number): number {
  return Math.floor(100 / count) + 1
}

/** `parts` whole shares, each below `limit`, summing to `total`; the largest first. */
function splitBelow(total: number, parts: number, limit: number, random: Random): number[] {
  const shares: number[] = []
  let left = total
  for (let partsLeft = parts; partsLeft > 1; partsLeft--) {
    const min = Math.max(0, left - (limit - 1) * (partsLeft - 1))
    const max = Math.min(left, limit - 1)
    const share = between(random, min, max)
    shares.push(share)
    left -= share
  }
  shares.push(left)
  return shares.sort((a, b) => b - a)
}

/** The audience's vote on `question`, with the options in `removed` off the screen. */
export function askAudience(
  question: QuestionData,
  removed: readonly number[],
  random: Random
): AudienceVote {
  const shown = remainingOptions(question, removed)
  const wrong = random.shuffle(remainingWrongOptions(question, removed))
  const misled = chance(random, AUDIENCE_MISLEAD_CHANCE[question.difficulty])
  const range = AUDIENCE_LEAD_SHARE[question.difficulty]
  const lead = between(
    random,
    Math.min(Math.max(range.min, leadMinimum(shown.length)), range.max),
    range.max
  )
  const rest = splitBelow(100 - lead, shown.length - 1, lead, random)

  // The leader gets `lead`; the others get the rest, largest first. When the
  // audience is misled, the right option comes second.
  const ranking = misled
    ? [...wrong.slice(0, 1), question.answer, ...wrong.slice(1)]
    : [question.answer, ...wrong]
  const shares = [lead, ...rest]
  const percentages = question.options.map(() => 0)
  ranking.forEach((option, place) => {
    percentages[option] = shares[place] ?? 0
  })
  return { percentages }
}
