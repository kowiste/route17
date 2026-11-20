// Her character for the screens: the saved look, and saving a new one.

import { defineStore } from 'pinia'
import { inject, shallowRef, type InjectionKey } from 'vue'
import type { AvatarLook } from '@/contracts/avatar'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { AvatarService } from '../app/avatarService'

export interface AvatarStoreDeps {
  readonly avatar: AvatarService
}

/** Provided by bootstrap: what the avatar store works with. */
export const AVATAR_STORE_DEPS: InjectionKey<AvatarStoreDeps> = Symbol('avatar store deps')

function injectDeps(): AvatarStoreDeps {
  const deps = inject(AVATAR_STORE_DEPS, null)
  if (deps === null) {
    throw new AppError(EErrorCode.InvalidState, 'the avatar store deps were not provided')
  }
  return deps
}

export const useAvatarStore = defineStore('avatar', () => {
  const deps = injectDeps()

  const look = shallowRef<AvatarLook>(deps.avatar.load())

  /** Saves her look; throws `AppError` invalidInput for one that breaks the rules. */
  function save(next: AvatarLook): AvatarLook {
    look.value = deps.avatar.save(next)
    return look.value
  }

  return { look, save }
})
