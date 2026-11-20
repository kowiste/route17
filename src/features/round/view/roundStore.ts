// The round for the screens: the service's latest state, and where the screen
// is in the flow of a question (asking → revealed → travelling → asking…).
// The service moves on as soon as she confirms; the map stays on her stop
// until she presses "Continuar", and the next question waits for the map's
// `arrived`. Errors are kept for the screen to show, never thrown.

import { defineStore } from 'pinia'
import { computed, inject, ref, shallowRef, type InjectionKey } from 'vue'
import type { ELifeline } from '@/contracts/lifeline'
import type { EMode } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { SoundPlayer } from '@/shared/sound/soundPlayer'
import { ESound } from '@/shared/sound/sounds'
import type { RoundService } from '../app/roundService'
import { ERoundStatus } from '../domain/eRoundStatus'
import type { RoundState } from '../domain/roundState'
import { bestStop, ERoundPhase, ladderStatus, panelQuestion, travellerState } from './roundView'

export interface RoundStoreDeps {
  readonly rounds: RoundService
  readonly sound: SoundPlayer
}

/** Provided by bootstrap: what the round store works with. */
export const ROUND_STORE_DEPS: InjectionKey<RoundStoreDeps> = Symbol('round store deps')

function injectDeps(): RoundStoreDeps {
  const deps = inject(ROUND_STORE_DEPS, null)
  if (deps === null) {
    throw new AppError(EErrorCode.InvalidState, 'the round store deps were not provided')
  }
  return deps
}

export const useRoundStore = defineStore('round', () => {
  const deps = injectDeps()

  const state = shallowRef<RoundState | null>(deps.rounds.state())
  const phase = ref<ERoundPhase>(ERoundPhase.Idle)
  /** The stop the map shows: behind the service's after a right answer, until "Continuar". */
  const mapStop = ref(0)
  /** The last thing that went wrong, for the screen to show; null when all is well. */
  const error = shallowRef<unknown>(null)
  /** Waiting for the service (dealing, confirming, stopping). */
  const busy = ref(false)

  const question = computed(() => panelQuestion(state.value, phase.value))
  const status = computed(() => state.value?.status ?? null)
  const over = computed(() => status.value !== null && status.value !== ERoundStatus.Playing)
  const traveller = computed(() => travellerState(phase.value, status.value))
  const best = computed(() => bestStop(state.value?.best ?? 0))
  const ladder = computed(() => ({
    current: state.value?.rung ?? 1,
    status: ladderStatus(status.value ?? ERoundStatus.Playing),
    points: state.value?.points ?? 0,
    safePoints: state.value?.safePoints ?? 0,
  }))

  /** Runs a service call that answers at once; keeps the error instead of throwing. */
  function act(action: () => RoundState): boolean {
    try {
      state.value = action()
      error.value = null
      return true
    } catch (caught) {
      error.value = caught
      state.value = deps.rounds.state()
      return false
    }
  }

  async function start(mode: EMode): Promise<void> {
    phase.value = ERoundPhase.Loading
    error.value = null
    mapStop.value = 0
    busy.value = true
    try {
      const started = await deps.rounds.start(mode)
      state.value = started
      mapStop.value = started.stop
      phase.value = ERoundPhase.Asking
    } catch (caught) {
      error.value = caught
      phase.value = ERoundPhase.Failed
    } finally {
      busy.value = false
    }
  }

  function choose(index: number): void {
    if (phase.value !== ERoundPhase.Asking || busy.value) return
    if (act(() => deps.rounds.select(index))) deps.sound.play(ESound.Select)
  }

  function cancel(): void {
    if (phase.value !== ERoundPhase.Asking || busy.value) return
    if (state.value?.selected === null) return
    act(() => deps.rounds.deselect())
  }

  /** "¿Confirmas tu respuesta?" → yes: the verdict on the options, and a sound. */
  async function confirm(): Promise<void> {
    if (phase.value !== ERoundPhase.Asking || busy.value) return
    if (state.value === null || state.value.selected === null) return
    const answeredBefore = state.value.answers.length
    busy.value = true
    try {
      const next = await deps.rounds.confirm()
      state.value = next
      error.value = null
      phase.value = ERoundPhase.Revealed
      if (next.status === ERoundStatus.Won) deps.sound.play(ESound.Win)
      else deps.sound.play(next.lastAnswer?.correct === true ? ESound.Correct : ESound.Wrong)
    } catch (caught) {
      error.value = caught
      const now = deps.rounds.state()
      state.value = now
      // The answer counted even if saving the round's end failed: show it.
      if (now !== null && now.answers.length > answeredBefore) phase.value = ERoundPhase.Revealed
    } finally {
      busy.value = false
    }
  }

  /** "Continuar": the map takes her to the stop of the next question. */
  function travel(): void {
    const current = state.value
    if (phase.value !== ERoundPhase.Revealed || current?.status !== ERoundStatus.Playing) return
    phase.value = ERoundPhase.Travelling
    mapStop.value = current.stop
    deps.sound.play(ESound.Step)
  }

  /** The map's `arrived`: on the stop she was travelling to, the next question comes up. */
  function arrived(stop: number): void {
    if (phase.value !== ERoundPhase.Travelling || stop !== mapStop.value) return
    phase.value = ERoundPhase.Asking
  }

  /** Returns whether the lifeline was used. */
  function useLifeline(lifeline: ELifeline): boolean {
    if (phase.value !== ERoundPhase.Asking || busy.value) return false
    const used = act(() => deps.rounds.useLifeline(lifeline))
    if (used) deps.sound.play(ESound.Lifeline)
    return used
  }

  /** "Plantarse": ends the round with the points she has. Returns whether it ended. */
  async function stop(): Promise<boolean> {
    if (phase.value !== ERoundPhase.Asking || busy.value) return false
    busy.value = true
    try {
      state.value = await deps.rounds.stop()
      error.value = null
      phase.value = ERoundPhase.Idle
      return true
    } catch (caught) {
      error.value = caught
      state.value = deps.rounds.state()
      // The round ended even if saving its end failed: let the screen move on.
      const ended = state.value?.status === ERoundStatus.Stopped
      if (ended) phase.value = ERoundPhase.Idle
      return ended
    } finally {
      busy.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    state,
    phase,
    mapStop,
    error,
    busy,
    question,
    status,
    over,
    traveller,
    best,
    ladder,
    start,
    choose,
    cancel,
    confirm,
    travel,
    arrived,
    useLifeline,
    stop,
    clearError,
  }
})
