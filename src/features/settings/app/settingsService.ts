// Loads and changes her settings: read the saved ones, let the domain change
// them, save the result. The rules are the domain's.

import type { ISettingsRepository } from '../domain/interface'
import {
  defaultSettings,
  finishWelcome,
  rename,
  withSound,
  withTheme,
  type ETheme,
  type Settings,
} from '../domain/settings'

export interface SettingsServiceDeps {
  readonly repository: ISettingsRepository
}

export class SettingsService {
  constructor(private readonly deps: SettingsServiceDeps) {}

  /** Her settings: the saved ones, or the defaults. */
  load(): Settings {
    return this.deps.repository.load() ?? defaultSettings()
  }

  /** Throws `InvalidInput` for a name that breaks the rules; nothing is saved then. */
  rename(name: string): Settings {
    return this.save(rename(this.load(), name))
  }

  setSound(sound: boolean): Settings {
    return this.save(withSound(this.load(), sound))
  }

  setTheme(theme: ETheme): Settings {
    return this.save(withTheme(this.load(), theme))
  }

  /** Marks the welcome as done; throws `InvalidState` before she has a name. */
  finishWelcome(): Settings {
    return this.save(finishWelcome(this.load()))
  }

  private save(settings: Settings): Settings {
    this.deps.repository.save(settings)
    return settings
  }
}
