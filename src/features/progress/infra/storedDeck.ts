// The saved form of a deck, one key per set. Bump STORED_DECK_VERSION when the
// shape changes: saved decks of another version are dropped and start fresh.

import { z } from 'zod'
import type { DeckState } from '../domain/deckState'

export const STORED_DECK_VERSION = 1

const questionID = z.string().min(1)
const count = z.number().int().min(0)

export const storedDeckSchema = z.object({
  version: z.literal(STORED_DECK_VERSION),
  setID: z.string().min(1),
  cycle: z.number().int().min(1),
  round: count,
  roundsPlayed: count,
  order: z.array(questionID),
  pending: z
    .object({ round: z.number().int().min(1), questionIDs: z.array(questionID) })
    .nullable(),
  missed: z.array(z.object({ questionID, dueRound: count })),
  history: z.array(
    z.object({
      questionID,
      timesSeen: count,
      timesWrong: count,
      lastCorrect: z.boolean().nullable(),
    })
  ),
})

/** What is saved under a set's key: the deck's state and the format's version. */
export interface StoredDeck extends DeckState {
  readonly version: typeof STORED_DECK_VERSION
}
