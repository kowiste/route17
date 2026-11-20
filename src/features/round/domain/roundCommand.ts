// The shape of what the screens send to the round service. The rules (which
// option exists, which lifeline is left) are the `Round`'s.

import { z } from 'zod'
import { EMode } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import { ELifeline } from './eLifeline'

export const startRoundSchema = z.object({ mode: z.enum(EMode) })
export type StartRoundCommand = z.infer<typeof startRoundSchema>

export const selectOptionSchema = z.object({ option: z.number().int().min(0) })
export type SelectOptionCommand = z.infer<typeof selectOptionSchema>

export const useLifelineSchema = z.object({ lifeline: z.enum(ELifeline) })
export type UseLifelineCommand = z.infer<typeof useLifelineSchema>

/** Parses a command; throws `AppError` invalidInput when it doesn't match. */
export function parseCommand<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new AppError(EErrorCode.InvalidInput, 'invalid round command', {
      issues: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    })
  }
  return result.data
}
