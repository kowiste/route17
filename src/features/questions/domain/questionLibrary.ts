// Every question set found under `questions/`, and which one each mode plays.

import { EMode, type SetID } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { QuestionSetFiles } from './interface'
import { QuestionSet } from './questionSet'

function modeRank(set: QuestionSet): number {
  return set.mode === EMode.Official ? 0 : 1
}

/** Official sets first, newest edition first; then the game sets; ties by setID. */
function compareSets(a: QuestionSet, b: QuestionSet): number {
  return (
    modeRank(a) - modeRank(b) ||
    (b.edition ?? 0) - (a.edition ?? 0) ||
    (a.setID < b.setID ? -1 : a.setID > b.setID ? 1 : 0)
  )
}

export class QuestionLibrary {
  private constructor(private readonly ordered: readonly QuestionSet[]) {}

  /** Checks every folder as a set. Throws `AppError` corruptData on the first invalid one. */
  static create(folders: readonly QuestionSetFiles[]): QuestionLibrary {
    const sets = folders.map((files) => QuestionSet.create(files))
    const seen = new Set<SetID>()
    for (const set of sets) {
      if (seen.has(set.setID)) {
        throw new AppError(EErrorCode.CorruptData, `two question sets are called "${set.setID}"`, {
          setID: set.setID,
        })
      }
      seen.add(set.setID)
    }
    return new QuestionLibrary([...sets].sort(compareSets))
  }

  /** Every set, official ones newest edition first, then the game set. */
  sets(): readonly QuestionSet[] {
    return this.ordered
  }

  /** The set a mode plays: the newest official edition, or the game set. Null when there is none. */
  newest(mode: EMode): QuestionSet | null {
    return this.ordered.find((set) => set.mode === mode) ?? null
  }

  /** Throws `AppError` notFound for an unknown set. */
  get(setID: SetID): QuestionSet {
    const set = this.ordered.find((candidate) => candidate.setID === setID)
    if (set === undefined) {
      throw new AppError(EErrorCode.NotFound, `there is no question set "${setID}"`, { setID })
    }
    return set
  }
}
