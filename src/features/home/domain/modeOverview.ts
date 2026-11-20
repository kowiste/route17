// What Home shows for each mode: whether it can be played, her progress in
// its set and her record. A mode is playable once its set has enough
// questions for a whole round.

import type { QuestionSetSummary } from '@/contracts/catalog'
import type { ProgressCount } from '@/contracts/deck'
import { EMode, type SetID } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'

/** The modes in the order Home shows them: the exam's own questions first. */
export const HOME_MODES: readonly EMode[] = [EMode.Official, EMode.Game]

export interface ModeOverview {
  readonly mode: EMode
  /** The set the mode plays; null while there is none (the official set, before it is added). */
  readonly setID: SetID | null
  readonly setTitle: string | null
  /** There is a set with at least one round's worth of questions. */
  readonly playable: boolean
  /** Her progress in the set; null without a set. */
  readonly progress: ProgressCount | null
  /** Her record: the furthest rung she has reached (0–17). */
  readonly best: number
}

/** A set can be played when it has a question for every rung of a round. */
export function isPlayable(set: QuestionSetSummary | null): boolean {
  return set !== null && set.total >= ROUND_LENGTH
}

export function modeOverview(
  mode: EMode,
  set: QuestionSetSummary | null,
  progress: ProgressCount | null,
  best: number
): ModeOverview {
  return {
    mode,
    setID: set?.setID ?? null,
    setTitle: set?.title ?? null,
    playable: isPlayable(set),
    progress: set === null ? null : progress,
    best: set === null ? 0 : best,
  }
}
