// Gathers what Home shows for each mode: its set from the catalog, her
// progress from the deck, her record. The rules are in the domain.

import type { IQuestionCatalog } from '@/contracts/catalog'
import type { IDeck } from '@/contracts/deck'
import type { EMode } from '@/contracts/question'
import type { IRecordBook } from '../domain/interface'
import { HOME_MODES, modeOverview, type ModeOverview } from '../domain/modeOverview'

export interface HomeServiceDeps {
  readonly catalog: IQuestionCatalog
  readonly deck: IDeck
  readonly records: IRecordBook
}

export class HomeService {
  constructor(private readonly deps: HomeServiceDeps) {}

  /** Every mode, in Home's order. Throws the catalog's `AppError` when the sets can't be read. */
  async overview(): Promise<readonly ModeOverview[]> {
    return Promise.all(HOME_MODES.map((mode) => this.mode(mode)))
  }

  private async mode(mode: EMode): Promise<ModeOverview> {
    const set = await this.deps.catalog.newestSet(mode)
    if (set === null) return modeOverview(mode, null, null, 0)
    const [summary, best] = await Promise.all([
      this.deps.deck.summary(set.setID),
      this.deps.records.best(set.setID),
    ])
    return modeOverview(mode, set, summary, best)
  }
}
