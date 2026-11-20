import { describe, expect, it } from 'vitest'
import type { QuestionStats } from '@/contracts/deck'
import { EQuestionType, type QuestionData, type QuestionID } from '@/contracts/question'
import { SeededRandom } from '@/shared/random/random'
import { orderQuestions } from './questionOrder'
import { makeQuestion, mixedQuestions } from './test/roundFixtures'

const FAILED: QuestionStats = { timesSeen: 2, timesWrong: 1, lastCorrect: true }
const RIGHT: QuestionStats = { timesSeen: 3, timesWrong: 0, lastCorrect: true }

function ids(questions: readonly QuestionData[]): QuestionID[] {
  return questions.map((q) => q.id)
}

describe('orderQuestions', () => {
  it('sorts easy → hard by difficulty', () => {
    const ordered = orderQuestions(mixedQuestions(), new Map(), new SeededRandom(1))
    const levels = ordered.map((q) => q.difficulty)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    expect(ordered).toHaveLength(17)
  })

  it('puts the ones she failed before last within their level', () => {
    const questions = [
      makeQuestion('a', EQuestionType.Choice, 2),
      makeQuestion('b', EQuestionType.Choice, 2),
      makeQuestion('c', EQuestionType.Choice, 2),
      makeQuestion('d', EQuestionType.Choice, 1),
      makeQuestion('e', EQuestionType.Choice, 1),
      makeQuestion('f', EQuestionType.Choice, 3),
    ]
    const stats = new Map<QuestionID, QuestionStats>([
      ['a', FAILED],
      ['d', FAILED],
      ['b', RIGHT],
    ])
    for (let seed = 0; seed < 50; seed++) {
      const order = ids(orderQuestions(questions, stats, new SeededRandom(seed)))
      expect(order.slice(0, 2).sort()).toEqual(['d', 'e'])
      expect(order[1]).toBe('d')
      expect(order.slice(2, 5).sort()).toEqual(['a', 'b', 'c'])
      expect(order[4]).toBe('a')
      expect(order[5]).toBe('f')
    }
  })

  it('counts a question missing from her stats as never failed', () => {
    const questions = [makeQuestion('x'), makeQuestion('y')]
    const stats = new Map<QuestionID, QuestionStats>([['x', FAILED]])
    expect(ids(orderQuestions(questions, stats, new SeededRandom(3)))).toEqual(['y', 'x'])
  })

  it('breaks ties with the seed: the same seed, the same order', () => {
    const questions = mixedQuestions()
    const a = ids(orderQuestions(questions, new Map(), new SeededRandom(42)))
    const b = ids(orderQuestions(questions, new Map(), new SeededRandom(42)))
    expect(a).toEqual(b)
    const orders = new Set(
      Array.from({ length: 10 }, (_, seed) =>
        ids(orderQuestions(questions, new Map(), new SeededRandom(seed))).join()
      )
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('leaves the dealt list as it was', () => {
    const questions = mixedQuestions()
    const before = ids(questions)
    orderQuestions(questions, new Map(), new SeededRandom(5))
    expect(ids(questions)).toEqual(before)
  })
})
