// Reads the question files under `questions/`: every `.json` directly inside a
// set's folder, bundled by Vite and fetched the first time the catalog needs
// them. Each file is parsed with the question-file schema and grouped by folder;
// checking a folder as a set is the domain's job (`QuestionSet`).

import type { z } from 'zod'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { IQuestionSetSource, QuestionSetFiles } from '../domain/interface'
import { questionsFileSchema, setFileSchema } from '../domain/questionFileSchema'

/** Lazy imports of question files, keyed by path from the project root: `/questions/game/set.json`. */
export type QuestionFileImports = Readonly<Record<string, () => Promise<unknown>>>

/** The real files. Only direct children of a set's folder, as `questionFiles.test.ts` checks. */
const QUESTION_FILES: QuestionFileImports = import.meta.glob('/questions/*/*.json', {
  import: 'default',
})

const SET_FILE = 'set.json'
const FILE_PATH = /^\/questions\/([^/]+)\/([^/]+\.json)$/

interface FolderFiles {
  setFile: (() => Promise<unknown>) | null
  questionFiles: { path: string; load: () => Promise<unknown> }[]
}

function corrupt(path: string, problems: readonly string[]): AppError {
  return new AppError(EErrorCode.CorruptData, `question file ${path} does not match the format`, {
    file: path,
    problems,
  })
}

function parse<T>(schema: z.ZodType<T>, path: string, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  throw corrupt(
    path,
    result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  )
}

function byPath(a: { path: string }, b: { path: string }): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

export class GlobQuestionSetSource implements IQuestionSetSource {
  constructor(private readonly files: QuestionFileImports = QUESTION_FILES) {}

  async load(): Promise<QuestionSetFiles[]> {
    const folders = new Map<string, FolderFiles>()
    for (const [path, load] of Object.entries(this.files)) {
      const match = FILE_PATH.exec(path)
      const folder = match?.[1]
      const name = match?.[2]
      if (folder === undefined || name === undefined) {
        throw corrupt(path, ['a question file goes directly inside a set folder'])
      }
      const files = folders.get(folder) ?? { setFile: null, questionFiles: [] }
      if (name === SET_FILE) files.setFile = load
      else files.questionFiles.push({ path, load })
      folders.set(folder, files)
    }
    const entries = [...folders].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return Promise.all(entries.map(([folder, files]) => this.loadFolder(folder, files)))
  }

  private async loadFolder(folder: string, files: FolderFiles): Promise<QuestionSetFiles> {
    const setPath = `/questions/${folder}/${SET_FILE}`
    if (files.setFile === null) throw corrupt(setPath, ['the folder has no set.json'])
    const set = parse(setFileSchema, setPath, await files.setFile())
    const questionFiles = [...files.questionFiles].sort(byPath)
    const lists = await Promise.all(
      questionFiles.map(async (file) => parse(questionsFileSchema, file.path, await file.load()))
    )
    return { folder, set, questions: lists.flat() }
  }
}
