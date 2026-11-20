// Checks every file under `questions/` against the format. Run it after
// editing questions: `pnpm vitest run src/features/questions/test`.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EMode } from '@/contracts/question'
import {
  questionsFileSchema,
  setFileSchema,
  type QuestionEntry,
} from '@/features/questions/domain/questionFileSchema'

const QUESTIONS_DIR = resolve(import.meta.dirname, '../../../../questions')

function readJSON(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function setFolders(): string[] {
  if (!existsSync(QUESTIONS_DIR)) return []
  return readdirSync(QUESTIONS_DIR).filter((name) =>
    statSync(join(QUESTIONS_DIR, name)).isDirectory()
  )
}

function questionFiles(folder: string): string[] {
  return readdirSync(join(QUESTIONS_DIR, folder))
    .filter((name) => name.endsWith('.json') && name !== 'set.json')
    .sort()
}

describe('question files', () => {
  it('has the game set', () => {
    expect(setFolders()).toContain('game')
  })

  for (const folder of setFolders()) {
    describe(folder, () => {
      it('has a valid set.json whose setID is the folder name', () => {
        const set = setFileSchema.parse(readJSON(join(QUESTIONS_DIR, folder, 'set.json')))
        expect(set.setID).toBe(folder)
        if (set.mode === EMode.Official) expect(folder).toBe(`official-${set.edition}`)
      })

      for (const file of questionFiles(folder)) {
        it(`${file} matches the question format`, () => {
          const result = questionsFileSchema.safeParse(readJSON(join(QUESTIONS_DIR, folder, file)))
          const problems = result.success
            ? []
            : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          expect(problems).toEqual([])
        })
      }

      it('has questions, with IDs unique across the whole set', () => {
        const all: QuestionEntry[] = questionFiles(folder).flatMap((file) => {
          const parsed = questionsFileSchema.safeParse(readJSON(join(QUESTIONS_DIR, folder, file)))
          return parsed.success ? parsed.data : []
        })
        expect(all.length).toBeGreaterThan(0)
        const seen = new Set<string>()
        const duplicates = all.filter((q) => (seen.has(q.id) ? true : (seen.add(q.id), false)))
        expect(duplicates.map((q) => q.id)).toEqual([])
      })

      it('has no question asked twice with the same words', () => {
        const all = questionFiles(folder).flatMap((file) => {
          const parsed = questionsFileSchema.safeParse(readJSON(join(QUESTIONS_DIR, folder, file)))
          return parsed.success ? parsed.data : []
        })
        const texts = new Map<string, string>()
        const repeated: string[] = []
        for (const q of all) {
          const key = q.question.toLowerCase().replace(/\s+/g, ' ').trim()
          const other = texts.get(key)
          if (other !== undefined) repeated.push(`${other} = ${q.id}`)
          else texts.set(key, q.id)
        }
        expect(repeated).toEqual([])
      })
    })
  }
})
