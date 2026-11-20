// The order of a round's questions: easy to hard.

import type { QuestionStats } from '@/contracts/deck'
import type { QuestionData, QuestionID } from '@/contracts/question'
import type { Random } from '@/shared/random/random'

/** Whether she has ever answered this question wrong. */
function failedBefore(stats: ReadonlyMap<QuestionID, QuestionStats>, id: QuestionID): boolean {
  return (stats.get(id)?.timesWrong ?? 0) > 0
}

/**
 * Sorts the round's questions easy → hard by difficulty. Within a level, the
 * ones she has failed before go later; the remaining ties are shuffled with the
 * round's `Random`. A question missing from `stats` counts as never seen.
 */
export function orderQuestions(
  questions: readonly QuestionData[],
  stats: ReadonlyMap<QuestionID, QuestionStats>,
  random: Random
): QuestionData[] {
  // The shuffle settles the ties; the sort is stable, so it keeps them.
  return random
    .shuffle(questions)
    .sort(
      (a, b) =>
        a.difficulty - b.difficulty ||
        Number(failedBefore(stats, a.id)) - Number(failedBefore(stats, b.id))
    )
}
