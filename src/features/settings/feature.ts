// Wiring: the settings service on a key/value store.

import { logger, type Logger } from '@/shared/logger/logger'
import type { KeyValueStore } from '@/shared/storage/keyValueStore'
import { SettingsService } from './app/settingsService'
import { KeyValueSettingsRepository } from './infra/settingsRepository'

export function createSettingsService(store: KeyValueStore, log: Logger = logger): SettingsService {
  return new SettingsService({ repository: new KeyValueSettingsRepository(store, log) })
}
