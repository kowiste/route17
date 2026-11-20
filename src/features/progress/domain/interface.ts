// The ports of the progress feature.

import type { SetID } from '@/contracts/question'
import type { DeckState } from './deckState'

/**
 * Where her decks are saved, one per set. Synchronous like the browser's
 * storage, so a load, a change and a save can't interleave with another call.
 */
export interface IProgressRepository {
  /** The saved deck of a set; null when there is none, or when it can't be read. */
  load(setID: SetID): DeckState | null
  save(state: DeckState): void
  remove(setID: SetID): void
}
