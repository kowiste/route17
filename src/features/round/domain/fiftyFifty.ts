// The 50:50 lifeline.

import { EQuestionType, type QuestionData } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { Random } from '@/shared/random/random'
import { remainingWrongOptions } from './options'

/** Whether the 50:50 can be used on this question: not on a true/false one, which has a single wrong option. */
export function fiftyFiftyAllowed(question: QuestionData): boolean {
  return question.type !== EQuestionType.TrueFalse
}

/** Removes one wrong option, picked at random: returns the removed indexes. */
export function fiftyFifty(question: QuestionData, random: Random): number[] {
  if (!fiftyFiftyAllowed(question)) {
    throw new AppError(
      EErrorCode.InvalidState,
      'the 50:50 is not allowed on a true/false question',
      { questionID: question.id }
    )
  }
  return [random.pick(remainingWrongOptions(question, []))]
}
