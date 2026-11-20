import { describe, expect, it } from 'vitest'
import { MemoryLogger } from '@/shared/logger/logger'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import type { DeckState } from '../domain/deckState'
import { progressKey, ProgressRepository } from './progressRepository'
import { STORED_DECK_VERSION } from './storedDeck'

const STATE: DeckState = {
  setID: 'game',
  cycle: 2,
  round: 7,
  roundsPlayed: 6,
  order: ['g-3', 'g-1'],
  pending: { round: 7, questionIDs: ['g-2', 'g-4'] },
  missed: [{ questionID: 'g-4', dueRound: 9 }],
  history: [
    { questionID: 'g-2', timesSeen: 2, timesWrong: 0, lastCorrect: true },
    { questionID: 'g-4', timesSeen: 3, timesWrong: 2, lastCorrect: false },
  ],
}

function setup(): { store: MemoryStore; log: MemoryLogger; repository: ProgressRepository } {
  const store = new MemoryStore()
  const log = new MemoryLogger()
  return { store, log, repository: new ProgressRepository(store, log) }
}

describe('ProgressRepository', () => {
  it('has nothing for a set never saved', () => {
    const { repository, log } = setup()
    expect(repository.load('game')).toBeNull()
    expect(log.entries).toEqual([])
  })

  it('saves a deck under its set key and loads it back the same', () => {
    const { store, repository } = setup()
    repository.save(STATE)
    expect(store.get(progressKey('game'))).not.toBeNull()
    expect(repository.load('game')).toEqual(STATE)
    expect(repository.load('official-2026')).toBeNull()
  })

  it('keeps one deck per set', () => {
    const { repository } = setup()
    const official: DeckState = { ...STATE, setID: 'official-2026', pending: null }
    repository.save(STATE)
    repository.save(official)
    expect(repository.load('game')).toEqual(STATE)
    expect(repository.load('official-2026')).toEqual(official)
  })

  it('forgets a removed deck', () => {
    const { repository } = setup()
    repository.save(STATE)
    repository.remove('game')
    expect(repository.load('game')).toBeNull()
  })

  it.each([
    ['not JSON', '{"version": 1, "setID": "ga'],
    ['the wrong shape', JSON.stringify({ version: STORED_DECK_VERSION, setID: 'game', cycle: 0 })],
    ['another version', JSON.stringify({ ...STATE, version: STORED_DECK_VERSION + 1 })],
    ['data without a version', JSON.stringify(STATE)],
    ['another set’s deck', JSON.stringify({ ...STATE, setID: 'official-2026', version: 1 })],
    ['a negative count', JSON.stringify({ ...STATE, version: 1, roundsPlayed: -1 })],
  ])('reads %s as no deck, with a warning', (_case, text) => {
    const { store, log, repository } = setup()
    store.set(progressKey('game'), text)
    expect(repository.load('game')).toBeNull()
    expect(log.entries).toEqual([
      { level: 'warn', message: 'saved progress could not be read: starting the set fresh' },
    ])
  })
})
