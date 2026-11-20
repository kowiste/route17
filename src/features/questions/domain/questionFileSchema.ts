// The format of the files under `questions/`. A set is a folder: `set.json`
// describes it, every other `.json` in it is a list of questions (one file per
// tarea, or one file for the whole set). This schema is the contract between
// the question writers, the manual script and the game: change it only through
// the lead.

import { z } from 'zod'
import { EMode, EQuestionType, ETopic, TRUE_FALSE_OPTIONS } from '@/contracts/question'

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase letters, digits and dashes')

export const setFileSchema = z
  .object({
    setID: slug,
    mode: z.enum(EMode),
    /** The manual's edition year; required for an official set. */
    edition: z.number().int().min(2020).max(2100).optional(),
    title: z.string().min(1),
  })
  .strict()
  .superRefine((set, ctx) => {
    if (set.mode === EMode.Official && set.edition === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['edition'],
        message: 'an official set needs its edition',
      })
    }
  })

export type SetFile = z.infer<typeof setFileSchema>

export const questionEntrySchema = z
  .object({
    id: slug,
    topic: z.enum(ETopic),
    type: z.enum(EQuestionType),
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2).max(3),
    answer: z.number().int().min(0),
    explanation: z.string().trim().min(1),
    /** 1 easy, 2 medium, 3 hard. When missing the game treats it as 2. */
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (q.type === EQuestionType.Choice && q.options.length !== 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'a choice question has 3 options',
      })
    }
    if (
      q.type === EQuestionType.TrueFalse &&
      (q.options.length !== 2 || q.options.some((option, i) => option !== TRUE_FALSE_OPTIONS[i]))
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'a true/false question has exactly ["Verdadero", "Falso"]',
      })
    }
    if (q.answer >= q.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['answer'],
        message: 'answer is not one of the options',
      })
    }
    if (new Set(q.options).size !== q.options.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'two options are the same' })
    }
  })

export type QuestionEntry = z.infer<typeof questionEntrySchema>

export const questionsFileSchema = z.array(questionEntrySchema)
