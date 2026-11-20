// The lifelines inside a round: once each, the 50:50 on true/false, and what
// they leave on the current question.

import { describe, expect, it } from 'vitest'
import { EQuestionType } from '@/contracts/question'
import { EErrorCode } from '@/shared/errors/appError'
import { ELifeline, LIFELINES } from './eLifeline'
import {
  answerRight,
  makeQuestions,
  rightOption,
  startRound,
  wrongOption,
} from './test/roundFixtures'

const invalidState = expect.objectContaining({ code: EErrorCode.InvalidState })

describe('lifelines in a round', () => {
  it.each(LIFELINES)('allows %s once per round', (lifeline) => {
    const questions = makeQuestions()
    const round = startRound({ questions })
    round.useLifeline(lifeline)
    expect(round.state().lifelines[lifeline]).toEqual({ used: true, available: false })
    expect(() => round.useLifeline(lifeline)).toThrow(invalidState)
    answerRight(round, questions)
    expect(round.state().lifelines[lifeline]).toEqual({ used: true, available: false })
    expect(() => round.useLifeline(lifeline)).toThrow(invalidState)
  })

  it('refuses the 50:50 on a true/false question, and keeps it for later', () => {
    const questions = makeQuestions(EQuestionType.TrueFalse)
    const round = startRound({ questions })
    expect(round.state().lifelines[ELifeline.FiftyFifty]).toEqual({
      used: false,
      available: false,
    })
    expect(() => round.useLifeline(ELifeline.FiftyFifty)).toThrow(invalidState)
    expect(round.state().lifelines[ELifeline.FiftyFifty].used).toBe(false)
    expect(round.state().lifelines[ELifeline.Audience].available).toBe(true)
  })

  it('removes one wrong option with the 50:50, which she can no longer pick', () => {
    const questions = makeQuestions()
    const round = startRound({ questions })
    round.useLifeline(ELifeline.FiftyFifty)
    const options = round.state().question?.options ?? []
    const removed = options.filter((o) => o.removed)
    expect(removed).toHaveLength(1)
    expect(removed[0]?.index).not.toBe(rightOption(round, questions))
    expect(() => round.select(removed[0]?.index ?? -1)).toThrow(invalidState)
    expect(() => round.select(wrongOption(round, questions))).not.toThrow()
  })

  it('drops her pick when the 50:50 removes it, and keeps it otherwise', () => {
    const questions = makeQuestions()
    // Try both wrong picks: one of them is removed, the other one stays.
    const kept: (number | null)[] = [0, 1].map((pick) => {
      const round = startRound({ questions })
      round.select(pick)
      round.useLifeline(ELifeline.FiftyFifty)
      const removed = round.state().question?.options.find((o) => o.removed)?.index
      const selected = round.state().selected
      expect(selected).toBe(removed === pick ? null : pick)
      return selected
    })
    expect(kept).toContain(null)
  })

  it('puts the audience and the friend on screen, after the 50:50 only among the options left', () => {
    const questions = makeQuestions()
    const round = startRound({ questions })
    round.useLifeline(ELifeline.FiftyFifty)
    round.useLifeline(ELifeline.Audience)
    round.useLifeline(ELifeline.Friend)
    const state = round.state()
    const removed = state.question?.options.find((o) => o.removed)?.index ?? -1
    expect(state.audience?.percentages[removed]).toBe(0)
    expect(state.audience?.percentages.reduce((a, b) => a + b, 0)).toBe(100)
    expect(state.friend?.option).not.toBe(removed)
    expect(state.friend?.message.length).toBeGreaterThan(0)
  })

  it('clears what the lifelines showed when the next question comes', () => {
    const questions = makeQuestions()
    const round = startRound({ questions })
    round.useLifeline(ELifeline.FiftyFifty)
    round.useLifeline(ELifeline.Audience)
    round.useLifeline(ELifeline.Friend)
    answerRight(round, questions)
    const state = round.state()
    expect(state.audience).toBeNull()
    expect(state.friend).toBeNull()
    expect(state.question?.options.every((o) => !o.removed)).toBe(true)
    // The answered question remembers the 50:50 for the ⓘ.
    expect(state.lastAnswer?.options.filter((o) => o.removed)).toHaveLength(1)
  })
})
