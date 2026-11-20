// The round's state machine: starting, answering, winning, losing, stopping,
// and every move the state doesn't allow.

import { describe, expect, it } from 'vitest'
import { EComunidadID } from '@/contracts/comunidad'
import { EMode } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { EErrorCode } from '@/shared/errors/appError'
import { SeededRandom } from '@/shared/random/random'
import { ELifeline } from './eLifeline'
import { ERoundStatus } from './eRoundStatus'
import { Round } from './round'
import {
  answerRight,
  answerWrong,
  makeQuestion,
  makeQuestions,
  mixedQuestions,
  rightOption,
  startRound,
  wrongOption,
} from './test/roundFixtures'

const invalidState = expect.objectContaining({ code: EErrorCode.InvalidState })
const invalidInput = expect.objectContaining({ code: EErrorCode.InvalidInput })

describe('starting a round', () => {
  it('starts on rung 1 in Canarias with nothing won and every lifeline ready', () => {
    const state = startRound().state()
    expect(state).toMatchObject({
      setID: 'game',
      mode: EMode.Game,
      status: ERoundStatus.Playing,
      rung: 1,
      comunidadID: EComunidadID.Canarias,
      stop: 0,
      reached: 0,
      points: 0,
      safePoints: 0,
      nextPoints: 100,
      selected: null,
      audience: null,
      friend: null,
      lastAnswer: null,
      answers: [],
      nationality: false,
      best: 0,
      newRecord: false,
    })
    expect(Object.values(state.lifelines).every((l) => !l.used)).toBe(true)
  })

  it('asks the easiest question first and hides which option is right', () => {
    const questions = mixedQuestions()
    const question = startRound({ questions }).state().question
    expect(question?.difficulty).toBe(1)
    expect(question?.options.map((o) => o.letter)).toEqual(
      ['A', 'B', 'C'].slice(0, question?.options.length)
    )
    expect(question?.options.every((o) => !o.removed)).toBe(true)
    expect(question).not.toHaveProperty('answer')
    expect(question).not.toHaveProperty('explanation')
  })

  it.each([
    ['too few questions', makeQuestions().slice(0, 16)],
    ['too many questions', [...makeQuestions(), makeQuestion('extra')]],
    ['a question twice', [...makeQuestions().slice(0, 16), makeQuestion('q-01')]],
  ])('refuses %s', (_name, questions) => {
    expect(() => startRound({ questions })).toThrow(invalidInput)
  })

  it.each([-1, 18, 2.5])('refuses a record of %s', (best) => {
    expect(() => startRound({ best })).toThrow(invalidInput)
  })
})

describe('answering', () => {
  it('lets her pick, change her mind and cancel before confirming', () => {
    const round = startRound()
    round.select(0)
    expect(round.state().selected).toBe(0)
    round.select(1)
    expect(round.state().selected).toBe(1)
    round.deselect()
    expect(round.state().selected).toBeNull()
    expect(round.state().reached).toBe(0)
  })

  it('refuses an option that is not on the question', () => {
    const round = startRound({ questions: makeQuestions() })
    expect(() => round.select(3)).toThrow(invalidInput)
    expect(() => round.select(-1)).toThrow(invalidInput)
    expect(() => round.select(0.5)).toThrow(invalidInput)
  })

  it('refuses to confirm before an option is picked', () => {
    const round = startRound()
    expect(() => round.confirm()).toThrow(invalidState)
    round.select(0)
    round.deselect()
    expect(() => round.confirm()).toThrow(invalidState)
  })

  it('climbs a rung on a right answer and moves to the next comunidad', () => {
    const questions = mixedQuestions()
    const round = startRound({ questions })
    const first = round.state().question
    answerRight(round, questions)
    const state = round.state()
    expect(state).toMatchObject({
      status: ERoundStatus.Playing,
      rung: 2,
      comunidadID: EComunidadID.Andalucia,
      stop: 1,
      reached: 1,
      points: 100,
      safePoints: 0,
      nextPoints: 200,
      selected: null,
    })
    expect(state.question?.questionID).not.toBe(first?.questionID)
    expect(state.lastAnswer).toMatchObject({
      questionID: first?.questionID,
      rung: 1,
      comunidadID: EComunidadID.Canarias,
      correct: true,
    })
    expect(state.lastAnswer?.chosen).toBe(state.lastAnswer?.answer)
    expect(state.lastAnswer?.explanation).toMatch(/^Explicación/)
  })

  it('wins the nationality after 17 right answers', () => {
    const questions = mixedQuestions()
    const round = startRound({ questions })
    answerRight(round, questions, ROUND_LENGTH)
    const state = round.state()
    expect(state).toMatchObject({
      status: ERoundStatus.Won,
      rung: 17,
      comunidadID: EComunidadID.Madrid,
      stop: 16,
      reached: 17,
      points: 100000,
      nextPoints: null,
      question: null,
      nationality: true,
    })
    expect(state.answers).toHaveLength(17)
    expect(round.outcome()).toEqual({
      answered: state.answers.map((a) => ({ questionID: a.questionID, correct: true })),
      unreached: [],
    })
  })

  it.each([
    [0, 0],
    [4, 0],
    [5, 1000],
    [7, 1000],
    [10, 7500],
    [16, 7500],
  ])('after %i right answers, a wrong one loses and keeps %i points', (right, points) => {
    const questions = mixedQuestions()
    const round = startRound({ questions })
    answerRight(round, questions, right)
    const wrongID = round.state().question?.questionID
    answerWrong(round, questions)
    const state = round.state()
    expect(state).toMatchObject({
      status: ERoundStatus.Lost,
      reached: right,
      rung: right + 1,
      stop: right,
      points,
      safePoints: points,
      question: null,
      nationality: false,
    })
    expect(state.lastAnswer).toMatchObject({ questionID: wrongID, correct: false })
    expect(state.lastAnswer?.chosen).not.toBe(state.lastAnswer?.answer)
    const outcome = round.outcome()
    expect(outcome.answered).toHaveLength(right + 1)
    expect(outcome.answered.at(-1)).toEqual({ questionID: wrongID, correct: false })
    expect(outcome.unreached).toHaveLength(ROUND_LENGTH - right - 1)
  })

  it('stops keeping the points she has, and gives back the rest unreached', () => {
    const questions = mixedQuestions()
    const round = startRound({ questions })
    answerRight(round, questions, 6)
    const unanswered = round.state().question?.questionID
    round.select(rightOption(round, questions))
    round.stop()
    const state = round.state()
    expect(state).toMatchObject({
      status: ERoundStatus.Stopped,
      reached: 6,
      rung: 7,
      points: 1500,
      safePoints: 1000,
      selected: null,
      question: null,
    })
    const outcome = round.outcome()
    expect(outcome.answered).toHaveLength(6)
    expect(outcome.unreached).toHaveLength(11)
    expect(outcome.unreached[0]).toBe(unanswered)
  })

  it('can stop before the first answer with nothing', () => {
    const round = startRound()
    round.stop()
    expect(round.state()).toMatchObject({ status: ERoundStatus.Stopped, points: 0, reached: 0 })
    expect(round.outcome()).toEqual({
      answered: [],
      unreached: expect.any(Array),
    })
    expect(round.outcome().unreached).toHaveLength(17)
  })

  it('accounts for every dealt question exactly once', () => {
    const questions = mixedQuestions()
    const round = startRound({ questions })
    answerRight(round, questions, 3)
    answerWrong(round, questions)
    const { answered, unreached } = round.outcome()
    const all = [...answered.map((a) => a.questionID), ...unreached].sort()
    expect(all).toEqual(questions.map((q) => q.id).sort())
  })
})

describe('a round that is over', () => {
  function lostRound(): Round {
    const questions = mixedQuestions()
    const round = startRound({ questions })
    answerWrong(round, questions)
    return round
  }

  it.each([
    ['select', (round: Round) => round.select(0)],
    ['deselect', (round: Round) => round.deselect()],
    ['confirm', (round: Round) => round.confirm()],
    ['stop', (round: Round) => round.stop()],
    ['use a lifeline', (round: Round) => round.useLifeline(ELifeline.Audience)],
  ])('refuses to %s', (_name, move) => {
    const round = lostRound()
    expect(() => move(round)).toThrow(invalidState)
    expect(round.state().status).toBe(ERoundStatus.Lost)
  })

  it('shows every lifeline as unavailable', () => {
    const lifelines = lostRound().state().lifelines
    expect(Object.values(lifelines).every((l) => !l.available)).toBe(true)
  })

  it('has no outcome while it is still on', () => {
    expect(() => startRound().outcome()).toThrow(invalidState)
  })
})

describe('her record', () => {
  it('is a new record once over and further than before', () => {
    const questions = mixedQuestions()
    const round = startRound({ questions, best: 3 })
    answerRight(round, questions, 5)
    expect(round.newRecord).toBe(false)
    answerWrong(round, questions)
    expect(round.state()).toMatchObject({ best: 3, newRecord: true, reached: 5 })
  })

  it('is not a new record when she matches or stays below it', () => {
    const questions = mixedQuestions()
    const round = startRound({ questions, best: 5 })
    answerRight(round, questions, 5)
    round.stop()
    expect(round.state()).toMatchObject({ best: 5, newRecord: false })
  })
})

describe('replaying', () => {
  it('plays the same round from the same seed and moves', () => {
    function play(seed: number) {
      const questions = mixedQuestions()
      const round = startRound({ questions, random: new SeededRandom(seed) })
      round.useLifeline(ELifeline.Friend)
      answerRight(round, questions, 2)
      round.useLifeline(ELifeline.Audience)
      round.select(wrongOption(round, questions))
      return round.state()
    }
    expect(play(9)).toEqual(play(9))
  })
})
