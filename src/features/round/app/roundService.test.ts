import { describe, expect, it } from 'vitest'
import { EMode, type QuestionData, type SetID } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { EErrorCode } from '@/shared/errors/appError'
import { SeededRandom } from '@/shared/random/random'
import { FakeCatalog, FakeDeck, sampleQuestions } from '@/test/fixtures/questions'
import { ELifeline } from '../domain/eLifeline'
import { ERoundStatus } from '../domain/eRoundStatus'
import type { IRoundRecords } from '../domain/interface'
import type { RoundState } from '../domain/roundState'
import { RoundService } from './roundService'

/** Her records in memory. */
class InMemoryRoundRecords implements IRoundRecords {
  readonly saved: { setID: SetID; rung: number }[] = []
  private readonly records = new Map<SetID, number>()

  constructor(initial: Record<SetID, number> = {}) {
    Object.entries(initial).forEach(([setID, rung]) => this.records.set(setID, rung))
  }

  async best(setID: SetID): Promise<number> {
    return this.records.get(setID) ?? 0
  }

  async save(setID: SetID, rung: number): Promise<void> {
    this.saved.push({ setID, rung })
    this.records.set(setID, rung)
  }
}

const invalidState = expect.objectContaining({ code: EErrorCode.InvalidState })
const invalidInput = expect.objectContaining({ code: EErrorCode.InvalidInput })

function setup(options: { best?: number; seed?: number } = {}) {
  const questions = sampleQuestions('g')
  const catalog = new FakeCatalog([
    { setID: 'game', mode: EMode.Game, questions },
    { setID: 'official-2025', mode: EMode.Official, edition: 2025, questions: [] },
    {
      setID: 'official-2026',
      mode: EMode.Official,
      edition: 2026,
      questions: sampleQuestions('o'),
    },
  ])
  const deck = new FakeDeck(catalog)
  const records = new InMemoryRoundRecords({ game: options.best ?? 0 })
  const service = new RoundService({
    catalog,
    deck,
    records,
    random: () => new SeededRandom(options.seed ?? 17),
  })
  return { service, deck, records, questions }
}

function rightOption(state: RoundState, questions: readonly QuestionData[]): number {
  const question = questions.find((q) => q.id === state.question?.questionID)
  if (question === undefined) throw new Error('no current question')
  return question.answer
}

async function answerRight(
  service: RoundService,
  questions: readonly QuestionData[],
  times: number
): Promise<RoundState> {
  for (let i = 0; i < times; i++) {
    const state = service.state()
    if (state === null) throw new Error('no round')
    service.select(rightOption(state, questions))
    await service.confirm()
  }
  const state = service.state()
  if (state === null) throw new Error('no round')
  return state
}

async function answerWrong(
  service: RoundService,
  questions: readonly QuestionData[]
): Promise<RoundState> {
  const state = service.state()
  if (state === null) throw new Error('no round')
  const right = rightOption(state, questions)
  service.select(right === 0 ? 1 : 0)
  return service.confirm()
}

describe('RoundService', () => {
  it('has no round before the first start, and refuses moves', async () => {
    const { service } = setup()
    expect(service.state()).toBeNull()
    expect(() => service.select(0)).toThrow(invalidState)
    expect(() => service.deselect()).toThrow(invalidState)
    expect(() => service.useLifeline(ELifeline.Audience)).toThrow(invalidState)
    await expect(service.confirm()).rejects.toThrow(invalidState)
    await expect(service.stop()).rejects.toThrow(invalidState)
  })

  it('starts a round of the mode set with the 17 questions the deck deals', async () => {
    const { service, questions } = setup()
    const state = await service.start(EMode.Game)
    expect(state).toMatchObject({
      setID: 'game',
      mode: EMode.Game,
      status: ERoundStatus.Playing,
      rung: 1,
    })
    // The fake deck deals the first 17 in catalog order; the round asks them easy → hard.
    const dealt = new Set(questions.slice(0, ROUND_LENGTH).map((q) => q.id))
    expect(dealt.has(state.question?.questionID ?? '')).toBe(true)
    expect(state.question?.difficulty).toBe(1)
  })

  it('plays the newest official edition', async () => {
    const { service } = setup()
    expect((await service.start(EMode.Official)).setID).toBe('official-2026')
  })

  it('refuses a mode with no set, and a mode that does not exist', async () => {
    const { service } = setup()
    const catalog = new FakeCatalog([])
    const empty = new RoundService({
      catalog,
      deck: new FakeDeck(catalog),
      records: new InMemoryRoundRecords(),
    })
    await expect(empty.start(EMode.Game)).rejects.toThrow(
      expect.objectContaining({ code: EErrorCode.NotFound })
    )
    const mode: string = 'tele'
    await expect(service.start(mode as EMode)).rejects.toThrow(invalidInput)
  })

  it('passes on her picks and refuses malformed ones', async () => {
    const { service } = setup()
    await service.start(EMode.Game)
    expect(service.select(1).selected).toBe(1)
    expect(service.deselect().selected).toBeNull()
    expect(() => service.select(-1)).toThrow(invalidInput)
    expect(() => service.select(7)).toThrow(invalidInput)
    const lifeline: string = 'comodin'
    expect(() => service.useLifeline(lifeline as ELifeline)).toThrow(invalidInput)
  })

  it('uses a lifeline once', async () => {
    const { service } = setup()
    await service.start(EMode.Game)
    const state = service.useLifeline(ELifeline.Audience)
    expect(state.audience?.percentages.reduce((a, b) => a + b, 0)).toBe(100)
    expect(state.lifelines[ELifeline.Audience].used).toBe(true)
    expect(() => service.useLifeline(ELifeline.Audience)).toThrow(invalidState)
  })

  it('records a won round in the deck and saves the record', async () => {
    const { service, deck, records, questions } = setup({ best: 4 })
    await service.start(EMode.Game)
    const state = await answerRight(service, questions, ROUND_LENGTH)
    expect(state).toMatchObject({ status: ERoundStatus.Won, points: 100000, newRecord: true })
    expect(deck.finished).toHaveLength(1)
    expect(deck.finished[0]?.setID).toBe('game')
    expect(deck.finished[0]?.outcome.answered).toHaveLength(17)
    expect(deck.finished[0]?.outcome.answered.every((a) => a.correct)).toBe(true)
    expect(deck.finished[0]?.outcome.unreached).toEqual([])
    expect(records.saved).toEqual([{ setID: 'game', rung: 17 }])
  })

  it('records a lost round with its unreached questions, and no record below the best', async () => {
    const { service, deck, records, questions } = setup({ best: 8 })
    await service.start(EMode.Game)
    await answerRight(service, questions, 6)
    const state = await answerWrong(service, questions)
    expect(state).toMatchObject({ status: ERoundStatus.Lost, points: 1000, newRecord: false })
    expect(deck.finished[0]?.outcome.answered).toHaveLength(7)
    expect(deck.finished[0]?.outcome.answered.at(-1)?.correct).toBe(false)
    expect(deck.finished[0]?.outcome.unreached).toHaveLength(10)
    expect(records.saved).toEqual([])
    await expect(service.confirm()).rejects.toThrow(invalidState)
    expect(deck.finished).toHaveLength(1)
  })

  it('records a stopped round and a new record', async () => {
    const { service, deck, records, questions } = setup({ best: 2 })
    await service.start(EMode.Game)
    await answerRight(service, questions, 3)
    const state = await service.stop()
    expect(state).toMatchObject({ status: ERoundStatus.Stopped, points: 300, newRecord: true })
    expect(deck.finished[0]?.outcome).toMatchObject({ unreached: expect.any(Array) })
    expect(deck.finished[0]?.outcome.unreached).toHaveLength(14)
    expect(records.saved).toEqual([{ setID: 'game', rung: 3 }])
    expect((await service.start(EMode.Game)).best).toBe(3)
  })

  it('asks the questions she failed before later within their level', async () => {
    const { service, questions } = setup()
    // She fails the first question of her first round.
    await service.start(EMode.Game)
    const failedID = service.state()?.question?.questionID ?? ''
    await answerWrong(service, questions)
    // The fake deck deals on in catalog order: play rounds until it comes back.
    let order: string[] = []
    for (let tries = 0; tries < 5 && !order.includes(failedID); tries++) {
      await service.start(EMode.Game)
      order = await playOrder(service, questions)
    }
    expect(order).toContain(failedID)
    const level = questions.find((q) => q.id === failedID)?.difficulty
    const sameLevel = order.filter((id) => questions.find((q) => q.id === id)?.difficulty === level)
    expect(sameLevel.length).toBeGreaterThan(1)
    expect(sameLevel.at(-1)).toBe(failedID)
  })

  it('replays the same round from the same seed', async () => {
    const a = setup({ seed: 5 })
    const b = setup({ seed: 5 })
    await a.service.start(EMode.Game)
    await b.service.start(EMode.Game)
    expect(await playOrder(a.service, a.questions)).toEqual(await playOrder(b.service, b.questions))
  })
})

/** Plays the round to the end with right answers and returns the question order. */
async function playOrder(
  service: RoundService,
  questions: readonly QuestionData[]
): Promise<string[]> {
  const state = await answerRight(service, questions, ROUND_LENGTH)
  return state.answers.map((a) => a.questionID)
}
