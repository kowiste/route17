// Her progress for the Progreso screen: each mode's set and what she has
// seen and mastered in it, per tarea; and starting a mode's set over.

import { defineStore } from 'pinia'
import { inject, ref, shallowRef, type InjectionKey } from 'vue'
import type { IQuestionCatalog, QuestionSetSummary } from '@/contracts/catalog'
import type { DeckSummary, IDeck } from '@/contracts/deck'
import { EMode } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'

export interface ProgressStoreDeps {
  readonly catalog: IQuestionCatalog
  readonly deck: IDeck
}

/** Provided by bootstrap: what the progress store works with. */
export const PROGRESS_STORE_DEPS: InjectionKey<ProgressStoreDeps> = Symbol('progress store deps')

/** The modes in the order the screen shows them. */
export const PROGRESS_MODES: readonly EMode[] = [EMode.Official, EMode.Game]

export interface ModeProgress {
  readonly mode: EMode
  /** The set the mode plays; null while there is none. */
  readonly set: QuestionSetSummary | null
  /** Her progress in it; null without a set. */
  readonly summary: DeckSummary | null
}

function injectDeps(): ProgressStoreDeps {
  const deps = inject(PROGRESS_STORE_DEPS, null)
  if (deps === null) {
    throw new AppError(EErrorCode.InvalidState, 'the progress store deps were not provided')
  }
  return deps
}

export const useProgressStore = defineStore('progress', () => {
  const deps = injectDeps()

  const modes = shallowRef<readonly ModeProgress[]>([])
  const loading = ref(false)
  /** What went wrong last; null when all is well. */
  const error = shallowRef<unknown>(null)

  async function modeProgress(mode: EMode): Promise<ModeProgress> {
    const set = await deps.catalog.newestSet(mode)
    const summary = set === null ? null : await deps.deck.summary(set.setID)
    return { mode, set, summary }
  }

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      modes.value = await Promise.all(PROGRESS_MODES.map((mode) => modeProgress(mode)))
    } catch (caught) {
      error.value = caught
    } finally {
      loading.value = false
    }
  }

  /** Forgets what she has seen and mastered in the mode's set. Returns whether it was reset. */
  async function reset(mode: EMode): Promise<boolean> {
    const set = modes.value.find((entry) => entry.mode === mode)?.set ?? null
    if (set === null) return false
    try {
      await deps.deck.reset(set.setID)
      const fresh = await modeProgress(mode)
      modes.value = modes.value.map((entry) => (entry.mode === mode ? fresh : entry))
      return true
    } catch (caught) {
      error.value = caught
      return false
    }
  }

  return { modes, loading, error, load, reset }
})
