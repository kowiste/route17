// Runs a round step by step: start it from the deck, pass on her picks and
// lifelines, and when it ends record the answers in the deck and her record.
// The rules are the `Round`'s; this only orchestrates.

import type { IQuestionCatalog } from '@/contracts/catalog'
import type { IDeck } from '@/contracts/deck'
import type { EMode } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import { newRandom, type Random } from '@/shared/random/random'
import type { ELifeline } from '../domain/eLifeline'
import type { IRoundRecords } from '../domain/interface'
import { Round } from '../domain/round'
import {
  parseCommand,
  selectOptionSchema,
  startRoundSchema,
  useLifelineSchema,
} from '../domain/roundCommand'
import type { RoundState } from '../domain/roundState'

export interface RoundServiceDeps {
  readonly catalog: IQuestionCatalog
  readonly deck: IDeck
  readonly records: IRoundRecords
  /** Makes each new round's `Random`: a fresh seed by default, a fixed one in tests. */
  readonly random?: () => Random
}

export class RoundService {
  private round: Round | null = null
  private readonly makeRandom: () => Random

  constructor(private readonly deps: RoundServiceDeps) {
    this.makeRandom = deps.random ?? newRandom
  }

  /** The round in progress, or the last one played; null before the first `start`. */
  state(): RoundState | null {
    return this.round?.state() ?? null
  }

  /** Starts a round of the mode's set, replacing any round still on. */
  async start(mode: EMode): Promise<RoundState> {
    const command = parseCommand(startRoundSchema, { mode })
    const set = await this.deps.catalog.newestSet(command.mode)
    if (set === null) {
      throw new AppError(EErrorCode.NotFound, `no question set for mode ${command.mode}`, {
        mode: command.mode,
      })
    }
    const ids = await this.deps.deck.deal(set.setID, ROUND_LENGTH)
    const [questions, stats, best] = await Promise.all([
      this.deps.catalog.questions(set.setID, ids),
      this.deps.deck.stats(set.setID, ids),
      this.deps.records.best(set.setID),
    ])
    this.round = Round.start({
      setID: set.setID,
      mode: command.mode,
      questions,
      stats,
      best,
      random: this.makeRandom(),
    })
    return this.round.state()
  }

  select(option: number): RoundState {
    const command = parseCommand(selectOptionSchema, { option })
    const round = this.current()
    round.select(command.option)
    return round.state()
  }

  deselect(): RoundState {
    const round = this.current()
    round.deselect()
    return round.state()
  }

  async confirm(): Promise<RoundState> {
    const round = this.current()
    round.confirm()
    if (round.over) await this.finish(round)
    return round.state()
  }

  useLifeline(lifeline: ELifeline): RoundState {
    const command = parseCommand(useLifelineSchema, { lifeline })
    const round = this.current()
    round.useLifeline(command.lifeline)
    return round.state()
  }

  async stop(): Promise<RoundState> {
    const round = this.current()
    round.stop()
    await this.finish(round)
    return round.state()
  }

  private current(): Round {
    if (this.round === null) {
      throw new AppError(EErrorCode.InvalidState, 'no round has been started')
    }
    return this.round
  }

  /** Called once, right after the round ends. */
  private async finish(round: Round): Promise<void> {
    await this.deps.deck.finish(round.setID, round.outcome())
    if (round.newRecord) await this.deps.records.save(round.setID, round.reached)
  }
}
