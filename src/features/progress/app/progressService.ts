// Her deck of each question set (`IDeck`): opens the saved deck, brought up to
// date with the catalog's questions, lets the domain decide, and saves it.

import type { IQuestionCatalog } from '@/contracts/catalog'
import type { DeckSummary, IDeck, QuestionStats, RoundOutcome } from '@/contracts/deck'
import type { QuestionID, QuestionRef, SetID } from '@/contracts/question'
import type { Random } from '@/shared/random/random'
import { Deck } from '../domain/deck'
import type { IProgressRepository } from '../domain/interface'

export interface ProgressServiceDeps {
  readonly catalog: IQuestionCatalog
  readonly repository: IProgressRepository
  /** Shuffles the sets; seeded in tests. */
  readonly random: Random
}

export class ProgressService implements IDeck {
  constructor(private readonly deps: ProgressServiceDeps) {}

  async deal(setID: SetID, count: number): Promise<readonly QuestionID[]> {
    const { deck } = await this.open(setID)
    const dealt = deck.deal(count, this.deps.random)
    this.deps.repository.save(deck.toState())
    return dealt
  }

  async finish(setID: SetID, outcome: RoundOutcome): Promise<void> {
    const { deck } = await this.open(setID)
    deck.finish(outcome)
    this.deps.repository.save(deck.toState())
  }

  async summary(setID: SetID): Promise<DeckSummary> {
    const { deck, refs } = await this.open(setID)
    return deck.summary(refs)
  }

  async stats(
    setID: SetID,
    ids: readonly QuestionID[]
  ): Promise<ReadonlyMap<QuestionID, QuestionStats>> {
    const { deck } = await this.open(setID)
    return deck.stats(ids)
  }

  async reset(setID: SetID): Promise<void> {
    this.deps.repository.remove(setID)
  }

  /** Throws `AppError` notFound for an unknown set (from the catalog). */
  private async open(setID: SetID): Promise<{ deck: Deck; refs: readonly QuestionRef[] }> {
    const refs = await this.deps.catalog.index(setID)
    const saved = this.deps.repository.load(setID)
    const deck = Deck.open(
      setID,
      refs.map((ref) => ref.id),
      saved,
      this.deps.random
    )
    return { deck, refs }
  }
}
