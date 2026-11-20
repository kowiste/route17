// Deck state ↔ its saved form. Pure field mapping.

import type { DeckState } from '../domain/deckState'
import { STORED_DECK_VERSION, type StoredDeck } from './storedDeck'

export function toStoredDeck(state: DeckState): StoredDeck {
  return {
    version: STORED_DECK_VERSION,
    setID: state.setID,
    cycle: state.cycle,
    round: state.round,
    roundsPlayed: state.roundsPlayed,
    order: state.order,
    pending: state.pending,
    missed: state.missed,
    history: state.history,
  }
}

export function toDeckState(stored: StoredDeck): DeckState {
  return {
    setID: stored.setID,
    cycle: stored.cycle,
    round: stored.round,
    roundsPlayed: stored.roundsPlayed,
    order: stored.order,
    pending: stored.pending,
    missed: stored.missed,
    history: stored.history,
  }
}
