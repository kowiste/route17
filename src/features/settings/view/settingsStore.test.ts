import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createPinia } from 'pinia'
import { MemoryLogger } from '@/shared/logger/logger'
import type { SoundPlayer } from '@/shared/sound/soundPlayer'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { EErrorCode } from '@/shared/errors/appError'
import { createSettingsService } from '../feature'
import { ETheme } from '../domain/settings'
import { SETTINGS_STORE_DEPS, useSettingsStore } from './settingsStore'
import { applyTheme, THEME_LABELS } from './theme'

const ROOT = defineComponent({ render: () => null })

class MuteSpy implements SoundPlayer {
  muted = false

  play(): void {}

  setMuted(muted: boolean): void {
    this.muted = muted
  }
}

function setup() {
  const store = new MemoryStore()
  const settings = createSettingsService(store, new MemoryLogger())
  const sound = new MuteSpy()
  const app = createApp(ROOT)
  const pinia = createPinia()
  app.use(pinia)
  app.provide(SETTINGS_STORE_DEPS, { settings, sound })
  return { store: useSettingsStore(pinia), settings, sound }
}

describe('settings store', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('starts from the saved settings', () => {
    const { store } = setup()
    expect(store.settings).toMatchObject({ name: '', welcomed: false, theme: ETheme.System })
  })

  it('saves and applies each change: the theme on <html>, the sound on the player', () => {
    const { store, settings, sound } = setup()
    store.setTheme(ETheme.Dark)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    store.setTheme(ETheme.System)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    store.setSound(false)
    expect(sound.muted).toBe(true)
    store.rename('Lucía')
    store.finishWelcome()
    expect(store.settings).toMatchObject({ name: 'Lucía', sound: false, welcomed: true })
    expect(settings.load()).toEqual(store.settings)
  })

  it('passes on the rules: a bad name throws and changes nothing', () => {
    const { store } = setup()
    expect(() => store.rename('  ')).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidInput })
    )
    expect(store.settings.name).toBe('')
  })

  it('applies what was saved, at start', () => {
    const { store, sound } = setup()
    store.setTheme(ETheme.Light)
    store.setSound(false)
    document.documentElement.removeAttribute('data-theme')
    sound.muted = false
    store.apply()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(sound.muted).toBe(true)
  })

  it('names the themes in Spanish and sets them on any root', () => {
    expect(Object.values(THEME_LABELS)).toEqual(['Sistema', 'Claro', 'Oscuro'])
    const root = document.createElement('div')
    applyTheme(ETheme.Dark, root)
    expect(root.dataset.theme).toBe('dark')
  })

  it('refuses to work without its deps', () => {
    const app = createApp(ROOT)
    const pinia = createPinia()
    app.use(pinia)
    expect(() => useSettingsStore(pinia)).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidState })
    )
  })
})
