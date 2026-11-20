// What a round looks like from the outside: plain, read-only data the screens
// show. Built by `Round.state()`; a new object after every action.

import type { EComunidadID } from '@/contracts/comunidad'
import type {
  Difficulty,
  EMode,
  EQuestionType,
  ETopic,
  QuestionID,
  SetID,
} from '@/contracts/question'
import type { AudienceVote } from './audience'
import type { ELifeline } from './eLifeline'
import type { ERoundStatus } from './eRoundStatus'
import type { FriendAnswer } from './friendCall'

export interface OptionView {
  /** Its index in the question's options: what `select` takes. */
  readonly index: number
  /** A, B or C. */
  readonly letter: string
  readonly text: string
  /** Taken off the screen by the 50:50. */
  readonly removed: boolean
}

/** The question she is answering. Which option is right stays hidden until she confirms. */
export interface QuestionView {
  readonly questionID: QuestionID
  readonly topic: ETopic
  readonly type: EQuestionType
  readonly difficulty: Difficulty
  readonly text: string
  readonly options: readonly OptionView[]
}

/** A question she has answered, with the right option and the explanation (the ⓘ). */
export interface AnswerView extends QuestionView {
  /** The rung (1–17) it was asked on. */
  readonly rung: number
  readonly comunidadID: EComunidadID
  /** The option she confirmed. */
  readonly chosen: number
  /** The right option. */
  readonly answer: number
  readonly correct: boolean
  readonly explanation: string
}

export interface LifelineStatus {
  readonly used: boolean
  /** Whether it can be used now: not used, the round is on, and (for the 50:50) the question is not true/false. */
  readonly available: boolean
}

export interface RoundState {
  readonly setID: SetID
  readonly mode: EMode
  readonly status: ERoundStatus
  /**
   * The rung (1–17) she is on: the one being asked while playing; once over,
   * the one where the round ended (the wrong or unanswered question, or 17 when won).
   */
  readonly rung: number
  /** The comunidad of `rung`. */
  readonly comunidadID: EComunidadID
  /** Where she stands on the map: the index of `comunidadID` in ROUTE (0–16). */
  readonly stop: number
  /** Rungs climbed: her right answers (0–17). */
  readonly reached: number
  /** What she has: while playing, what stopping now keeps; once over, what she takes home. */
  readonly points: number
  /** What she keeps if she answers wrong now: the last safe rung's points. */
  readonly safePoints: number
  /** What a right answer to the current question takes her to; null once over. */
  readonly nextPoints: number | null
  /** The question to answer; null once over. */
  readonly question: QuestionView | null
  /** The option she has picked and not yet confirmed. */
  readonly selected: number | null
  readonly lifelines: Readonly<Record<ELifeline, LifelineStatus>>
  /** The audience's vote on the current question, if she asked. */
  readonly audience: AudienceVote | null
  /** The friend's answer on the current question, if she called. */
  readonly friend: FriendAnswer | null
  /** The question she answered last, with its result: the ⓘ, and what to show while she travels on. */
  readonly lastAnswer: AnswerView | null
  /** Every question she answered, in order: the result screen. */
  readonly answers: readonly AnswerView[]
  /** She answered rung 17 right: "¡Nacionalidad!". */
  readonly nationality: boolean
  /** Her record on this set before this round (rungs, 0–17). */
  readonly best: number
  /** The round is over and she went further than `best`. */
  readonly newRecord: boolean
}
