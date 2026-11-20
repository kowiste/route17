import type { ETopic, QuestionID, SetID } from './question'

export interface AnswerResult {
  readonly questionID: QuestionID
  readonly correct: boolean
}

/** How a round ended, as far as the deck cares. */
export interface RoundOutcome {
  /** The questions she answered, in order. */
  readonly answered: readonly AnswerResult[]
  /** Questions dealt but never reached (she lost or stopped first). They go back to the front. */
  readonly unreached: readonly QuestionID[]
}

/** Her history with one question. */
export interface QuestionStats {
  readonly timesSeen: number
  readonly timesWrong: number
  /** Whether her last answer to it was right; null if never seen. */
  readonly lastCorrect: boolean | null
}

export interface ProgressCount {
  readonly seen: number
  readonly mastered: number
  readonly total: number
}

export interface DeckSummary extends ProgressCount {
  readonly perTopic: Readonly<Record<ETopic, ProgressCount>>
  /** How many times she has gone through the whole set; starts at 1. */
  readonly cycle: number
  readonly roundsPlayed: number
}

/**
 * Which questions she gets, and what she has learned. One deck per question set,
 * saved in the browser. Implemented by the progress feature.
 */
export interface IDeck {
  /**
   * Starts a round: the next `count` questions of the set. If the previous round
   * was dealt but never finished, its questions come first.
   */
  deal(setID: SetID, count: number): Promise<readonly QuestionID[]>
  /** Ends the round started by the last `deal`: records the answers, gives back the unreached. */
  finish(setID: SetID, outcome: RoundOutcome): Promise<void>
  summary(setID: SetID): Promise<DeckSummary>
  /** Her history with the given questions; never-seen ones have zero counts. */
  stats(setID: SetID, ids: readonly QuestionID[]): Promise<ReadonlyMap<QuestionID, QuestionStats>>
  /** Forgets all progress of a set. */
  reset(setID: SetID): Promise<void>
}
