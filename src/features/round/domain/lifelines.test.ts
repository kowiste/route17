// The lifelines on their own: the 50:50, the audience and the friend, with
// their odds checked over many seeded runs.

import { describe, expect, it } from 'vitest'
import { EQuestionType, type Difficulty } from '@/contracts/question'
import { EErrorCode } from '@/shared/errors/appError'
import { SeededRandom } from '@/shared/random/random'
import { askAudience, AUDIENCE_LEAD_SHARE } from './audience'
import { fiftyFifty, fiftyFiftyAllowed } from './fiftyFifty'
import { callFriend, EFriendConfidence, FRIEND_CERTAINTY, FRIEND_PHRASES } from './friendCall'
import { makeQuestion } from './test/roundFixtures'

const RUNS = 3000

function leader(percentages: readonly number[]): number {
  return percentages.indexOf(Math.max(...percentages))
}

describe('50:50', () => {
  it('removes exactly one wrong option', () => {
    const question = makeQuestion('q', EQuestionType.Choice)
    const random = new SeededRandom(1)
    const seen = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const removed = fiftyFifty(question, random)
      expect(removed).toHaveLength(1)
      expect(removed).not.toContain(question.answer)
      removed.forEach((option) => seen.add(option))
    }
    expect([...seen].sort()).toEqual([0, 1])
  })

  it('is not allowed on a true/false question', () => {
    const question = makeQuestion('q', EQuestionType.TrueFalse)
    expect(fiftyFiftyAllowed(question)).toBe(false)
    expect(() => fiftyFifty(question, new SeededRandom(1))).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidState })
    )
  })
})

describe('el público', () => {
  it.each([1, 2, 3] as const)(
    'sums to 100 and gives the right option its share on difficulty %i',
    (difficulty: Difficulty) => {
      const question = makeQuestion('q', EQuestionType.Choice, difficulty)
      const random = new SeededRandom(difficulty)
      const range = AUDIENCE_LEAD_SHARE[difficulty]
      for (let i = 0; i < RUNS; i++) {
        const { percentages } = askAudience(question, [], random)
        expect(percentages).toHaveLength(3)
        expect(percentages.reduce((a, b) => a + b, 0)).toBe(100)
        percentages.forEach((p) => {
          expect(Number.isInteger(p)).toBe(true)
          expect(p).toBeGreaterThanOrEqual(0)
        })
        if (leader(percentages) === question.answer) {
          const right = percentages[question.answer] ?? 0
          expect(right).toBeGreaterThanOrEqual(range.min)
          expect(right).toBeLessThanOrEqual(range.max)
        }
      }
    }
  )

  it('always lets the right option lead on difficulties 1 and 2, strictly', () => {
    for (const difficulty of [1, 2] as const) {
      const question = makeQuestion('q', EQuestionType.Choice, difficulty)
      const random = new SeededRandom(10 + difficulty)
      for (let i = 0; i < RUNS; i++) {
        const { percentages } = askAudience(question, [], random)
        const right = percentages[question.answer] ?? 0
        percentages.forEach((p, option) => {
          if (option !== question.answer) expect(p).toBeLessThan(right)
        })
      }
    }
  })

  it('is misled about one time in 10 on difficulty 3, and the right option comes second then', () => {
    const question = makeQuestion('q', EQuestionType.Choice, 3)
    const random = new SeededRandom(99)
    let misled = 0
    for (let i = 0; i < RUNS; i++) {
      const { percentages } = askAudience(question, [], random)
      if (leader(percentages) !== question.answer) {
        misled++
        const sorted = [...percentages].sort((a, b) => b - a)
        expect(percentages[question.answer]).toBe(sorted[1])
        expect(sorted[0]).toBeGreaterThan(sorted[1] ?? 0)
      }
    }
    expect(misled / RUNS).toBeGreaterThan(0.07)
    expect(misled / RUNS).toBeLessThan(0.13)
  })

  it('is less sure on harder questions', () => {
    const averages = ([1, 2, 3] as const).map((difficulty) => {
      const question = makeQuestion('q', EQuestionType.Choice, difficulty)
      const random = new SeededRandom(7)
      let total = 0
      for (let i = 0; i < RUNS; i++) {
        total += askAudience(question, [], random).percentages[question.answer] ?? 0
      }
      return total / RUNS
    })
    expect(averages[0]).toBeGreaterThan(averages[1] ?? Infinity)
    expect(averages[1]).toBeGreaterThan(averages[2] ?? Infinity)
  })

  it('votes only on the options left after a 50:50', () => {
    const question = makeQuestion('q', EQuestionType.Choice, 3)
    const random = new SeededRandom(5)
    for (let i = 0; i < RUNS; i++) {
      const { percentages } = askAudience(question, [0], random)
      expect(percentages[0]).toBe(0)
      expect((percentages[1] ?? 0) + (percentages[2] ?? 0)).toBe(100)
      expect(percentages[1]).not.toBe(percentages[2])
    }
  })

  it('votes on true/false questions too', () => {
    const question = makeQuestion('q', EQuestionType.TrueFalse, 2)
    const random = new SeededRandom(8)
    for (let i = 0; i < RUNS; i++) {
      const { percentages } = askAudience(question, [], random)
      expect(percentages).toHaveLength(2)
      expect(leader(percentages)).toBe(question.answer)
      expect(percentages[question.answer]).toBeLessThanOrEqual(70)
    }
  })

  it('replays with the same seed', () => {
    const question = makeQuestion('q', EQuestionType.Choice, 3)
    expect(askAudience(question, [], new SeededRandom(4))).toEqual(
      askAudience(question, [], new SeededRandom(4))
    )
  })
})

describe('llamar a un amigo', () => {
  it.each([
    [1, 0.9],
    [2, 0.75],
    [3, 0.6],
  ] as const)(
    'is right about the expected share of the time on difficulty %i',
    (difficulty, rate) => {
      const question = makeQuestion('q', EQuestionType.Choice, difficulty)
      const random = new SeededRandom(difficulty * 31)
      let right = 0
      for (let i = 0; i < RUNS; i++) {
        if (callFriend(question, [], random).option === question.answer) right++
      }
      expect(right / RUNS).toBeGreaterThan(rate - 0.04)
      expect(right / RUNS).toBeLessThan(rate + 0.04)
    }
  )

  it('names an option on screen, says how sure in its band, and speaks Spanish', () => {
    const question = makeQuestion('q', EQuestionType.Choice, 3)
    const random = new SeededRandom(12)
    const confidences = new Set<EFriendConfidence>()
    for (let i = 0; i < RUNS; i++) {
      const friend = callFriend(question, [1], random)
      expect([0, 2]).toContain(friend.option)
      const band = FRIEND_CERTAINTY[friend.confidence]
      expect(friend.certainty).toBeGreaterThanOrEqual(band.min)
      expect(friend.certainty).toBeLessThanOrEqual(band.max)
      expect(friend.message).toContain(`la ${friend.option === 0 ? 'A' : 'C'} («`)
      expect(friend.message).not.toContain('{answer}')
      confidences.add(friend.confidence)
    }
    expect(confidences.size).toBe(3)
  })

  it('sounds surer when right than when wrong', () => {
    const question = makeQuestion('q', EQuestionType.Choice, 3)
    const random = new SeededRandom(21)
    const sure = { right: 0, rightTotal: 0, wrong: 0, wrongTotal: 0 }
    for (let i = 0; i < RUNS; i++) {
      const friend = callFriend(question, [], random)
      const isSure = friend.confidence === EFriendConfidence.Sure ? 1 : 0
      if (friend.option === question.answer) {
        sure.right += isSure
        sure.rightTotal++
      } else {
        sure.wrong += isSure
        sure.wrongTotal++
      }
    }
    expect(sure.right / sure.rightTotal).toBeGreaterThan(sure.wrong / sure.wrongTotal)
  })

  it('names "Verdadero" or "Falso" by name on a true/false question', () => {
    const question = makeQuestion('q', EQuestionType.TrueFalse, 1)
    const friend = callFriend(question, [], new SeededRandom(2))
    expect(friend.message).toMatch(/«(Verdadero|Falso)»/)
    expect(friend.message).not.toMatch(/la [AB] /)
  })

  it('has a few phrasings for every confidence', () => {
    Object.values(FRIEND_PHRASES).forEach((phrases) => {
      expect(phrases.length).toBeGreaterThanOrEqual(3)
      phrases.forEach((phrase) => expect(phrase).toContain('{answer}'))
    })
  })

  it('replays with the same seed', () => {
    const question = makeQuestion('q', EQuestionType.Choice, 2)
    expect(callFriend(question, [], new SeededRandom(6))).toEqual(
      callFriend(question, [], new SeededRandom(6))
    )
  })
})
