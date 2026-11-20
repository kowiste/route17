// How the round screen shows a `RoundState`: which question is in the panel
// and how each option looks, what the map and the ladder are told. Pure
// presentation; the rules stay in the round's domain.

import type { EComunidadID } from '@/contracts/comunidad'
import type { ETopic } from '@/contracts/question'
import { EAnswerState, ELadderStatus, type LadderRung } from '@/shared/ui/types'
import { ERoundStatus } from '../domain/eRoundStatus'
import { LADDER, stopOf } from '../domain/ladder'
import type { OptionView, RoundState } from '../domain/roundState'

export { ERoundStatus }

/** Where the round screen is in the flow of one question. */
export enum ERoundPhase {
  /** No round on screen yet. */
  Idle = 'idle',
  /** The round is being dealt. */
  Loading = 'loading',
  /** The question is up: she picks an option and confirms it. */
  Asking = 'asking',
  /** She confirmed: right or wrong is on the options, the ⓘ, and the next step. */
  Revealed = 'revealed',
  /** The map is taking her to the next stop; the next question comes on arrival. */
  Travelling = 'travelling',
  /** The round could not start. */
  Failed = 'failed',
}

/** What the map does with her: RouteMap's `state` prop. */
export type TravellerState = 'idle' | 'travelling' | 'lost' | 'won'

export interface PanelOption {
  readonly index: number
  readonly text: string
  readonly state: EAnswerState
}

/** The question in the panel: the one to answer, or the one just answered. */
export interface PanelQuestion {
  readonly topic: ETopic
  /** 1–17. */
  readonly rung: number
  readonly comunidadID: EComunidadID
  readonly text: string
  readonly options: readonly PanelOption[]
  /** False while she can still pick. */
  readonly locked: boolean
  /** The verdict once confirmed; null while asking. */
  readonly correct: boolean | null
  /** The right option once confirmed; null while asking. */
  readonly answer: number | null
  readonly explanation: string | null
}

/** The 17 rungs as the prize ladder shows them. */
export const LADDER_RUNGS: readonly LadderRung[] = LADDER.map((rung) => ({
  comunidad: rung.comunidadID,
  points: rung.points,
  safe: rung.safe,
}))

const LADDER_STATUS: Readonly<Record<ERoundStatus, ELadderStatus>> = {
  [ERoundStatus.Playing]: ELadderStatus.Playing,
  [ERoundStatus.Won]: ELadderStatus.Won,
  [ERoundStatus.Lost]: ELadderStatus.Lost,
  [ERoundStatus.Stopped]: ELadderStatus.Stopped,
}

export function ladderStatus(status: ERoundStatus): ELadderStatus {
  return LADDER_STATUS[status]
}

/** Her record (right answers, 0–17) as a stop on the map; -1 when she has none. */
export function bestStop(best: number): number {
  return best > 0 ? stopOf(best) : -1
}

/** What the map shows her doing. */
export function travellerState(phase: ERoundPhase, status: ERoundStatus | null): TravellerState {
  if (phase === ERoundPhase.Travelling) return 'travelling'
  if (status === ERoundStatus.Won) return 'won'
  if (status === ERoundStatus.Lost) return 'lost'
  return 'idle'
}

function askingState(option: OptionView, selected: number | null): EAnswerState {
  if (option.removed) return EAnswerState.Removed
  return option.index === selected ? EAnswerState.Selected : EAnswerState.Idle
}

function revealedState(option: OptionView, chosen: number, answer: number): EAnswerState {
  if (option.index === answer) return EAnswerState.Correct
  if (option.index === chosen) return EAnswerState.Wrong
  if (option.removed) return EAnswerState.Removed
  return EAnswerState.Idle
}

/** The question the panel shows in `phase`; null when there is none. */
export function panelQuestion(state: RoundState | null, phase: ERoundPhase): PanelQuestion | null {
  if (state === null) return null
  if (phase === ERoundPhase.Asking && state.question !== null) {
    const { question, selected } = state
    return {
      topic: question.topic,
      rung: state.rung,
      comunidadID: state.comunidadID,
      text: question.text,
      options: question.options.map((option) => ({
        index: option.index,
        text: option.text,
        state: askingState(option, selected),
      })),
      locked: false,
      correct: null,
      answer: null,
      explanation: null,
    }
  }
  const last = state.lastAnswer
  if ((phase === ERoundPhase.Revealed || phase === ERoundPhase.Travelling) && last !== null) {
    return {
      topic: last.topic,
      rung: last.rung,
      comunidadID: last.comunidadID,
      text: last.text,
      options: last.options.map((option) => ({
        index: option.index,
        text: option.text,
        state: revealedState(option, last.chosen, last.answer),
      })),
      locked: true,
      correct: last.correct,
      answer: last.answer,
      explanation: last.explanation,
    }
  }
  return null
}
