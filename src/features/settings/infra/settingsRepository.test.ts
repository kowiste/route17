import { describe, expect, it } from 'vitest'
import { MemoryLogger } from '@/shared/logger/logger'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { ETheme, type Settings } from '../domain/settings'
import { KeyValueSettingsRepository, SETTINGS_STORAGE_KEY } from './settingsRepository'

const SETTINGS: Settings = { name: 'Lucía', sound: false, theme: ETheme.Dark, welcomed: true }

function setup(): {
  repository: KeyValueSettingsRepository
  store: MemoryStore
  log: MemoryLogger
} {
  const store = new MemoryStore()
  const log = new MemoryLogger()
  return { repository: new KeyValueSettingsRepository(store, log), store, log }
}

describe('KeyValueSettingsRepository', () => {
  it('has nothing before she saves', () => {
    const { repository, log } = setup()
    expect(repository.load()).toBeNull()
    expect(log.entries).toEqual([])
  })

  it('saves her settings under their key, versioned, and reads them back', () => {
    const { repository, store } = setup()
    repository.save(SETTINGS)
    expect(JSON.parse(store.get(SETTINGS_STORAGE_KEY) ?? 'null')).toEqual({
      version: 1,
      settings: SETTINGS,
    })
    expect(new KeyValueSettingsRepository(store, new MemoryLogger()).load()).toEqual(SETTINGS)
  })

  it('treats data that is not JSON, or not valid, as nothing saved, with a warning', () => {
    for (const raw of [
      '{oops',
      JSON.stringify({ version: 2, settings: SETTINGS }),
      JSON.stringify({ version: 1, settings: { ...SETTINGS, theme: 'sepia' } }),
      JSON.stringify({ version: 1, settings: { ...SETTINGS, name: 'x'.repeat(50) } }),
    ]) {
      const { repository, store, log } = setup()
      store.set(SETTINGS_STORAGE_KEY, raw)
      expect(repository.load()).toBeNull()
      expect(log.entries).toEqual([expect.objectContaining({ level: 'warn' })])
    }
  })
})
