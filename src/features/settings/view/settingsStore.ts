// Her settings for the screens: what they show, and the changes she makes.
// Every change is saved by the service, then applied to the page (theme) and
// the sound player (mute).

import { defineStore } from 'pinia'
import { inject, shallowRef, type InjectionKey } from 'vue'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { SoundPlayer } from '@/shared/sound/soundPlayer'
import type { SettingsService } from '../app/settingsService'
import type { ETheme, Settings } from '../domain/settings'
import { applyTheme } from './theme'

export interface SettingsStoreDeps {
  readonly settings: SettingsService
  readonly sound: SoundPlayer
}

/** Provided by bootstrap: what the settings store works with. */
export const SETTINGS_STORE_DEPS: InjectionKey<SettingsStoreDeps> = Symbol('settings store deps')

function injectDeps(): SettingsStoreDeps {
  const deps = inject(SETTINGS_STORE_DEPS, null)
  if (deps === null) {
    throw new AppError(EErrorCode.InvalidState, 'the settings store deps were not provided')
  }
  return deps
}

export const useSettingsStore = defineStore('settings', () => {
  const deps = injectDeps()

  const settings = shallowRef<Settings>(deps.settings.load())

  /** Puts her theme on the page and her sound choice on the player. */
  function apply(): void {
    applyTheme(settings.value.theme)
    deps.sound.setMuted(!settings.value.sound)
  }

  function update(next: Settings): Settings {
    settings.value = next
    apply()
    return next
  }

  /** Throws `AppError` invalidInput for a name that breaks the rules. */
  function rename(name: string): Settings {
    return update(deps.settings.rename(name))
  }

  function setSound(sound: boolean): Settings {
    return update(deps.settings.setSound(sound))
  }

  function setTheme(theme: ETheme): Settings {
    return update(deps.settings.setTheme(theme))
  }

  /** Throws `AppError` invalidState before she has a name. */
  function finishWelcome(): Settings {
    return update(deps.settings.finishWelcome())
  }

  return { settings, apply, rename, setSound, setTheme, finishWelcome }
})
