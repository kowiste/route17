import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { ELifeline } from '@/contracts/lifeline'
import { EMode, EQuestionType, type SetID } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { EErrorCode } from '@/shared/errors/appError'
import { SeededRandom } from '@/shared/random/random'
import type { SoundPlayer } from '@/shared/sound/soundPlayer'
import { ESound } from '@/shared/sound/sounds'
import { EAnswerState } from '@/shared/ui/types'
import { FakeCatalog, FakeDeck, sampleQuestions } from '@/test/fixtures/questions'
import { RoundService } from '../app/roundService'
import { ERoundStatus } from '../domain/eRoundStatus'
import type { IRoundRecords } from '../domain/interface'
import { ROUND_STORE_DEPS, useRoundStore } from './roundStore'
import { ERoundPhase } from './roundView'

class Sounds implements SoundPlayer {
  readonly played: ESound[] = []
  muted = false

  play(sound: ESound): void {
    this.played.push(sound)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }
}

class Records implements IRoundRecords {
  readonly saved = new Map<SetID, number>()

  async best(setID: SetID): Promise<number> {
    return this.saved.get(setID) ?? 0
  }

  async save(setID: SetID, rung: number): Promise<void> {
    this.saved.set(setID, rung)
  }
}

const questions = sampleQuestions('g')

function setup(options: { sets?: boolean } = {}) {
  const catalog = new FakeCatalog(
    options.sets === false ? [] : [{ setID: 'game', mode: EMode.Game, questions }]
  )
  const deck = new FakeDeck(catalog)
  const records = new Records()
  const sound = new Sounds()
  const rounds = new RoundService({
    catalog,
    deck,
    records,
    random: () => new SeededRandom(5),
  })
  const app = createApp(defineComponent({ render: () => null }))
  const pinia = createPinia()
  app.use(pinia)
  app.provide(ROUND_STORE_DEPS, { rounds, sound })
  return { round: useRoundStore(pinia), deck, records, sound }
}

type Round = ReturnType<typeof setup>['round']

function right(round: Round): number {
  const id = round.state?.question?.questionID
  const question = questions.find((q) => q.id === id)
  if (question === undefined) throw new Error('no question')
  return question.answer
}

/** Answers right, travels and arrives: the next question is up. */
async function answerRightAndTravel(round: Round): Promise<void> {
  round.choose(right(round))
  await round.confirm()
  round.travel()
  round.arrived(round.mapStop)
}

describe('round store', () => {
  it('starts a round at the first stop with the first question up', async () => {
    const { round } = setup()
    await round.start(EMode.Game)
    expect(round.phase).toBe(ERoundPhase.Asking)
    expect(round.mapStop).toBe(0)
    expect(round.best).toBe(-1)
    expect(round.traveller).toBe('idle')
    expect(round.question).toMatchObject({ rung: 1, comunidadID: 'canarias', locked: false })
    expect(round.ladder).toMatchObject({ current: 1, points: 0, safePoints: 0 })
  })

  it('picks, changes and cancels an option before confirming', async () => {
    const { round, sound } = setup()
    await round.start(EMode.Game)
    round.choose(1)
    expect(round.question?.options[1]?.state).toBe(EAnswerState.Selected)
    expect(sound.played).toEqual([ESound.Select])
    round.cancel()
    expect(round.state?.selected).toBeNull()
    await round.confirm()
    expect(round.phase).toBe(ERoundPhase.Asking)
  })

  it('reveals a right answer and keeps the map on her stop until "Continuar"', async () => {
    const { round, sound } = setup()
    await round.start(EMode.Game)
    const answer = right(round)
    round.choose(answer)
    await round.confirm()
    expect(round.phase).toBe(ERoundPhase.Revealed)
    expect(round.question).toMatchObject({ rung: 1, correct: true, answer, locked: true })
    expect(round.question?.options[answer]?.state).toBe(EAnswerState.Correct)
    expect(round.state?.stop).toBe(1)
    expect(round.mapStop).toBe(0)
    expect(sound.played).toContain(ESound.Correct)

    round.choose(0)
    expect(round.phase).toBe(ERoundPhase.Revealed)

    round.travel()
    expect(round.phase).toBe(ERoundPhase.Travelling)
    expect(round.traveller).toBe('travelling')
    expect(round.mapStop).toBe(1)
    expect(sound.played).toContain(ESound.Step)

    round.arrived(0)
    expect(round.phase).toBe(ERoundPhase.Travelling)
    round.arrived(1)
    expect(round.phase).toBe(ERoundPhase.Asking)
    expect(round.question).toMatchObject({ rung: 2, comunidadID: 'andalucia', locked: false })
  })

  it('on a wrong answer shows the right one, makes her sad and ends the round', async () => {
    const { round, sound, deck } = setup()
    await round.start(EMode.Game)
    const answer = right(round)
    const wrong = answer === 0 ? 1 : 0
    round.choose(wrong)
    await round.confirm()
    expect(round.phase).toBe(ERoundPhase.Revealed)
    expect(round.over).toBe(true)
    expect(round.status).toBe(ERoundStatus.Lost)
    expect(round.traveller).toBe('lost')
    expect(round.question?.options[wrong]?.state).toBe(EAnswerState.Wrong)
    expect(round.question?.options[answer]?.state).toBe(EAnswerState.Correct)
    expect(sound.played).toContain(ESound.Wrong)
    round.travel()
    expect(round.phase).toBe(ERoundPhase.Revealed)
    expect(deck.finished).toHaveLength(1)
  })

  it('wins in Madrid after 17 right answers and saves her record', async () => {
    const { round, sound, records } = setup()
    await round.start(EMode.Game)
    for (let i = 0; i < ROUND_LENGTH - 1; i++) await answerRightAndTravel(round)
    expect(round.mapStop).toBe(ROUND_LENGTH - 1)
    round.choose(right(round))
    await round.confirm()
    expect(round.status).toBe(ERoundStatus.Won)
    expect(round.traveller).toBe('won')
    expect(round.mapStop).toBe(ROUND_LENGTH - 1)
    expect(sound.played.at(-1)).toBe(ESound.Win)
    expect(round.state?.nationality).toBe(true)
    expect(records.saved.get('game')).toBe(ROUND_LENGTH)
  })

  it('uses each lifeline once, and keeps the error of a refused one', async () => {
    const { round, sound } = setup()
    await round.start(EMode.Game)
    while (round.state?.question?.type !== EQuestionType.Choice) await answerRightAndTravel(round)
    expect(round.useLifeline(ELifeline.FiftyFifty)).toBe(true)
    expect(round.question?.options.filter((o) => o.state === EAnswerState.Removed)).toHaveLength(1)
    expect(sound.played).toContain(ESound.Lifeline)
    expect(round.useLifeline(ELifeline.Audience)).toBe(true)
    expect(round.state?.audience?.percentages.reduce((a, b) => a + b, 0)).toBe(100)
    expect(round.useLifeline(ELifeline.Audience)).toBe(false)
    expect(round.error).toEqual(expect.objectContaining({ code: EErrorCode.InvalidState }))
    round.clearError()
    expect(round.error).toBeNull()
  })

  it('stops with the points she has', async () => {
    const { round, deck } = setup()
    await round.start(EMode.Game)
    await answerRightAndTravel(round)
    expect(await round.stop()).toBe(true)
    expect(round.status).toBe(ERoundStatus.Stopped)
    expect(round.state?.points).toBe(100)
    expect(deck.finished).toHaveLength(1)
    expect(await round.stop()).toBe(false)
  })

  it('keeps the error when the round can not start', async () => {
    const { round } = setup({ sets: false })
    await round.start(EMode.Game)
    expect(round.phase).toBe(ERoundPhase.Failed)
    expect(round.error).toEqual(expect.objectContaining({ code: EErrorCode.NotFound }))
    expect(round.question).toBeNull()
  })
})
