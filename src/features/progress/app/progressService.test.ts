import { describe, expect, it } from 'vitest'
import { EMode, ETopic } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { EErrorCode } from '@/shared/errors/appError'
import { MemoryLogger } from '@/shared/logger/logger'
import { SeededRandom } from '@/shared/random/random'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { FakeCatalog, sampleQuestions } from '@/test/fixtures/questions'
import { progressKey, ProgressRepository } from '../infra/progressRepository'
import { ProgressService } from './progressService'

const SET = 'game'

function gameCatalog(questions = sampleQuestions('g')): FakeCatalog {
  return new FakeCatalog([{ setID: SET, mode: EMode.Game, questions }])
}

function service(
  options: { store?: MemoryStore; catalog?: FakeCatalog; seed?: number; log?: MemoryLogger } = {}
): ProgressService {
  return new ProgressService({
    catalog: options.catalog ?? gameCatalog(),
    repository: new ProgressRepository(
      options.store ?? new MemoryStore(),
      options.log ?? new MemoryLogger()
    ),
    random: new SeededRandom(options.seed ?? 1),
  })
}

async function playRound(deck: ProgressService, wrong: readonly string[] = []): Promise<string[]> {
  const dealt = [...(await deck.deal(SET, ROUND_LENGTH))]
  await deck.finish(SET, {
    answered: dealt.map((questionID) => ({ questionID, correct: !wrong.includes(questionID) })),
    unreached: [],
  })
  return dealt
}

describe('ProgressService', () => {
  it('deals a round of different questions of the set', async () => {
    const dealt = await service().deal(SET, ROUND_LENGTH)
    const ids = sampleQuestions('g').map((q) => q.id)
    expect(dealt).toHaveLength(ROUND_LENGTH)
    expect(new Set(dealt).size).toBe(ROUND_LENGTH)
    expect(dealt.every((id) => ids.includes(id))).toBe(true)
  })

  it('with every answer right, deals the whole set within ⌈N/17⌉ rounds', async () => {
    const deck = service({ seed: 3 })
    const seen = new Set([...(await playRound(deck)), ...(await playRound(deck))])
    expect(seen.size).toBe(20)
  })

  it('keeps her progress in the store: a new session carries on', async () => {
    const store = new MemoryStore()
    const round1 = await playRound(service({ store, seed: 1 }))
    const later = service({ store, seed: 2 })
    const round2 = await later.deal(SET, ROUND_LENGTH)
    // 3 questions were left in cycle 1; they come first.
    expect(round2.slice(0, 3).some((id) => round1.includes(id))).toBe(false)
    expect(await later.summary(SET)).toMatchObject({ seen: ROUND_LENGTH, roundsPlayed: 1 })
  })

  it('deals a round that was never finished again in the next session', async () => {
    const store = new MemoryStore()
    const abandoned = await service({ store, seed: 1 }).deal(SET, ROUND_LENGTH)
    expect(await service({ store, seed: 2 }).deal(SET, ROUND_LENGTH)).toEqual(abandoned)
  })

  it('summarises and gives stats after a round', async () => {
    const deck = service()
    const dealt = await deck.deal(SET, ROUND_LENGTH)
    const [right = '', wrong = ''] = dealt
    await deck.finish(SET, {
      answered: [
        { questionID: right, correct: true },
        { questionID: wrong, correct: false },
      ],
      unreached: dealt.slice(2),
    })
    const summary = await deck.summary(SET)
    expect(summary).toMatchObject({ seen: 2, mastered: 1, total: 20, cycle: 1, roundsPlayed: 1 })
    for (const { total } of Object.values(summary.perTopic)) expect(total).toBe(4)
    expect(summary.perTopic[ETopic.Government].total).toBe(4)
    const stats = await deck.stats(SET, [right, wrong, dealt[2] ?? ''])
    expect([...stats.values()]).toEqual([
      { timesSeen: 1, timesWrong: 0, lastCorrect: true },
      { timesSeen: 1, timesWrong: 1, lastCorrect: false },
      { timesSeen: 0, timesWrong: 0, lastCorrect: null },
    ])
  })

  it('deals the same questions for the same seed', async () => {
    const a = service({ seed: 42 })
    const b = service({ seed: 42 })
    for (let round = 0; round < 4; round++) expect(await playRound(a)).toEqual(await playRound(b))
  })

  it('keeps her progress when the set gains questions', async () => {
    const store = new MemoryStore()
    const round1 = await playRound(service({ store }))
    const extra = sampleQuestions('extra').slice(0, 5)
    const grown = service({ store, catalog: gameCatalog([...sampleQuestions('g'), ...extra]) })
    expect(await grown.summary(SET)).toMatchObject({
      seen: ROUND_LENGTH,
      total: 25,
      roundsPlayed: 1,
    })
    // The rest of cycle 1: the 3 she hadn't seen, then the 5 new ones.
    const unseen = sampleQuestions('g')
      .map((q) => q.id)
      .filter((id) => !round1.includes(id))
    const next = await grown.deal(SET, 8)
    expect(next.slice(0, 3).sort()).toEqual(unseen.sort())
    expect(next.slice(3).sort()).toEqual(extra.map((q) => q.id).sort())
  })

  it('starts fresh, with a warning, when the saved progress is corrupt', async () => {
    const store = new MemoryStore()
    const log = new MemoryLogger()
    store.set(progressKey(SET), '{not json')
    const deck = service({ store, log })
    expect(await deck.summary(SET)).toMatchObject({ seen: 0, cycle: 1, roundsPlayed: 0 })
    expect(await deck.deal(SET, ROUND_LENGTH)).toHaveLength(ROUND_LENGTH)
    expect(log.entries.map((entry) => entry.level)).toContain('warn')
  })

  it('forgets a set’s progress on reset', async () => {
    const store = new MemoryStore()
    const deck = service({ store })
    await playRound(deck)
    await deck.reset(SET)
    expect(store.get(progressKey(SET))).toBeNull()
    expect(await deck.summary(SET)).toMatchObject({ seen: 0, mastered: 0, roundsPlayed: 0 })
  })

  it('refuses an unknown set with notFound', async () => {
    const deck = service()
    await expect(deck.deal('official-2026', ROUND_LENGTH)).rejects.toMatchObject({
      code: EErrorCode.NotFound,
    })
    await expect(deck.summary('official-2026')).rejects.toMatchObject({
      code: EErrorCode.NotFound,
    })
  })

  it('refuses to finish a round never dealt, and leaves the store alone', async () => {
    const store = new MemoryStore()
    await expect(
      service({ store }).finish(SET, { answered: [], unreached: [] })
    ).rejects.toMatchObject({ code: EErrorCode.InvalidState })
    expect(store.get(progressKey(SET))).toBeNull()
  })
})
