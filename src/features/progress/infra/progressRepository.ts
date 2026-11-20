// Her decks in the browser: one key per set, `progress:<setID>`. Saved data
// that can't be read (corrupt, another version, another set's) counts as no
// data, with a warning: her progress of that set starts fresh.

import type { SetID } from '@/contracts/question'
import { logger as defaultLogger, type Logger } from '@/shared/logger/logger'
import type { KeyValueStore } from '@/shared/storage/keyValueStore'
import type { DeckState } from '../domain/deckState'
import type { IProgressRepository } from '../domain/interface'
import { toDeckState, toStoredDeck } from './progressMapper'
import { storedDeckSchema } from './storedDeck'

/** The key of a set's deck (the store adds its own prefix). */
export function progressKey(setID: SetID): string {
  return `progress:${setID}`
}

function parseJSON(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

export class ProgressRepository implements IProgressRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly logger: Logger = defaultLogger
  ) {}

  load(setID: SetID): DeckState | null {
    const text = this.store.get(progressKey(setID))
    if (text === null) return null
    const json = parseJSON(text)
    if (!json.ok) return this.unreadable(setID, 'not JSON')
    const parsed = storedDeckSchema.safeParse(json.value)
    if (!parsed.success) return this.unreadable(setID, parsed.error.issues[0]?.message ?? 'invalid')
    if (parsed.data.setID !== setID) return this.unreadable(setID, 'saved for another set')
    return toDeckState(parsed.data)
  }

  save(state: DeckState): void {
    this.store.set(progressKey(state.setID), JSON.stringify(toStoredDeck(state)))
  }

  remove(setID: SetID): void {
    this.store.remove(progressKey(setID))
  }

  private unreadable(setID: SetID, reason: string): null {
    this.logger.warn('saved progress could not be read: starting the set fresh', { setID, reason })
    return null
  }
}
