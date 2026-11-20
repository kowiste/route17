// The round: 17 questions on the route to Madrid, one per comunidad. A state
// machine, `playing` → `won` | `lost` | `stopped`, ended once.

import type { AnswerResult, QuestionStats, RoundOutcome } from '@/contracts/deck'
import type { EMode, QuestionData, QuestionID, SetID } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { Random } from '@/shared/random/random'
import { askAudience, type AudienceVote } from './audience'
import { ELifeline } from './eLifeline'
import { ERoundStatus } from './eRoundStatus'
import { fiftyFifty, fiftyFiftyAllowed } from './fiftyFifty'
import { callFriend, type FriendAnswer } from './friendCall'
import { comunidadAt, pointsAt, safePointsAt, stopOf } from './ladder'
import { optionLetter } from './options'
import { orderQuestions } from './questionOrder'
import type { AnswerView, LifelineStatus, OptionView, QuestionView, RoundState } from './roundState'

export interface RoundStart {
  readonly setID: SetID
  readonly mode: EMode
  /** The dealt questions, in any order: exactly ROUND_LENGTH, all different. */
  readonly questions: readonly QuestionData[]
  /** Her history with them; a question missing here counts as never seen. */
  readonly stats: ReadonlyMap<QuestionID, QuestionStats>
  /** Her record on the set before this round: the furthest rung reached (0–17). */
  readonly best: number
  /** Breaks the order's ties and drives the lifelines: the same seed replays the same round. */
  readonly random: Random
}

/** What the lifelines have shown on the current question. */
interface Help {
  readonly removed: readonly number[]
  readonly audience: AudienceVote | null
  readonly friend: FriendAnswer | null
}

const NO_HELP: Help = { removed: [], audience: null, friend: null }

interface Answered {
  readonly question: QuestionData
  readonly chosen: number
  readonly removed: readonly number[]
}

export class Round {
  private status_: ERoundStatus = ERoundStatus.Playing
  private selected: number | null = null
  private help: Help = NO_HELP
  private readonly answered: Answered[] = []
  private readonly used = new Set<ELifeline>()

  private constructor(
    readonly setID: SetID,
    readonly mode: EMode,
    /** Easy → hard: question i is asked on rung i + 1. */
    private readonly questions: readonly QuestionData[],
    private readonly best: number,
    private readonly random: Random
  ) {}

  static start(input: RoundStart): Round {
    if (input.questions.length !== ROUND_LENGTH) {
      throw new AppError(
        EErrorCode.InvalidInput,
        `a round needs ${ROUND_LENGTH} questions, got ${input.questions.length}`,
        { setID: input.setID, count: input.questions.length }
      )
    }
    if (new Set(input.questions.map((q) => q.id)).size !== input.questions.length) {
      throw new AppError(EErrorCode.InvalidInput, 'a round cannot ask a question twice', {
        setID: input.setID,
      })
    }
    if (!Number.isInteger(input.best) || input.best < 0 || input.best > ROUND_LENGTH) {
      throw new AppError(EErrorCode.InvalidInput, `a record is a rung from 0 to ${ROUND_LENGTH}`, {
        best: input.best,
      })
    }
    const questions = orderQuestions(input.questions, input.stats, input.random)
    return new Round(input.setID, input.mode, questions, input.best, input.random)
  }

  get status(): ERoundStatus {
    return this.status_
  }

  get over(): boolean {
    return this.status_ !== ERoundStatus.Playing
  }

  /** Rungs climbed: her right answers so far. */
  get reached(): number {
    return this.answered.filter((a) => a.chosen === a.question.answer).length
  }

  /** The round is over and she went further than her record. */
  get newRecord(): boolean {
    return this.over && this.reached > this.best
  }

  /** Picks an option; she can change it until she confirms. */
  select(option: number): void {
    const question = this.current('select an option')
    if (!Number.isInteger(option) || option < 0 || option >= question.options.length) {
      throw new AppError(EErrorCode.InvalidInput, `no option ${option} on this question`, {
        questionID: question.id,
        option,
      })
    }
    if (this.help.removed.includes(option)) {
      throw new AppError(EErrorCode.InvalidState, `option ${option} was removed by the 50:50`, {
        questionID: question.id,
        option,
      })
    }
    this.selected = option
  }

  /** Drops the picked option, if any. */
  deselect(): void {
    this.current('cancel the selection')
    this.selected = null
  }

  /** "¿Confirmas tu respuesta?": right climbs a rung (the last one wins), wrong loses. */
  confirm(): void {
    const question = this.current('confirm')
    if (this.selected === null) {
      throw new AppError(EErrorCode.InvalidState, 'no option selected to confirm', {
        questionID: question.id,
      })
    }
    const chosen = this.selected
    this.answered.push({ question, chosen, removed: this.help.removed })
    this.selected = null
    this.help = NO_HELP
    if (chosen !== question.answer) {
      this.status_ = ERoundStatus.Lost
    } else if (this.reached === ROUND_LENGTH) {
      this.status_ = ERoundStatus.Won
    }
  }

  /** Ends the round keeping the points she has. */
  stop(): void {
    this.current('stop')
    this.status_ = ERoundStatus.Stopped
    this.selected = null
    this.help = NO_HELP
  }

  /** Uses a lifeline on the current question; each one works once per round. */
  useLifeline(lifeline: ELifeline): void {
    const question = this.current(`use the ${lifeline} lifeline`)
    if (this.used.has(lifeline)) {
      throw new AppError(EErrorCode.InvalidState, `the ${lifeline} lifeline was already used`, {
        lifeline,
      })
    }
    switch (lifeline) {
      case ELifeline.FiftyFifty: {
        const removed = fiftyFifty(question, this.random)
        this.help = { ...this.help, removed }
        if (this.selected !== null && removed.includes(this.selected)) this.selected = null
        break
      }
      case ELifeline.Audience:
        this.help = {
          ...this.help,
          audience: askAudience(question, this.help.removed, this.random),
        }
        break
      case ELifeline.Friend:
        this.help = { ...this.help, friend: callFriend(question, this.help.removed, this.random) }
        break
    }
    this.used.add(lifeline)
  }

  /** What the deck records: the answered questions in order, and the ones never reached. */
  outcome(): RoundOutcome {
    if (!this.over) {
      throw new AppError(EErrorCode.InvalidState, 'the round is not over yet', {
        setID: this.setID,
      })
    }
    const answered: AnswerResult[] = this.answered.map((a) => ({
      questionID: a.question.id,
      correct: a.chosen === a.question.answer,
    }))
    const unreached = this.questions.slice(this.answered.length).map((q) => q.id)
    return { answered, unreached }
  }

  state(): RoundState {
    const reached = this.reached
    const rung = Math.min(reached + 1, ROUND_LENGTH)
    const playing = !this.over
    const question = playing ? this.questions[this.answered.length] : undefined
    const answers = this.answered.map((a, i) => answerView(a, i + 1))
    return {
      setID: this.setID,
      mode: this.mode,
      status: this.status_,
      rung,
      comunidadID: comunidadAt(rung),
      stop: stopOf(reached),
      reached,
      points: this.status_ === ERoundStatus.Lost ? safePointsAt(reached) : pointsAt(reached),
      safePoints: safePointsAt(reached),
      nextPoints: playing ? pointsAt(rung) : null,
      question: question === undefined ? null : questionView(question, this.help.removed),
      selected: this.selected,
      lifelines: {
        [ELifeline.FiftyFifty]: this.lifelineStatus(ELifeline.FiftyFifty, question),
        [ELifeline.Audience]: this.lifelineStatus(ELifeline.Audience, question),
        [ELifeline.Friend]: this.lifelineStatus(ELifeline.Friend, question),
      },
      audience: this.help.audience,
      friend: this.help.friend,
      lastAnswer: answers[answers.length - 1] ?? null,
      answers,
      nationality: this.status_ === ERoundStatus.Won,
      best: this.best,
      newRecord: this.newRecord,
    }
  }

  private lifelineStatus(lifeline: ELifeline, question: QuestionData | undefined): LifelineStatus {
    const used = this.used.has(lifeline)
    const allowed =
      question !== undefined && (lifeline !== ELifeline.FiftyFifty || fiftyFiftyAllowed(question))
    return { used, available: !used && allowed }
  }

  /** The question being asked; throws when the round is over. */
  private current(action: string): QuestionData {
    const question = this.over ? undefined : this.questions[this.answered.length]
    if (question === undefined) {
      throw new AppError(EErrorCode.InvalidState, `cannot ${action}: the round is over`, {
        status: this.status_,
      })
    }
    return question
  }
}

function questionView(question: QuestionData, removed: readonly number[]): QuestionView {
  return {
    questionID: question.id,
    topic: question.topic,
    type: question.type,
    difficulty: question.difficulty,
    text: question.question,
    options: question.options.map((text, index): OptionView => ({
      index,
      letter: optionLetter(index),
      text,
      removed: removed.includes(index),
    })),
  }
}

function answerView(answered: Answered, rung: number): AnswerView {
  const { question, chosen, removed } = answered
  return {
    ...questionView(question, removed),
    rung,
    comunidadID: comunidadAt(rung),
    chosen,
    answer: question.answer,
    correct: chosen === question.answer,
    explanation: question.explanation,
  }
}
