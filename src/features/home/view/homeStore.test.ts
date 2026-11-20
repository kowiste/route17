import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { EMode } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import { FakeCatalog, FakeDeck, sampleQuestions } from '@/test/fixtures/questions'
import { HomeService } from '../app/homeService'
import { HOME_STORE_DEPS, useHomeStore } from './homeStore'
import { greeting, MODE_TEXT } from './homeText'

function setup(catalog = new FakeCatalog()) {
  const home = new HomeService({
    catalog,
    deck: new FakeDeck(catalog),
    records: { best: async () => 4 },
  })
  const app = createApp(defineComponent({ render: () => null }))
  const pinia = createPinia()
  app.use(pinia)
  app.provide(HOME_STORE_DEPS, { home })
  return { store: useHomeStore(pinia), catalog }
}

describe('home store', () => {
  it('loads the modes', async () => {
    const { store } = setup(
      new FakeCatalog([{ setID: 'game', mode: EMode.Game, questions: sampleQuestions() }])
    )
    const loading = store.load()
    expect(store.loading).toBe(true)
    await loading
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.modes.map((m) => [m.mode, m.playable, m.best])).toEqual([
      [EMode.Official, false, 0],
      [EMode.Game, true, 4],
    ])
  })

  it('keeps the error for the screen, and clears it on a good load', async () => {
    const { store, catalog } = setup()
    const working = catalog.newestSet.bind(catalog)
    catalog.newestSet = async () => {
      throw new AppError(EErrorCode.CorruptData, 'broken file')
    }
    await store.load()
    expect(store.error).toEqual(expect.objectContaining({ code: EErrorCode.CorruptData }))
    catalog.newestSet = working
    await store.load()
    expect(store.error).toBeNull()
    expect(store.modes).toHaveLength(2)
  })

  it('names the modes and greets her in Spanish', () => {
    expect(MODE_TEXT[EMode.Official].title).toBe('Modo oficial')
    expect(MODE_TEXT[EMode.Game].title).toBe('Modo juego')
    expect(greeting('Lucía')).toBe('¡Hola, Lucía!')
    expect(greeting('')).toBe('¡Hola!')
  })
})
