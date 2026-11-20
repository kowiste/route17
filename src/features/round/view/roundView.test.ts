import { describe, expect, it } from 'vitest'
import { ELifeline } from '@/contracts/lifeline'
import { EMode, EQuestionType } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { SeededRandom } from '@/shared/random/random'
import { EAnswerState, ELadderStatus } from '@/shared/ui/types'
import { FakeCatalog, FakeDeck, sampleQuestions } from '@/test/fixtures/questions'
import { RoundService } from '../app/roundService'
import { ERoundStatus } from '../domain/eRoundStatus'
import { LADDER } from '../domain/ladder'
import {
  bestStop,
  ERoundPhase,
  LADDER_RUNGS,
  ladderStatus,
  panelQuestion,
  travellerState,
} from './roundView'

describe('round view', () => {
  it('shows the 17 rungs of the ladder', () => {
    expect(LADDER_RUNGS).toHaveLength(ROUND_LENGTH)
    expect(LADDER_RUNGS[4]).toEqual({
      comunidad: LADDER[4]?.comunidadID,
      points: 1_000,
      safe: true,
    })
  })

  it('maps the round status to the ladder', () => {
    expect(ladderStatus(ERoundStatus.Playing)).toBe(ELadderStatus.Playing)
    expect(ladderStatus(ERoundStatus.Won)).toBe(ELadderStatus.Won)
    expect(ladderStatus(ERoundStatus.Lost)).toBe(ELadderStatus.Lost)
    expect(ladderStatus(ERoundStatus.Stopped)).toBe(ELadderStatus.Stopped)
  })

  it('marks her record on the map as the stop she reached, none without one', () => {
    expect(bestStop(0)).toBe(-1)
    expect(bestStop(3)).toBe(3)
    expect(bestStop(ROUND_LENGTH)).toBe(ROUND_LENGTH - 1)
  })

  it('tells the map what she is doing', () => {
    expect(travellerState(ERoundPhase.Asking, ERoundStatus.Playing)).toBe('idle')
    expect(travellerState(ERoundPhase.Travelling, ERoundStatus.Playing)).toBe('travelling')
    expect(travellerState(ERoundPhase.Revealed, ERoundStatus.Lost)).toBe('lost')
    expect(travellerState(ERoundPhase.Revealed, ERoundStatus.Won)).toBe('won')
    expect(travellerState(ERoundPhase.Loading, null)).toBe('idle')
  })

  it('has no question in the panel without a round', () => {
    expect(panelQuestion(null, ERoundPhase.Asking)).toBeNull()
  })

  it('shows the 50:50 removed option crossed out, before and after the verdict', async () => {
    const questions = sampleQuestions('g')
    const catalog = new FakeCatalog([{ setID: 'game', mode: EMode.Game, questions }])
    const service = new RoundService({
      catalog,
      deck: new FakeDeck(catalog),
      records: { best: async () => 0, save: async () => undefined },
      random: () => new SeededRandom(3),
    })
    let state = await service.start(EMode.Game)
    while (state.question?.type !== EQuestionType.Choice) {
      const id = state.question?.questionID
      service.select(questions.find((q) => q.id === id)?.answer ?? 0)
      state = await service.confirm()
    }
    const answer = questions.find((q) => q.id === state.question?.questionID)?.answer ?? 0
    state = service.useLifeline(ELifeline.FiftyFifty)
    state = service.select(answer)
    const asking = panelQuestion(state, ERoundPhase.Asking)
    expect(asking?.options.map((o) => o.state).sort()).toEqual(
      [EAnswerState.Idle, EAnswerState.Removed, EAnswerState.Selected].sort()
    )

    state = await service.confirm()
    const revealed = panelQuestion(state, ERoundPhase.Revealed)
    expect(revealed?.options.map((o) => o.state).sort()).toEqual(
      [EAnswerState.Correct, EAnswerState.Idle, EAnswerState.Removed].sort()
    )
    expect(revealed?.explanation).toContain('Explicación de ejemplo')
  })
})
