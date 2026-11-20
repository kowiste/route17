// Helpers for the round's tests: a round of 17 questions and moves that answer
// it right or wrong without peeking at the order.

import {
  EMode,
  EQuestionType,
  ETopic,
  TRUE_FALSE_OPTIONS,
  type Difficulty,
  type QuestionData,
} from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { SeededRandom } from '@/shared/random/random'
import { sampleQuestions } from '@/test/fixtures/questions'
import { Round, type RoundStart } from '../round'

/** One question of the given type and difficulty; the right option is the last one. */
export function makeQuestion(
  id: string,
  type: EQuestionType = EQuestionType.Choice,
  difficulty: Difficulty = 1
): QuestionData {
  const options = type === EQuestionType.TrueFalse ? TRUE_FALSE_OPTIONS : ['Uno', 'Dos', 'Tres']
  return {
    id,
    topic: ETopic.Government,
    type,
    question: `¿Pregunta ${id}?`,
    options,
    answer: options.length - 1,
    explanation: `Explicación de ${id}.`,
    difficulty,
  }
}

/** 17 questions of one type and difficulty. */
export function makeQuestions(
  type: EQuestionType = EQuestionType.Choice,
  difficulty: Difficulty = 1
): QuestionData[] {
  return Array.from({ length: ROUND_LENGTH }, (_, i) =>
    makeQuestion(`q-${String(i + 1).padStart(2, '0')}`, type, difficulty)
  )
}

/** The first 17 sample questions: mixed tareas, types and difficulties. */
export function mixedQuestions(): QuestionData[] {
  return sampleQuestions('m').slice(0, ROUND_LENGTH)
}

export function startRound(overrides: Partial<RoundStart> = {}): Round {
  return Round.start({
    setID: 'game',
    mode: EMode.Game,
    questions: mixedQuestions(),
    stats: new Map(),
    best: 0,
    random: new SeededRandom(17),
    ...overrides,
  })
}

/** The current question's data, looked up by the ID the round shows. */
export function currentQuestion(round: Round, questions: readonly QuestionData[]): QuestionData {
  const id = round.state().question?.questionID
  const question = questions.find((q) => q.id === id)
  if (question === undefined) throw new Error('no current question')
  return question
}

export function rightOption(round: Round, questions: readonly QuestionData[]): number {
  return currentQuestion(round, questions).answer
}

/** A wrong option still on screen. */
export function wrongOption(round: Round, questions: readonly QuestionData[]): number {
  const question = currentQuestion(round, questions)
  const removed = round
    .state()
    .question?.options.filter((o) => o.removed)
    .map((o) => o.index)
  const wrong = question.options
    .map((_, i) => i)
    .find((i) => i !== question.answer && !(removed ?? []).includes(i))
  if (wrong === undefined) throw new Error('no wrong option left')
  return wrong
}

/** Answers `times` questions right. */
export function answerRight(round: Round, questions: readonly QuestionData[], times = 1): void {
  for (let i = 0; i < times; i++) {
    round.select(rightOption(round, questions))
    round.confirm()
  }
}

export function answerWrong(round: Round, questions: readonly QuestionData[]): void {
  round.select(wrongOption(round, questions))
  round.confirm()
}
