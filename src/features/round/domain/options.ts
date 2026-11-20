// The options of a question as she sees them: lettered A, B, C, some maybe
// removed by the 50:50.

import type { QuestionData } from '@/contracts/question'

/** The letter of each option, in order: she picks with A/B/C (or 1/2/3). */
export const OPTION_LETTERS: readonly string[] = ['A', 'B', 'C']

export function optionLetter(index: number): string {
  return OPTION_LETTERS[index] ?? String(index + 1)
}

/** The indexes of the options still on screen. */
export function remainingOptions(question: QuestionData, removed: readonly number[]): number[] {
  return question.options.map((_, i) => i).filter((i) => !removed.includes(i))
}

/** The indexes of the wrong options still on screen. */
export function remainingWrongOptions(
  question: QuestionData,
  removed: readonly number[]
): number[] {
  return remainingOptions(question, removed).filter((i) => i !== question.answer)
}
