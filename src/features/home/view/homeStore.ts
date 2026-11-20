// What Home shows: the two modes with her progress and record. Loaded each
// time Home opens, so a finished round shows at once.

import { defineStore } from 'pinia'
import { inject, ref, shallowRef, type InjectionKey } from 'vue'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { HomeService } from '../app/homeService'
import type { ModeOverview } from '../domain/modeOverview'

export interface HomeStoreDeps {
  readonly home: HomeService
}

/** Provided by bootstrap: what the home store works with. */
export const HOME_STORE_DEPS: InjectionKey<HomeStoreDeps> = Symbol('home store deps')

function injectDeps(): HomeStoreDeps {
  const deps = inject(HOME_STORE_DEPS, null)
  if (deps === null) {
    throw new AppError(EErrorCode.InvalidState, 'the home store deps were not provided')
  }
  return deps
}

export const useHomeStore = defineStore('home', () => {
  const deps = injectDeps()

  const modes = shallowRef<readonly ModeOverview[]>([])
  const loading = ref(false)
  /** Why the modes couldn't be loaded; null when all is well. */
  const error = shallowRef<unknown>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      modes.value = await deps.home.overview()
    } catch (caught) {
      error.value = caught
    } finally {
      loading.value = false
    }
  }

  return { modes, loading, error, load }
})
