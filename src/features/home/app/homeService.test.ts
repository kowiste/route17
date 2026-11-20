import { describe, expect, it } from 'vitest'
import { EMode, type SetID } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import { FakeCatalog, FakeDeck, sampleQuestions } from '@/test/fixtures/questions'
import type { IRecordBook } from '../domain/interface'
import { HomeService } from './homeService'

function records(best: Record<SetID, number>): IRecordBook {
  return { best: async (setID) => best[setID] ?? 0 }
}

describe('HomeService', () => {
  it('gives each mode with its set, her progress and her record', async () => {
    const catalog = new FakeCatalog([
      { setID: 'game', mode: EMode.Game, questions: sampleQuestions('g') },
      {
        setID: 'official-2026',
        mode: EMode.Official,
        edition: 2026,
        questions: sampleQuestions('o'),
      },
    ])
    const deck = new FakeDeck(catalog)
    await deck.finish('game', { answered: [{ questionID: 'g-001', correct: true }], unreached: [] })
    const home = new HomeService({ catalog, deck, records: records({ game: 6 }) })
    const [official, game] = await home.overview()
    expect(official).toMatchObject({
      mode: EMode.Official,
      setID: 'official-2026',
      playable: true,
      progress: { seen: 0, mastered: 0, total: 20 },
      best: 0,
    })
    expect(game).toMatchObject({
      mode: EMode.Game,
      playable: true,
      progress: { seen: 1, mastered: 1, total: 20 },
      best: 6,
    })
  })

  it('shows the official mode as pending until its set exists', async () => {
    const catalog = new FakeCatalog([
      { setID: 'game', mode: EMode.Game, questions: sampleQuestions('g') },
    ])
    const home = new HomeService({ catalog, deck: new FakeDeck(catalog), records: records({}) })
    const [official] = await home.overview()
    expect(official).toMatchObject({ setID: null, playable: false, progress: null })
  })

  it('passes on the catalog error when the sets can not be read', async () => {
    const catalog = new FakeCatalog()
    catalog.newestSet = async () => {
      throw new AppError(EErrorCode.CorruptData, 'broken file')
    }
    const home = new HomeService({ catalog, deck: new FakeDeck(catalog), records: records({}) })
    await expect(home.overview()).rejects.toThrow(
      expect.objectContaining({ code: EErrorCode.CorruptData })
    )
  })
})
