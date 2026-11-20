// Llamar a un amigo: the friend names one of the options on screen and says
// how sure they are. They are right more often on easier questions, and
// sounder when they are right.

import { EQuestionType, type Difficulty, type QuestionData } from '@/contracts/question'
import type { Random } from '@/shared/random/random'
import { between, chance, weighted } from './odds'
import { optionLetter, remainingWrongOptions } from './options'

export enum EFriendConfidence {
  Sure = 'sure',
  Think = 'think',
  Guess = 'guess',
}

export interface FriendAnswer {
  /** The option the friend names (an index into the question's options). */
  readonly option: number
  readonly confidence: EFriendConfidence
  /** How sure the friend says they are, in percent. */
  readonly certainty: number
  /** What the friend says, in Spanish. */
  readonly message: string
}

/** How often the friend names the right option, by difficulty. */
export const FRIEND_RIGHT_CHANCE: Readonly<Record<Difficulty, number>> = {
  1: 0.9,
  2: 0.75,
  3: 0.6,
}

/** How sure the friend sounds, depending on whether they are right. */
const CONFIDENCE_ODDS: Readonly<
  Record<'right' | 'wrong', readonly (readonly [EFriendConfidence, number])[]>
> = {
  right: [
    [EFriendConfidence.Sure, 0.55],
    [EFriendConfidence.Think, 0.35],
    [EFriendConfidence.Guess, 0.1],
  ],
  wrong: [
    [EFriendConfidence.Sure, 0.15],
    [EFriendConfidence.Think, 0.4],
    [EFriendConfidence.Guess, 0.45],
  ],
}

/** The certainty, in percent, that each confidence level says. */
export const FRIEND_CERTAINTY: Readonly<Record<EFriendConfidence, { min: number; max: number }>> = {
  [EFriendConfidence.Sure]: { min: 85, max: 99 },
  [EFriendConfidence.Think]: { min: 60, max: 84 },
  [EFriendConfidence.Guess]: { min: 30, max: 59 },
}

/** What the friend says; `{answer}` is the option they name. */
export const FRIEND_PHRASES: Readonly<Record<EFriendConfidence, readonly string[]>> = {
  [EFriendConfidence.Sure]: [
    '¡Esa me la sé! Es {answer}.',
    'Segurísimo: {answer}. No le des más vueltas.',
    'Ni lo dudes: {answer}. Me juego un bocadillo de calamares.',
  ],
  [EFriendConfidence.Think]: [
    'Creo que es {answer}, aunque no pondría la mano en el fuego.',
    'Me suena mucho {answer}. Yo iría por ahí.',
    'Diría que {answer}… casi seguro.',
  ],
  [EFriendConfidence.Guess]: [
    'Uf, me pillas fuera de juego. Si me obligas, {answer}.',
    'No lo tengo nada claro… ¿{answer}? No me hagas mucho caso.',
    'Ni idea, la verdad. A ojo, {answer}.',
  ],
}

/** How the friend names an option: "la B («El rey»)", or just "«Verdadero»" on a true/false question. */
function answerPhrase(question: QuestionData, option: number): string {
  const text = `«${question.options[option] ?? ''}»`
  return question.type === EQuestionType.TrueFalse ? text : `la ${optionLetter(option)} (${text})`
}

/** The friend's answer to `question`, with the options in `removed` off the screen. */
export function callFriend(
  question: QuestionData,
  removed: readonly number[],
  random: Random
): FriendAnswer {
  const wrong = remainingWrongOptions(question, removed)
  const right = wrong.length === 0 || chance(random, FRIEND_RIGHT_CHANCE[question.difficulty])
  const option = right ? question.answer : random.pick(wrong)
  const confidence = weighted(random, CONFIDENCE_ODDS[right ? 'right' : 'wrong'])
  const certainty = between(
    random,
    FRIEND_CERTAINTY[confidence].min,
    FRIEND_CERTAINTY[confidence].max
  )
  const message = random
    .pick(FRIEND_PHRASES[confidence])
    .replace('{answer}', answerPhrase(question, option))
  return { option, confidence, certainty, message }
}
