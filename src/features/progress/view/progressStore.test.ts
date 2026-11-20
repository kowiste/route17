import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { EMode } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import { MemoryLogger } from '@/shared/logger/logger'
import { SeededRandom } from '@/shared/random/random'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { FakeCatalog, sampleQuestions } from '@/test/fixtures/questions'
import { ProgressService } from '../app/progressService'
import { ProgressRepository } from '../infra/progressRepository'
import { PROGRESS_STORE_DEPS, useProgressStore } from './progressStore'

function setup(withOfficial = true) {
  const catalog = new FakeCatalog([
    { setID: 'game', mode: EMode.Game, questions: sampleQuestions('g') },
    ...(withOfficial
      ? [
          {
            setID: 'official-2026',
            mode: EMode.Official,
            edition: 2026,
            questions: sampleQuestions('o'),
          },
        ]
      : []),
  ])
  const deck = new ProgressService({
    catalog,
    repository: new ProgressRepository(new MemoryStore(), new MemoryLogger()),
    random: new SeededRandom(1),
  })
  const app = createApp(defineComponent({ render: () => null }))
  const pinia = createPinia()
  app.use(pinia)
  app.provide(PROGRESS_STORE_DEPS, { catalog, deck })
  return { store: useProgressStore(pinia), deck, catalog }
}

async function playOneRound(deck: ProgressService, setID: string): Promise<void> {
  const ids = await deck.deal(setID, 17)
  await deck.finish(setID, {
    answered: ids.slice(0, 3).map((questionID, i) => ({ questionID, correct: i !== 2 })),
    unreached: ids.slice(3),
  })
}

describe('progress store', () => {
  it('loads each mode with its set and her progress', async () => {
    const { store, deck } = setup()
    await playOneRound(deck, 'game')
    await store.load()
    const [official, game] = store.modes
    expect(official).toMatchObject({ mode: EMode.Official, summary: { seen: 0, total: 20 } })
    expect(game?.summary).toMatchObject({ seen: 3, mastered: 2, roundsPlayed: 1, cycle: 1 })
  })

  it('shows a mode without a set as having no progress', async () => {
    const { store } = setup(false)
    await store.load()
    expect(store.modes[0]).toEqual({ mode: EMode.Official, set: null, summary: null })
    expect(await store.reset(EMode.Official)).toBe(false)
  })

  it('starts a mode over and shows it at once', async () => {
    const { store, deck } = setup()
    await playOneRound(deck, 'game')
    await store.load()
    expect(await store.reset(EMode.Game)).toBe(true)
    expect(store.modes[1]?.summary).toMatchObject({ seen: 0, mastered: 0, roundsPlayed: 0 })
  })

  it('keeps the error for the screen', async () => {
    const { store, catalog } = setup()
    catalog.newestSet = async () => {
      throw new AppError(EErrorCode.CorruptData, 'broken file')
    }
    await store.load()
    expect(store.error).toEqual(expect.objectContaining({ code: EErrorCode.CorruptData }))
    expect(store.loading).toBe(false)
  })
})
