// Test and gallery data: a small question set, a fake catalog and a fake deck.
// Real behaviour lives in the features; these only keep their promises simply.

import type { IQuestionCatalog, QuestionSetSummary } from '@/contracts/catalog'
import type { DeckSummary, IDeck, QuestionStats, RoundOutcome } from '@/contracts/deck'
import {
  EMode,
  EQuestionType,
  ETopic,
  TOPICS,
  type QuestionData,
  type QuestionID,
  type QuestionRef,
  type SetID,
} from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'

const TOPIC_ORDER = TOPICS.map((t) => t.topic)

/** 20 questions, four per tarea, alternating choice and true/false, difficulties 1-3. */
export function sampleQuestions(prefix = 'q'): QuestionData[] {
  return Array.from({ length: 20 }, (_, i) => {
    const topic = TOPIC_ORDER[i % TOPIC_ORDER.length] ?? ETopic.Government
    const trueFalse = i % 4 === 3
    const difficulty = ((i % 3) + 1) as 1 | 2 | 3
    return {
      id: `${prefix}-${String(i + 1).padStart(3, '0')}`,
      topic,
      type: trueFalse ? EQuestionType.TrueFalse : EQuestionType.Choice,
      question: `Pregunta de ejemplo número ${i + 1}, sobre ${topic}: ¿cuál es la respuesta correcta?`,
      options: trueFalse ? ['Verdadero', 'Falso'] : ['Opción A', 'Opción B', 'Opción C'],
      answer: trueFalse ? i % 2 : i % 3,
      explanation: `Explicación de ejemplo de la pregunta ${i + 1}.`,
      difficulty,
    }
  })
}

function perTopic<T>(make: (topic: ETopic) => T): Record<ETopic, T> {
  return {
    [ETopic.Government]: make(ETopic.Government),
    [ETopic.Rights]: make(ETopic.Rights),
    [ETopic.Territory]: make(ETopic.Territory),
    [ETopic.CultureHistory]: make(ETopic.CultureHistory),
    [ETopic.Society]: make(ETopic.Society),
  }
}

export class FakeCatalog implements IQuestionCatalog {
  private readonly sets_: Map<SetID, { summary: QuestionSetSummary; questions: QuestionData[] }>

  constructor(
    sets: { setID: SetID; mode: EMode; edition?: number; questions: QuestionData[] }[] = [
      { setID: 'game', mode: EMode.Game, questions: sampleQuestions('g') },
    ]
  ) {
    this.sets_ = new Map(
      sets.map((set) => [
        set.setID,
        {
          questions: set.questions,
          summary: {
            setID: set.setID,
            mode: set.mode,
            edition: set.edition ?? null,
            title: set.mode === EMode.Game ? 'Modo juego' : `Manual CCSE ${set.edition ?? ''}`,
            total: set.questions.length,
            perTopic: perTopic((topic) => set.questions.filter((q) => q.topic === topic).length),
          },
        },
      ])
    )
  }

  async sets(): Promise<readonly QuestionSetSummary[]> {
    return [...this.sets_.values()].map((set) => set.summary)
  }

  async newestSet(mode: EMode): Promise<QuestionSetSummary | null> {
    const candidates = [...this.sets_.values()]
      .map((set) => set.summary)
      .filter((summary) => summary.mode === mode)
      .sort((a, b) => (b.edition ?? 0) - (a.edition ?? 0))
    return candidates[0] ?? null
  }

  async index(setID: SetID): Promise<readonly QuestionRef[]> {
    return this.set(setID).questions.map((q) => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
    }))
  }

  async questions(setID: SetID, ids: readonly QuestionID[]): Promise<readonly QuestionData[]> {
    const questions = this.set(setID).questions
    return ids.map((id) => {
      const question = questions.find((q) => q.id === id)
      if (question === undefined) throw new AppError(EErrorCode.NotFound, `no question ${id}`)
      return question
    })
  }

  private set(setID: SetID): { summary: QuestionSetSummary; questions: QuestionData[] } {
    const set = this.sets_.get(setID)
    if (set === undefined) throw new AppError(EErrorCode.NotFound, `no set ${setID}`)
    return set
  }
}

/** Deals in catalog order, remembers answers; none of the real deck's rules. */
export class FakeDeck implements IDeck {
  readonly finished: { setID: SetID; outcome: RoundOutcome }[] = []
  private readonly history = new Map<QuestionID, QuestionStats>()
  private readonly cursor = new Map<SetID, number>()

  constructor(private readonly catalog: IQuestionCatalog) {}

  async deal(setID: SetID, count: number): Promise<readonly QuestionID[]> {
    const ids = (await this.catalog.index(setID)).map((q) => q.id)
    const start = this.cursor.get(setID) ?? 0
    const dealt = Array.from(
      { length: Math.min(count, ids.length) },
      (_, i) => ids[(start + i) % ids.length] ?? ''
    )
    this.cursor.set(setID, (start + dealt.length) % Math.max(ids.length, 1))
    return dealt
  }

  async finish(setID: SetID, outcome: RoundOutcome): Promise<void> {
    this.finished.push({ setID, outcome })
    for (const answer of outcome.answered) {
      const before = this.history.get(answer.questionID) ?? {
        timesSeen: 0,
        timesWrong: 0,
        lastCorrect: null,
      }
      this.history.set(answer.questionID, {
        timesSeen: before.timesSeen + 1,
        timesWrong: before.timesWrong + (answer.correct ? 0 : 1),
        lastCorrect: answer.correct,
      })
    }
  }

  async summary(setID: SetID): Promise<DeckSummary> {
    const refs = await this.catalog.index(setID)
    function count(list: readonly QuestionRef[], history: Map<QuestionID, QuestionStats>) {
      return {
        seen: list.filter((q) => (history.get(q.id)?.timesSeen ?? 0) > 0).length,
        mastered: list.filter((q) => history.get(q.id)?.lastCorrect === true).length,
        total: list.length,
      }
    }
    return {
      ...count(refs, this.history),
      perTopic: perTopic((topic) =>
        count(
          refs.filter((q) => q.topic === topic),
          this.history
        )
      ),
      cycle: 1,
      roundsPlayed: this.finished.filter((f) => f.setID === setID).length,
    }
  }

  async stats(
    _setID: SetID,
    ids: readonly QuestionID[]
  ): Promise<ReadonlyMap<QuestionID, QuestionStats>> {
    return new Map(
      ids.map((id) => [
        id,
        this.history.get(id) ?? { timesSeen: 0, timesWrong: 0, lastCorrect: null },
      ])
    )
  }

  async reset(setID: SetID): Promise<void> {
    this.cursor.delete(setID)
    this.history.clear()
  }
}
