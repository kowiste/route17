// The ports of the questions feature.

import type { QuestionEntry, SetFile } from './questionFileSchema'

/** One folder under `questions/`: its files parsed, not yet checked as a whole set. */
export interface QuestionSetFiles {
  /** The folder's name. */
  readonly folder: string
  /** Its `set.json`. */
  readonly set: SetFile
  /** The questions of every other file of the folder, files in name order. */
  readonly questions: readonly QuestionEntry[]
}

/** Where the question sets come from: the files under `questions/`. */
export interface IQuestionSetSource {
  /** Every set folder. Throws `AppError` corruptData for a file that doesn't match the format. */
  load(): Promise<readonly QuestionSetFiles[]>
}
