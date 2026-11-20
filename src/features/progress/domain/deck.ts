// The deck of one question set: which questions she gets in each round, and
// what she has learned.
//
// - The set is shuffled into an order. A deal takes first the missed questions
//   that are due (at most MAX_MISSED_PER_ROUND), then the next ones in the order.
//   Every deal is a round: the clock missed questions come back by.
// - A question she misses comes back MISSED_COMES_BACK_AFTER rounds later; a
//   right answer takes it off the missed list.
// - Finishing a round records her answers and puts the questions she never
//   reached back at the front of the order. A round dealt and never finished
//   (she closed the app) is dealt again first.
// - When the order runs out, a new cycle starts with a new shuffle. She sees
//   every question once per cycle; the questions of the round that ran out go
//   to the end of the new order, so none comes twice in a row.
// - When the set's files change, new questions join the order and removed ones
//   are forgotten; the rest of her progress stays.

import type { DeckSummary, ProgressCount, QuestionStats, RoundOutcome } from '@/contracts/deck'
import { ETopic, type QuestionID, type QuestionRef, type SetID } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { Random } from '@/shared/random/random'
import type { DeckState, PendingRound } from './deckState'

/** A missed question is dealt again this many rounds after the round she missed it in. */
export const MISSED_COMES_BACK_AFTER = 3

/** At most this many missed questions come back in one round. */
export const MAX_MISSED_PER_ROUND = 5

const NEVER_SEEN: QuestionStats = { timesSeen: 0, timesWrong: 0, lastCorrect: null }

interface DeckProps {
  readonly setID: SetID
  /** The set's questions, as the catalog has them now. */
  readonly questionIDs: readonly QuestionID[]
  cycle: number
  round: number
  roundsPlayed: number
  order: QuestionID[]
  pending: PendingRound | null
  /** Question → the round it comes back in, oldest miss first. */
  readonly missed: Map<QuestionID, number>
  readonly history: Map<QuestionID, QuestionStats>
}

function unique(ids: readonly QuestionID[]): QuestionID[] {
  return [...new Set(ids)]
}

function perTopic<T>(make: (topic: ETopic) => T): Record<ETopic, T> {
  return {
    [ETopic.Government]: make(ETopic.Government),
    [ETopic.Rights]: make(ETopic.Rights),
    [ETopic.Territory]: make(ETopic.Territory),
    [ETopic.CultureHistory]: make(ETopic.CultureHistory),
    [ETopic.Society]: make(ETopic.Society),
  }
}

export class Deck {
  private constructor(private readonly props: DeckProps) {}

  /**
   * Her deck for a set: a fresh one when nothing is saved, or the saved one
   * brought up to date with the set's questions as they are now.
   */
  static open(
    setID: SetID,
    questionIDs: readonly QuestionID[],
    saved: DeckState | null,
    random: Random
  ): Deck {
    const members = unique(questionIDs)
    if (saved === null) {
      return new Deck({
        setID,
        questionIDs: members,
        cycle: 1,
        round: 0,
        roundsPlayed: 0,
        order: random.shuffle(members),
        pending: null,
        missed: new Map(),
        history: new Map(),
      })
    }

    const inSet = new Set(members)
    function keep(id: QuestionID): boolean {
      return inSet.has(id)
    }
    const order = unique(saved.order).filter(keep)
    const pending =
      saved.pending === null
        ? null
        : {
            round: saved.pending.round,
            questionIDs: unique(saved.pending.questionIDs).filter(keep),
          }
    const missed = new Map(
      saved.missed.filter((m) => keep(m.questionID)).map((m) => [m.questionID, m.dueRound])
    )
    const history = new Map(
      saved.history
        .filter((record) => keep(record.questionID))
        .map((record) => [
          record.questionID,
          {
            timesSeen: record.timesSeen,
            timesWrong: record.timesWrong,
            lastCorrect: record.lastCorrect,
          },
        ])
    )
    const known = new Set([
      ...order,
      ...(pending?.questionIDs ?? []),
      ...missed.keys(),
      ...history.keys(),
    ])
    const added = members.filter((id) => !known.has(id))

    return new Deck({
      setID,
      questionIDs: members,
      cycle: saved.cycle,
      round: saved.round,
      roundsPlayed: saved.roundsPlayed,
      order: [...order, ...random.shuffle(added)],
      pending,
      missed,
      history,
    })
  }

  get setID(): SetID {
    return this.props.setID
  }

  /**
   * Starts a round: up to `count` different questions (fewer only when the set
   * is smaller). Throws `AppError` invalidInput for a count below 1.
   */
  deal(count: number, random: Random): QuestionID[] {
    if (!Number.isInteger(count) || count < 1) {
      throw new AppError(EErrorCode.InvalidInput, 'a round needs at least 1 question', { count })
    }
    const p = this.props
    p.round += 1
    const dealt: QuestionID[] = []
    const inRound = new Set<QuestionID>()
    function take(id: QuestionID): void {
      dealt.push(id)
      inRound.add(id)
    }

    // 1. A round dealt and never finished comes back first.
    const unfinished = p.pending
    p.pending = null
    if (unfinished !== null) {
      unfinished.questionIDs.slice(0, count).forEach(take)
      this.giveBack(unfinished.questionIDs.slice(count), unfinished.round)
    }

    // 2. The missed questions that are due, oldest first.
    const missedInRound = dealt.filter((id) => this.isDue(id, p.round)).length
    const room = Math.min(count - dealt.length, MAX_MISSED_PER_ROUND - missedInRound)
    this.dueMissed()
      .filter((id) => !inRound.has(id))
      .slice(0, Math.max(0, room))
      .forEach(take)

    // 3. The next ones in the order; a new cycle when it runs out.
    let newCycle = false
    while (dealt.length < count) {
      const index = p.order.findIndex((id) => !inRound.has(id))
      if (index === -1) {
        if (newCycle || p.questionIDs.every((id) => inRound.has(id))) break
        this.startCycle(inRound, random)
        newCycle = true
        continue
      }
      const [next] = p.order.splice(index, 1)
      if (next !== undefined) take(next)
    }

    p.pending = { round: p.round, questionIDs: dealt }
    return [...dealt]
  }

  /**
   * Ends the round started by the last deal. Throws `AppError` invalidState
   * when no round is going, invalidInput for a question that wasn't dealt in it
   * or that appears twice. A dealt question the outcome leaves out counts as unreached.
   */
  finish(outcome: RoundOutcome): void {
    const p = this.props
    const round = p.pending
    if (round === null) {
      throw new AppError(EErrorCode.InvalidState, 'there is no round to finish', {
        setID: p.setID,
      })
    }
    const dealt = new Set(round.questionIDs)
    const mentioned = new Set<QuestionID>()
    for (const id of [...outcome.answered.map((a) => a.questionID), ...outcome.unreached]) {
      if (!dealt.has(id)) {
        throw new AppError(EErrorCode.InvalidInput, `question ${id} was not dealt in this round`, {
          questionID: id,
        })
      }
      if (mentioned.has(id)) {
        throw new AppError(EErrorCode.InvalidInput, `question ${id} is in the outcome twice`, {
          questionID: id,
        })
      }
      mentioned.add(id)
    }

    for (const answer of outcome.answered) this.record(answer.questionID, answer.correct, round)
    const answered = new Set(outcome.answered.map((a) => a.questionID))
    this.giveBack(
      round.questionIDs.filter((id) => !answered.has(id)),
      round.round
    )
    p.pending = null
    p.roundsPlayed += 1
  }

  /** Seen, mastered (her last answer was right) and total: overall and per tarea. */
  summary(refs: readonly QuestionRef[]): DeckSummary {
    const history = this.props.history
    function count(list: readonly QuestionRef[]): ProgressCount {
      return {
        seen: list.filter((q) => (history.get(q.id)?.timesSeen ?? 0) > 0).length,
        mastered: list.filter((q) => history.get(q.id)?.lastCorrect === true).length,
        total: list.length,
      }
    }
    return {
      ...count(refs),
      perTopic: perTopic((topic) => count(refs.filter((q) => q.topic === topic))),
      cycle: this.props.cycle,
      roundsPlayed: this.props.roundsPlayed,
    }
  }

  /** Her history with the given questions; never-seen ones have zero counts. */
  stats(ids: readonly QuestionID[]): Map<QuestionID, QuestionStats> {
    return new Map(ids.map((id) => [id, this.props.history.get(id) ?? NEVER_SEEN]))
  }

  toState(): DeckState {
    const p = this.props
    return {
      setID: p.setID,
      cycle: p.cycle,
      round: p.round,
      roundsPlayed: p.roundsPlayed,
      order: [...p.order],
      pending:
        p.pending === null
          ? null
          : { round: p.pending.round, questionIDs: [...p.pending.questionIDs] },
      missed: [...p.missed].map(([questionID, dueRound]) => ({ questionID, dueRound })),
      history: [...p.history].map(([questionID, stats]) => ({ questionID, ...stats })),
    }
  }

  private record(id: QuestionID, correct: boolean, round: PendingRound): void {
    const before = this.props.history.get(id) ?? NEVER_SEEN
    this.props.history.set(id, {
      timesSeen: before.timesSeen + 1,
      timesWrong: before.timesWrong + (correct ? 0 : 1),
      lastCorrect: correct,
    })
    // Deleting first keeps the list oldest miss first.
    this.props.missed.delete(id)
    if (!correct) this.props.missed.set(id, round.round + MISSED_COMES_BACK_AFTER)
  }

  /**
   * Questions of a round she didn't answer: a missed one that was due stays on
   * the missed list (and is dealt first again); the others go back to the front
   * of the order, in the order they were dealt.
   */
  private giveBack(ids: readonly QuestionID[], round: number): void {
    const back = ids.filter((id) => !this.isDue(id, round))
    const backSet = new Set(back)
    this.props.order = [...back, ...this.props.order.filter((id) => !backSet.has(id))]
  }

  private isDue(id: QuestionID, round: number): boolean {
    const dueRound = this.props.missed.get(id)
    return dueRound !== undefined && dueRound <= round
  }

  /** The missed questions due by the current round, the earliest due first. */
  private dueMissed(): QuestionID[] {
    return [...this.props.missed]
      .filter(([, dueRound]) => dueRound <= this.props.round)
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id)
  }

  /** A new shuffle of the whole set; the questions already in this round go last. */
  private startCycle(inRound: ReadonlySet<QuestionID>, random: Random): void {
    const shuffled = random.shuffle(this.props.questionIDs)
    this.props.cycle += 1
    this.props.order = [
      ...shuffled.filter((id) => !inRound.has(id)),
      ...shuffled.filter((id) => inRound.has(id)),
    ]
  }
}
