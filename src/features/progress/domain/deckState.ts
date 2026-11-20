// What the deck of one set remembers between visits: plain data, saved by the
// progress repository and turned back into a `Deck` by `Deck.open`.

import type { QuestionStats } from '@/contracts/deck'
import type { QuestionID, SetID } from '@/contracts/question'

/** A question she got wrong, and the round it comes back in. */
export interface MissedQuestion {
  readonly questionID: QuestionID
  readonly dueRound: number
}

/** A round that was dealt and not finished yet. */
export interface PendingRound {
  /** Its number: the deck's round counter when it was dealt. */
  readonly round: number
  readonly questionIDs: readonly QuestionID[]
}

/** Her history with one question. */
export interface QuestionRecord extends QuestionStats {
  readonly questionID: QuestionID
}

export interface DeckState {
  readonly setID: SetID
  /** The cycle she is in: how many times the set has been shuffled. Starts at 1. */
  readonly cycle: number
  /** Rounds dealt so far: the clock missed questions come back by. */
  readonly round: number
  /** Rounds she finished. */
  readonly roundsPlayed: number
  /** The questions still to come in this cycle, the next one first. */
  readonly order: readonly QuestionID[]
  readonly pending: PendingRound | null
  /** Oldest miss first. */
  readonly missed: readonly MissedQuestion[]
  readonly history: readonly QuestionRecord[]
}
