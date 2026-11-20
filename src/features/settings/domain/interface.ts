// The settings feature's ports.

import type { Settings } from './settings'

export interface ISettingsRepository {
  /** Her saved settings; null when none are saved or the saved ones can't be read. */
  load(): Settings | null
  save(settings: Settings): void
}
