import type { EMode, ETopic, QuestionData, QuestionID, QuestionRef, SetID } from './question'

export interface QuestionSetSummary {
  readonly setID: SetID
  readonly mode: EMode
  /** The manual's edition year for an official set; null for the game set. */
  readonly edition: number | null
  readonly title: string
  readonly total: number
  readonly perTopic: Readonly<Record<ETopic, number>>
}

/** The question sets found under `questions/`. Implemented by the questions feature. */
export interface IQuestionCatalog {
  /** Every set, official ones newest edition first. */
  sets(): Promise<readonly QuestionSetSummary[]>
  /** The set a mode plays: the game set, or the newest official edition. Null when there is none. */
  newestSet(mode: EMode): Promise<QuestionSetSummary | null>
  /** Every question of a set, in a light form. Throws `AppError` notFound for an unknown set. */
  index(setID: SetID): Promise<readonly QuestionRef[]>
  /** The given questions of a set, in the order asked. Throws `AppError` notFound for an unknown set or ID. */
  questions(setID: SetID, ids: readonly QuestionID[]): Promise<readonly QuestionData[]>
}
