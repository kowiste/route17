import { describe, expect, it } from 'vitest'
import { ETopic, type QuestionID, type QuestionRef } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { AppError, EErrorCode, isAppError } from '@/shared/errors/appError'
import { SeededRandom, type Random } from '@/shared/random/random'
import { Deck, MAX_MISSED_PER_ROUND, MISSED_COMES_BACK_AFTER } from './deck'

const SET = 'game'

function questionIDs(n: number, prefix = 'q'): QuestionID[] {
  return Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`)
}

function freshDeck(n: number, random: Random): Deck {
  return Deck.open(SET, questionIDs(n), null, random)
}

/** Deals a round and answers every question: right unless `isWrong` says so. */
function playRound(
  deck: Deck,
  random: Random,
  isWrong: (id: QuestionID) => boolean = () => false
): QuestionID[] {
  const dealt = deck.deal(ROUND_LENGTH, random)
  deck.finish({
    answered: dealt.map((questionID) => ({ questionID, correct: !isWrong(questionID) })),
    unreached: [],
  })
  return dealt
}

function errorOf(make: () => unknown): AppError {
  try {
    make()
  } catch (error) {
    if (isAppError(error)) return error
    throw error
  }
  throw new Error('expected an AppError')
}

describe('Deck: dealing the set', () => {
  it('starts fresh: nothing seen, cycle 1, no rounds played', () => {
    const deck = freshDeck(30, new SeededRandom(1))
    const refs: QuestionRef[] = questionIDs(30).map((id) => ({
      id,
      topic: ETopic.Government,
      difficulty: 2,
    }))
    expect(deck.summary(refs)).toMatchObject({
      seen: 0,
      mastered: 0,
      total: 30,
      cycle: 1,
      roundsPlayed: 0,
    })
  })

  it.each([1, 5, 17, 18, 20, 34, 35, 50, 100, 263])(
    'with %i questions answered right, deals every question within ⌈N/17⌉ rounds',
    (n) => {
      for (const seed of [1, 2, 3]) {
        const random = new SeededRandom(seed)
        const deck = freshDeck(n, random)
        const seen = new Set<QuestionID>()
        for (let round = 0; round < Math.ceil(n / ROUND_LENGTH); round++) {
          for (const id of playRound(deck, random)) seen.add(id)
        }
        expect(seen.size).toBe(n)
      }
    }
  )

  it.each([18, 20, 40, 100])(
    'with %i questions, shows every question once per cycle before any repeats',
    (n) => {
      const random = new SeededRandom(7)
      const deck = freshDeck(n, random)
      const dealt: QuestionID[] = []
      while (dealt.length < n * 4) dealt.push(...playRound(deck, random))
      for (let cycle = 0; cycle < 4; cycle++) {
        const ids = dealt.slice(cycle * n, (cycle + 1) * n)
        expect([...ids].sort()).toEqual(questionIDs(n))
      }
    }
  )

  it('counts the cycles: a new one starts when the order runs out', () => {
    const random = new SeededRandom(3)
    const deck = freshDeck(20, random)
    const refs: QuestionRef[] = questionIDs(20).map((id) => ({
      id,
      topic: ETopic.Society,
      difficulty: 1,
    }))
    playRound(deck, random)
    expect(deck.summary(refs).cycle).toBe(1)
    playRound(deck, random) // 3 left in cycle 1, then 14 of cycle 2
    expect(deck.summary(refs).cycle).toBe(2)
    expect(deck.summary(refs).roundsPlayed).toBe(2)
  })

  it('never deals a question twice in a round, even across a new cycle', () => {
    const random = new SeededRandom(11)
    const deck = freshDeck(18, random)
    for (let round = 0; round < 10; round++) {
      const dealt = playRound(deck, random)
      expect(new Set(dealt).size).toBe(dealt.length)
      expect(dealt).toHaveLength(ROUND_LENGTH)
    }
  })

  it('deals the whole set when it is smaller than a round', () => {
    const random = new SeededRandom(5)
    const deck = freshDeck(6, random)
    expect([...playRound(deck, random)].sort()).toEqual(questionIDs(6))
    expect([...playRound(deck, random)].sort()).toEqual(questionIDs(6))
  })

  it('deals nothing from an empty set', () => {
    const random = new SeededRandom(5)
    expect(freshDeck(0, random).deal(ROUND_LENGTH, random)).toEqual([])
  })

  it('deals the same questions for the same seed', () => {
    const a = new SeededRandom(42)
    const b = new SeededRandom(42)
    const deckA = freshDeck(100, a)
    const deckB = freshDeck(100, b)
    for (let round = 0; round < 8; round++) expect(playRound(deckA, a)).toEqual(playRound(deckB, b))
  })

  it('shuffles differently for another seed', () => {
    const a = new SeededRandom(1)
    const b = new SeededRandom(2)
    expect(freshDeck(100, a).deal(ROUND_LENGTH, a)).not.toEqual(
      freshDeck(100, b).deal(ROUND_LENGTH, b)
    )
  })

  it('refuses a round of less than one question', () => {
    const random = new SeededRandom(1)
    const deck = freshDeck(20, random)
    expect(errorOf(() => deck.deal(0, random)).code).toBe(EErrorCode.InvalidInput)
    expect(errorOf(() => deck.deal(1.5, random)).code).toBe(EErrorCode.InvalidInput)
  })
})

describe('Deck: missed questions', () => {
  it(`brings a missed question back ${MISSED_COMES_BACK_AFTER} rounds later, first`, () => {
    const random = new SeededRandom(9)
    const deck = freshDeck(200, random)
    const round1 = deck.deal(ROUND_LENGTH, random)
    const missed = round1[5] ?? ''
    deck.finish({
      answered: round1.map((questionID) => ({ questionID, correct: questionID !== missed })),
      unreached: [],
    })
    expect(playRound(deck, random)).not.toContain(missed)
    expect(playRound(deck, random)).not.toContain(missed)
    const round4 = playRound(deck, random)
    expect(round4[0]).toBe(missed)
    expect(round4.filter((id) => id === missed)).toHaveLength(1)
    expect(round4).toHaveLength(ROUND_LENGTH)
  })

  it('stops bringing it back once she gets it right, and brings it back again after a new miss', () => {
    const random = new SeededRandom(4)
    const deck = freshDeck(300, random)
    const missed = deck.deal(ROUND_LENGTH, random)[0] ?? ''
    deck.finish({ answered: [{ questionID: missed, correct: false }], unreached: [] })
    playRound(deck, random)
    playRound(deck, random)
    // Round 4: it's back, and she misses it again.
    expect(playRound(deck, random, (id) => id === missed)[0]).toBe(missed)
    playRound(deck, random)
    playRound(deck, random)
    // Round 7: back again; this time she gets it right.
    expect(playRound(deck, random)[0]).toBe(missed)
    for (let round = 8; round <= 12; round++) expect(playRound(deck, random)).not.toContain(missed)
  })

  it(`brings back at most ${MAX_MISSED_PER_ROUND} missed questions per round, oldest first`, () => {
    const random = new SeededRandom(21)
    const deck = freshDeck(300, random)
    const round1 = deck.deal(ROUND_LENGTH, random)
    const wrong = round1.slice(0, 8)
    deck.finish({
      answered: round1.map((questionID) => ({ questionID, correct: !wrong.includes(questionID) })),
      unreached: [],
    })
    playRound(deck, random)
    playRound(deck, random)
    const round4 = playRound(deck, random)
    expect(round4.slice(0, MAX_MISSED_PER_ROUND)).toEqual(wrong.slice(0, MAX_MISSED_PER_ROUND))
    expect(round4.filter((id) => wrong.includes(id))).toHaveLength(MAX_MISSED_PER_ROUND)
    const round5 = playRound(deck, random)
    expect(round5.slice(0, 3)).toEqual(wrong.slice(MAX_MISSED_PER_ROUND))
  })

  it('records her history with each question', () => {
    const random = new SeededRandom(2)
    const deck = freshDeck(100, random)
    const [first = '', second = ''] = deck.deal(ROUND_LENGTH, random)
    deck.finish({
      answered: [
        { questionID: first, correct: true },
        { questionID: second, correct: false },
      ],
      unreached: [],
    })
    const stats = deck.stats([first, second, 'never-dealt'])
    expect(stats.get(first)).toEqual({ timesSeen: 1, timesWrong: 0, lastCorrect: true })
    expect(stats.get(second)).toEqual({ timesSeen: 1, timesWrong: 1, lastCorrect: false })
    expect(stats.get('never-dealt')).toEqual({ timesSeen: 0, timesWrong: 0, lastCorrect: null })
  })
})

describe('Deck: unreached and unfinished rounds', () => {
  it('puts the unreached questions back at the front, in the order they were dealt', () => {
    const random = new SeededRandom(13)
    const deck = freshDeck(100, random)
    const round1 = deck.deal(ROUND_LENGTH, random)
    const answered = round1.slice(0, 4)
    const unreached = round1.slice(4)
    deck.finish({
      answered: answered.map((questionID) => ({ questionID, correct: true })),
      unreached,
    })
    const round2 = deck.deal(ROUND_LENGTH, random)
    expect(round2.slice(0, unreached.length)).toEqual(unreached)
    expect(round2).not.toContain(answered[0])
    expect(deck.stats(unreached).get(unreached[0] ?? '')?.timesSeen).toBe(0)
  })

  it('counts a dealt question the outcome leaves out as unreached', () => {
    const random = new SeededRandom(13)
    const deck = freshDeck(100, random)
    const round1 = deck.deal(ROUND_LENGTH, random)
    deck.finish({ answered: [{ questionID: round1[0] ?? '', correct: true }], unreached: [] })
    expect(deck.deal(ROUND_LENGTH, random).slice(0, 16)).toEqual(round1.slice(1))
  })

  it('deals a round that was never finished again, first', () => {
    const random = new SeededRandom(17)
    const deck = freshDeck(100, random)
    const refs: QuestionRef[] = questionIDs(100).map((id) => ({
      id,
      topic: ETopic.Rights,
      difficulty: 2,
    }))
    const abandoned = deck.deal(ROUND_LENGTH, random)
    const again = deck.deal(ROUND_LENGTH, random)
    expect(again).toEqual(abandoned)
    deck.finish({
      answered: again.map((questionID) => ({ questionID, correct: true })),
      unreached: [],
    })
    expect(deck.summary(refs)).toMatchObject({ seen: ROUND_LENGTH, roundsPlayed: 1 })
    expect(deck.toState().round).toBe(2)
    expect(deck.deal(ROUND_LENGTH, random)).not.toContain(abandoned[0])
  })

  it('keeps an unreached missed question due, so it comes first again', () => {
    const random = new SeededRandom(23)
    const deck = freshDeck(200, random)
    const missed = deck.deal(ROUND_LENGTH, random)[0] ?? ''
    deck.finish({ answered: [{ questionID: missed, correct: false }], unreached: [] })
    playRound(deck, random)
    playRound(deck, random)
    const round4 = deck.deal(ROUND_LENGTH, random)
    expect(round4[0]).toBe(missed)
    deck.finish({ answered: [], unreached: round4 })
    const round5 = deck.deal(ROUND_LENGTH, random)
    expect(round5).toEqual(round4)
  })

  it('refuses to finish a round that was not dealt, or with a question not in it', () => {
    const random = new SeededRandom(1)
    const deck = freshDeck(40, random)
    expect(errorOf(() => deck.finish({ answered: [], unreached: [] })).code).toBe(
      EErrorCode.InvalidState
    )
    const dealt = deck.deal(ROUND_LENGTH, random)
    const notDealt = questionIDs(40).find((id) => !dealt.includes(id)) ?? ''
    expect(
      errorOf(() =>
        deck.finish({ answered: [{ questionID: notDealt, correct: true }], unreached: [] })
      ).code
    ).toBe(EErrorCode.InvalidInput)
    const twice = dealt[0] ?? ''
    expect(
      errorOf(() =>
        deck.finish({ answered: [{ questionID: twice, correct: true }], unreached: [twice] })
      ).code
    ).toBe(EErrorCode.InvalidInput)
    deck.finish({ answered: [], unreached: dealt })
    expect(errorOf(() => deck.finish({ answered: [], unreached: [] })).code).toBe(
      EErrorCode.InvalidState
    )
  })
})

describe('Deck: summary', () => {
  it('counts seen and mastered (last answer right), overall and per tarea', () => {
    const random = new SeededRandom(31)
    const ids = questionIDs(40)
    const refs: QuestionRef[] = ids.map((id, i) => ({
      id,
      topic: i < 20 ? ETopic.Government : ETopic.Territory,
      difficulty: 1,
    }))
    const deck = Deck.open(SET, ids, null, random)
    const dealt = deck.deal(4, random)
    const [a = '', b = '', c = '', d = ''] = dealt
    deck.finish({
      answered: [
        { questionID: a, correct: true },
        { questionID: b, correct: false },
        { questionID: c, correct: true },
      ],
      unreached: [d],
    })
    const summary = deck.summary(refs)
    expect(summary).toMatchObject({ seen: 3, mastered: 2, total: 40, cycle: 1, roundsPlayed: 1 })
    const government = refs.filter((r) => r.topic === ETopic.Government).map((r) => r.id)
    const answered = [a, b, c]
    expect(summary.perTopic[ETopic.Government]).toEqual({
      seen: answered.filter((id) => government.includes(id)).length,
      mastered: [a, c].filter((id) => government.includes(id)).length,
      total: 20,
    })
    expect(summary.perTopic[ETopic.Society]).toEqual({ seen: 0, mastered: 0, total: 0 })
  })
})

describe('Deck: saved and reopened', () => {
  it('reopens from its state and carries on where it was', () => {
    const random = new SeededRandom(8)
    const ids = questionIDs(100)
    const deck = Deck.open(SET, ids, null, random)
    playRound(deck, random)
    playRound(deck, random, (id) => id.endsWith('7'))
    const reopened = Deck.open(SET, ids, deck.toState(), new SeededRandom(99))
    expect(reopened.toState()).toEqual(deck.toState())
    expect(reopened.deal(ROUND_LENGTH, new SeededRandom(1))).toEqual(
      deck.deal(ROUND_LENGTH, new SeededRandom(2))
    )
  })

  it('keeps her progress when questions are added to or removed from the set', () => {
    const random = new SeededRandom(12)
    const before = questionIDs(40)
    const deck = Deck.open(SET, before, null, random)
    const round1 = playRound(deck, random)
    const notDealt = before.filter((id) => !round1.includes(id))
    const removed = [...notDealt.slice(0, 3), round1[0] ?? '']
    const added = questionIDs(5, 'new')
    const after = [...before.filter((id) => !removed.includes(id)), ...added]
    const refs: QuestionRef[] = after.map((id) => ({ id, topic: ETopic.Society, difficulty: 2 }))

    const changed = Deck.open(SET, after, deck.toState(), random)
    expect(changed.summary(refs)).toMatchObject({
      seen: ROUND_LENGTH - 1,
      mastered: ROUND_LENGTH - 1,
      total: 40 - 4 + 5,
      roundsPlayed: 1,
    })
    // The rest of cycle 1: what she hadn't seen, plus the new questions, never the removed.
    const restOfCycle = [...notDealt.slice(3), ...added]
    const next = [...playRound(changed, random), ...playRound(changed, random)]
    expect([...next.slice(0, restOfCycle.length)].sort()).toEqual([...restOfCycle].sort())
    expect(next.some((id) => removed.includes(id))).toBe(false)
    expect(changed.toState().history.some((r) => removed.includes(r.questionID))).toBe(false)
  })

  it('drops removed questions from an unfinished round and from the missed list', () => {
    const random = new SeededRandom(19)
    const before = questionIDs(60)
    const deck = Deck.open(SET, before, null, random)
    const round1 = deck.deal(ROUND_LENGTH, random)
    const gone = round1[0] ?? ''
    deck.finish({ answered: [{ questionID: gone, correct: false }], unreached: round1.slice(1) })
    deck.deal(ROUND_LENGTH, random) // never finished
    const after = before.filter((id) => id !== gone)
    const reopened = Deck.open(SET, after, deck.toState(), random)
    const state = reopened.toState()
    expect(state.missed).toEqual([])
    expect(state.pending?.questionIDs).not.toContain(gone)
    expect(reopened.deal(ROUND_LENGTH, random)).not.toContain(gone)
  })
})
