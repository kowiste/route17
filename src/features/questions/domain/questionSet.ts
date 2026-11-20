// A question set: one folder under `questions/`, checked as a whole. It holds
// the rules the file test checks (`test/questionFiles.test.ts`) and the
// defaults the files may leave out.

import type { QuestionSetSummary } from '@/contracts/catalog'
import {
  EMode,
  ETopic,
  type Difficulty,
  type QuestionData,
  type QuestionID,
  type QuestionRef,
  type SetID,
} from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { QuestionSetFiles } from './interface'
import type { QuestionEntry } from './questionFileSchema'

/** The difficulty of a question whose file doesn't give one. */
export const DEFAULT_DIFFICULTY: Difficulty = 2

/** The folder an official set of the given edition lives in. */
export function officialFolder(edition: number): string {
  return `official-${edition}`
}

/** Two questions with these keys are the same question asked twice. */
function textKey(question: string): string {
  return question.toLowerCase().replace(/\s+/g, ' ').trim()
}

function toQuestion(entry: QuestionEntry): QuestionData {
  return {
    id: entry.id,
    topic: entry.topic,
    type: entry.type,
    question: entry.question,
    options: [...entry.options],
    answer: entry.answer,
    explanation: entry.explanation,
    difficulty: entry.difficulty ?? DEFAULT_DIFFICULTY,
  }
}

function problemsOf(files: QuestionSetFiles): string[] {
  const { folder, set, questions } = files
  const problems: string[] = []
  if (set.setID !== folder) {
    problems.push(`setID "${set.setID}" is not the folder's name "${folder}"`)
  }
  if (set.mode === EMode.Official) {
    if (set.edition === undefined) problems.push('an official set needs its edition')
    else if (folder !== officialFolder(set.edition)) {
      problems.push(`an official set of ${set.edition} lives in "${officialFolder(set.edition)}"`)
    }
  }
  if (questions.length === 0) problems.push('the set has no questions')

  const ids = new Set<QuestionID>()
  const texts = new Map<string, QuestionID>()
  for (const question of questions) {
    if (ids.has(question.id)) problems.push(`question ID ${question.id} is used twice`)
    ids.add(question.id)
    const key = textKey(question.question)
    const other = texts.get(key)
    if (other !== undefined) problems.push(`${other} and ${question.id} ask the same question`)
    else texts.set(key, question.id)
  }
  return problems
}

function countPerTopic(questions: readonly QuestionData[]): Record<ETopic, number> {
  function count(topic: ETopic): number {
    return questions.filter((q) => q.topic === topic).length
  }
  return {
    [ETopic.Government]: count(ETopic.Government),
    [ETopic.Rights]: count(ETopic.Rights),
    [ETopic.Territory]: count(ETopic.Territory),
    [ETopic.CultureHistory]: count(ETopic.CultureHistory),
    [ETopic.Society]: count(ETopic.Society),
  }
}

export class QuestionSet {
  private readonly byID: ReadonlyMap<QuestionID, QuestionData>

  private constructor(
    readonly setID: SetID,
    readonly mode: EMode,
    /** The manual's edition for an official set; null for the game set. */
    readonly edition: number | null,
    readonly title: string,
    private readonly all: readonly QuestionData[]
  ) {
    this.byID = new Map(all.map((question) => [question.id, question]))
  }

  /** Checks a folder as a set. Throws `AppError` corruptData listing every problem. */
  static create(files: QuestionSetFiles): QuestionSet {
    const problems = problemsOf(files)
    if (problems.length > 0) {
      throw new AppError(EErrorCode.CorruptData, `question set "${files.folder}" is not valid`, {
        folder: files.folder,
        problems,
      })
    }
    const { set } = files
    return new QuestionSet(
      set.setID,
      set.mode,
      set.mode === EMode.Official ? (set.edition ?? null) : null,
      set.title,
      files.questions.map(toQuestion)
    )
  }

  get total(): number {
    return this.all.length
  }

  summary(): QuestionSetSummary {
    return {
      setID: this.setID,
      mode: this.mode,
      edition: this.edition,
      title: this.title,
      total: this.total,
      perTopic: countPerTopic(this.all),
    }
  }

  /** Every question in a light form, in file order. */
  refs(): QuestionRef[] {
    return this.all.map((q) => ({ id: q.id, topic: q.topic, difficulty: q.difficulty }))
  }

  /** The given questions, in the order asked. Throws `AppError` notFound for an unknown ID. */
  pick(ids: readonly QuestionID[]): QuestionData[] {
    return ids.map((id) => {
      const question = this.byID.get(id)
      if (question === undefined) {
        throw new AppError(EErrorCode.NotFound, `set "${this.setID}" has no question ${id}`, {
          setID: this.setID,
          questionID: id,
        })
      }
      return question
    })
  }
}
