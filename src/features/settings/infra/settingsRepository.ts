// Her settings in the browser's key/value store, under `settings`. What comes
// back is parsed: data that isn't valid (corrupt, an old version) counts as
// none, with a warning, and she starts from the defaults.

import { z } from 'zod'
import type { Logger } from '@/shared/logger/logger'
import type { KeyValueStore } from '@/shared/storage/keyValueStore'
import type { ISettingsRepository } from '../domain/interface'
import { settingsSchema, type Settings } from '../domain/settings'

export const SETTINGS_STORAGE_KEY = 'settings'

const storedSettingsSchema = z.object({
  version: z.literal(1),
  settings: settingsSchema,
})

type StoredSettings = z.infer<typeof storedSettingsSchema>

function toStored(settings: Settings): StoredSettings {
  return {
    version: 1,
    settings: {
      name: settings.name,
      sound: settings.sound,
      theme: settings.theme,
      welcomed: settings.welcomed,
    },
  }
}

export class KeyValueSettingsRepository implements ISettingsRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly log: Logger
  ) {}

  load(): Settings | null {
    const raw = this.store.get(SETTINGS_STORAGE_KEY)
    if (raw === null) return null
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      this.log.warn('settings: the saved settings are not JSON; using the defaults')
      return null
    }
    const parsed = storedSettingsSchema.safeParse(data)
    if (!parsed.success) {
      this.log.warn('settings: the saved settings are not valid; using the defaults')
      return null
    }
    return parsed.data.settings
  }

  save(settings: Settings): void {
    this.store.set(SETTINGS_STORAGE_KEY, JSON.stringify(toStored(settings)))
  }
}
