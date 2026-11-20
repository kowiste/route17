import { describe, expect, it } from 'vitest'
import { MemoryLogger } from '@/shared/logger/logger'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { KeyValueRoundRecords, recordKey } from './roundRecords'

function setup() {
  const store = new MemoryStore()
  const log = new MemoryLogger()
  return { records: new KeyValueRoundRecords(store, log), store, log }
}

describe('KeyValueRoundRecords', () => {
  it('has no record (0) before the first round', async () => {
    const { records, log } = setup()
    expect(await records.best('game')).toBe(0)
    expect(log.entries).toEqual([])
  })

  it('keeps one record per set, under its own key', async () => {
    const { records, store } = setup()
    await records.save('game', 7)
    await records.save('official-2026', 17)
    expect(await records.best('game')).toBe(7)
    expect(await records.best('official-2026')).toBe(17)
    expect(JSON.parse(store.get(recordKey('game')) ?? 'null')).toEqual({
      version: 1,
      setID: 'game',
      best: 7,
    })
    expect(await new KeyValueRoundRecords(store, new MemoryLogger()).best('game')).toBe(7)
  })

  it('reads data it can not trust as no record, with a warning', async () => {
    for (const raw of [
      'not json',
      JSON.stringify({ version: 1, setID: 'game', best: 18 }),
      JSON.stringify({ version: 1, setID: 'game', best: 2.5 }),
      JSON.stringify({ version: 2, setID: 'game', best: 3 }),
      JSON.stringify({ version: 1, setID: 'official-2026', best: 3 }),
    ]) {
      const { records, store, log } = setup()
      store.set(recordKey('game'), raw)
      expect(await records.best('game')).toBe(0)
      expect(log.entries).toEqual([expect.objectContaining({ level: 'warn' })])
    }
  })
})
