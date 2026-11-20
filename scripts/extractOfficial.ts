// Extracts the questions of the Instituto Cervantes CCSE manual into the
// official question set, word for word:
//
//   pnpm extract:official             writes questions/official-2026/questions.json
//   pnpm extract:official --verbose   also lists every hyphenated word it joined
//
// The manual (manual/manual-preparacion-prueba-ccse-2026.pdf, git-ignored) lays
// the questions out in two columns: the manual's number (1001, 2001…: the first
// digit is the tarea), the question, then the options "a.", "b.", "c." (two
// options, "Verdadero." and "Falso.", for a true/false statement). The answer
// key ("Soluciones") at the end is a table of number and letter pairs.
//
// Only extraction artefacts are fixed (lines broken by the layout, words split
// with a hyphen at the end of a line); the wording is never corrected. Our own
// `explanation` and `difficulty` live in the same file: a re-run merges by ID
// and keeps them. A question new to the file gets an empty explanation, which
// the question-file test refuses until someone writes it. The script stops with
// an error when the body and the answer key don't hold the same numbers.
// Self-contained on purpose: Node runs it with type stripping only, so no enums
// and no `@/` imports.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { format, resolveConfig } from 'prettier'

type Topic = 'gobierno' | 'derechos' | 'territorio' | 'cultura-historia' | 'sociedad'
type QuestionType = 'choice' | 'trueFalse'
type Difficulty = 1 | 2 | 3

interface Question {
  id: string
  topic: Topic
  type: QuestionType
  question: string
  options: string[]
  answer: number
  explanation: string
  difficulty?: Difficulty
}

/** A run of text on a page, in PDF points (y grows upwards). */
interface Piece {
  x: number
  y: number
  width: number
  text: string
}

/** What we write ourselves; the manual gives the rest. */
interface Kept {
  explanation: string
  difficulty: Difficulty | undefined
}

interface Line {
  y: number
  pieces: Piece[]
}

interface Page {
  number: number
  /** The body text: no running header or footer, no decoration. */
  pieces: Piece[]
  /** The decoration: big titles such as "PREGUNTAS" or "SOLUCIONES" down the margin. */
  titles: string[]
}

/** A question as it is read from the body, before the answer key is applied. */
interface Draft {
  number: number
  page: number
  question: string[]
  options: string[][]
}

const ROOT = resolve(import.meta.dirname, '..')
const EDITION = 2026
const SOURCE = resolve(ROOT, `manual/manual-preparacion-prueba-ccse-${EDITION}.pdf`)
const TARGET_DIR = resolve(ROOT, `questions/official-${EDITION}`)
const TARGET = resolve(TARGET_DIR, 'questions.json')
const SET_FILE = resolve(TARGET_DIR, 'set.json')
const SET = {
  setID: `official-${EDITION}`,
  mode: 'official',
  edition: EDITION,
  title: `Manual CCSE ${EDITION}`,
}
const ID_PREFIX = `o${EDITION % 100}-`

/** Tarea n is TOPICS[n - 1]. */
const TOPICS: readonly Topic[] = [
  'gobierno',
  'derechos',
  'territorio',
  'cultura-historia',
  'sociedad',
]
const TRUE_FALSE_OPTIONS: readonly string[] = ['Verdadero', 'Falso']
const OPTION_LETTERS = ['a', 'b', 'c']

/** The running header and footer of every page sit outside this band. */
const BODY_TOP = 780
const BODY_BOTTOM = 45
/** Text taller than this is decoration (the big "PREGUNTAS" down the margin). */
const MAX_TEXT_HEIGHT = 14
/** The right column starts here. */
const COLUMN_SPLIT = 300
/** A question number starts this close to its column's left edge (a timeline's years do not). */
const NUMBER_ZONE = 4
/** Pieces on the same line differ in y by less than this. */
const LINE_TOLERANCE = 2

const verbose = process.argv.includes('--verbose')
const joinedHyphens: string[] = []

async function readPages(path: string): Promise<Page[]> {
  const data = new Uint8Array(readFileSync(path))
  const task = getDocument({ data, verbosity: 0 })
  const pdf = await task.promise
  const pages: Page[] = []
  for (let number = 1; number <= pdf.numPages; number++) {
    const content = await (await pdf.getPage(number)).getTextContent()
    const page: Page = { number, pieces: [], titles: [] }
    for (const item of content.items) {
      if (!('str' in item) || item.str === '') continue
      const x = item.transform[4]
      const y = item.transform[5]
      if (typeof x !== 'number' || typeof y !== 'number') continue
      if (y > BODY_TOP || y < BODY_BOTTOM) continue
      const text = item.str.normalize('NFC')
      if (item.height > MAX_TEXT_HEIGHT) page.titles.push(text)
      else page.pieces.push({ x, y, width: item.width, text })
    }
    pages.push(page)
  }
  await task.destroy()
  return pages
}

/** Groups pieces into lines, top to bottom, each line left to right. */
function toLines(pieces: Piece[]): Line[] {
  const sorted = [...pieces].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: Line[] = []
  for (const piece of sorted) {
    const last = lines.at(-1)
    if (last !== undefined && Math.abs(last.y - piece.y) < LINE_TOLERANCE) last.pieces.push(piece)
    else lines.push({ y: piece.y, pieces: [piece] })
  }
  for (const line of lines) line.pieces.sort((a, b) => a.x - b.x)
  return lines
}

/** The text of some pieces of one line; a space where the layout left a gap but no space. */
function lineText(pieces: Piece[]): string {
  let text = ''
  let end: number | undefined
  for (const piece of pieces) {
    const gap = end === undefined ? 0 : piece.x - end
    if (gap > 1 && !/\s$/.test(text) && !/^\s/.test(piece.text)) text += ' '
    text += piece.text
    end = piece.x + piece.width
  }
  return text.trim()
}

/** Joins the lines of one question or option: a word split with a hyphen is put back together. */
function joinLines(lines: string[]): string {
  let text = ''
  for (const line of lines) {
    const hyphenated = /\p{L}-$/u.test(text) && /^\p{Ll}/u.test(line)
    if (hyphenated) {
      const word = `${text.match(/\p{L}+-$/u)?.[0] ?? ''}${line.match(/^\p{L}+/u)?.[0] ?? ''}`
      joinedHyphens.push(`${word} → ${word.replace('-', '')}`)
      text = text.slice(0, -1) + line
    } else {
      text = text === '' ? line : `${text} ${line}`
    }
  }
  return text.replace(/\s+/g, ' ').trim()
}

interface Column {
  /** Where the column's question numbers start. */
  left: number
  lines: Line[]
}

function columnsOf(page: Page): Column[] {
  return [
    { left: 34, lines: toLines(page.pieces.filter((piece) => piece.x < COLUMN_SPLIT)) },
    { left: 304.7, lines: toLines(page.pieces.filter((piece) => piece.x >= COLUMN_SPLIT)) },
  ]
}

function wordsOf(line: Line): Piece[] {
  return line.pieces.filter((piece) => piece.text.trim() !== '')
}

/** The line's question number, when it starts a question. */
function numberOf(line: Line, column: Column): Piece | undefined {
  const first = wordsOf(line)[0]
  if (first === undefined || Math.abs(first.x - column.left) >= NUMBER_ZONE) return undefined
  return /^[1-5]\d{3}$/.test(first.text) && wordsOf(line).length > 1 ? first : undefined
}

/** Reads the questions of the body, column by column, in reading order. */
function readDrafts(pages: Page[]): Draft[] {
  const drafts: Draft[] = []
  let current: Draft | undefined
  for (const page of pages) {
    const columns = columnsOf(page)
    const isQuestionPage = columns.some((column) =>
      column.lines.some((line) => numberOf(line, column) !== undefined)
    )
    if (!isQuestionPage) {
      current = undefined
      continue
    }
    for (const column of columns) {
      for (const line of column.lines) {
        const first = wordsOf(line)[0]
        if (first === undefined) continue
        const number = numberOf(line, column)
        if (number !== undefined) {
          current = { number: Number(number.text), page: page.number, question: [], options: [] }
          drafts.push(current)
          current.question.push(lineText(line.pieces.filter((piece) => piece !== number)))
          continue
        }
        if (current === undefined) {
          throw new Error(
            `page ${page.number}: text before the first question: ${lineText(line.pieces)}`
          )
        }
        const label = /^([abc])\.$/.exec(first.text)?.[1]
        if (label !== undefined) {
          const expected = OPTION_LETTERS[current.options.length]
          if (label !== expected) {
            throw new Error(
              `${current.number}: option "${label}." where "${expected}." was expected`
            )
          }
          const rest = lineText(line.pieces.filter((piece) => piece !== first))
          current.options.push(rest === '' ? [] : [rest])
          continue
        }
        const text = lineText(line.pieces)
        const lastOption = current.options.at(-1)
        if (lastOption !== undefined) lastOption.push(text)
        else current.question.push(text)
      }
    }
  }
  return drafts
}

/** Reads the answer key: every "number letter" pair from the "SOLUCIONES" page on. */
function readAnswerKey(pages: Page[]): Map<number, string> {
  const start = pages.findIndex((page) => page.titles.includes('SOLUCIONES'))
  if (start < 0) throw new Error('the answer key ("SOLUCIONES") was not found')
  const key = new Map<number, string>()
  for (const page of pages.slice(start)) {
    for (const line of toLines(page.pieces)) {
      const words = line.pieces.map((piece) => piece.text.trim()).filter((text) => text !== '')
      for (let i = 0; i + 1 < words.length; i++) {
        const number = words[i] ?? ''
        const letter = words[i + 1] ?? ''
        if (!/^[1-5]\d{3}$/.test(number) || !/^[abc]$/.test(letter)) continue
        if (key.has(Number(number))) throw new Error(`the answer key has ${number} twice`)
        key.set(Number(number), letter)
        i++
      }
    }
  }
  return key
}

function tareaOf(number: number): number {
  return Math.floor(number / 1000)
}

/** The answer key's own count per tarea; its numbering must run N001, N002… with no gap. */
function keyCounts(key: Map<number, string>): number[] {
  const counts = TOPICS.map(() => 0)
  for (const number of key.keys()) {
    const i = tareaOf(number) - 1
    counts[i] = (counts[i] ?? 0) + 1
  }
  counts.forEach((count, i) => {
    for (let n = 1; n <= count; n++) {
      const number = (i + 1) * 1000 + n
      if (!key.has(number)) throw new Error(`the answer key skips ${number}`)
    }
  })
  return counts
}

function toQuestion(draft: Draft, letter: string, kept: Kept | undefined): Question {
  const where = `${draft.number} (page ${draft.page})`
  const topic = TOPICS[tareaOf(draft.number) - 1]
  if (topic === undefined) throw new Error(`${where}: no tarea for this number`)
  const question = joinLines(draft.question)
  const options = draft.options.map(joinLines)
  if (question === '') throw new Error(`${where}: the question has no text`)
  if (options.some((option) => option === '')) throw new Error(`${where}: an empty option`)
  const answer = OPTION_LETTERS.indexOf(letter)
  if (answer < 0 || answer >= options.length) {
    throw new Error(`${where}: the key's answer "${letter}" is not one of its options`)
  }
  // The manual writes "Verdadero." and "Falso."; the format wants them without the period.
  const isTrueFalse =
    options.length === 2 &&
    options.every((option, i) => option.replace(/\.$/, '') === TRUE_FALSE_OPTIONS[i])
  if (options.length !== 3 && !isTrueFalse) {
    throw new Error(`${where}: ${options.length} options: ${JSON.stringify(options)}`)
  }
  const entry: Question = {
    id: `${ID_PREFIX}${draft.number}`,
    topic,
    type: isTrueFalse ? 'trueFalse' : 'choice',
    question,
    options: isTrueFalse ? [...TRUE_FALSE_OPTIONS] : options,
    answer,
    explanation: kept?.explanation ?? '',
  }
  if (kept?.difficulty !== undefined) entry.difficulty = kept.difficulty
  return entry
}

/** Our own fields of the questions already in the file, by ID: a re-run keeps them. */
function keptFields(): Map<string, Kept> {
  const kept = new Map<string, Kept>()
  if (!existsSync(TARGET)) return kept
  const parsed: unknown = JSON.parse(readFileSync(TARGET, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${TARGET} is not a list of questions`)
  const list: unknown[] = parsed
  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null || !('id' in entry)) continue
    if (typeof entry.id !== 'string') continue
    const explanation =
      'explanation' in entry && typeof entry.explanation === 'string' ? entry.explanation : ''
    const difficulty = 'difficulty' in entry ? entry.difficulty : undefined
    kept.set(entry.id, {
      explanation,
      difficulty: difficulty === 1 || difficulty === 2 || difficulty === 3 ? difficulty : undefined,
    })
  }
  return kept
}

async function writeJSON(path: string, value: unknown): Promise<void> {
  const config = (await resolveConfig(path)) ?? {}
  writeFileSync(path, await format(JSON.stringify(value), { ...config, filepath: path }))
}

async function main(): Promise<void> {
  if (!existsSync(SOURCE)) throw new Error(`put the manual in ${SOURCE}`)
  const pages = await readPages(SOURCE)
  const drafts = readDrafts(pages)
  const key = readAnswerKey(pages)
  const expected = keyCounts(key)

  const seen = new Set<number>()
  for (const draft of drafts) {
    if (seen.has(draft.number)) throw new Error(`${draft.number} appears twice in the body`)
    seen.add(draft.number)
  }
  const missing = [...key.keys()].filter((number) => !seen.has(number))
  const unkeyed = [...seen].filter((number) => !key.has(number))
  if (missing.length > 0) throw new Error(`questions in the key but not found: ${missing}`)
  if (unkeyed.length > 0) throw new Error(`questions with no answer in the key: ${unkeyed}`)

  const kept = keptFields()
  const questions = drafts
    .sort((a, b) => a.number - b.number)
    .map((draft) =>
      toQuestion(draft, key.get(draft.number) ?? '', kept.get(`${ID_PREFIX}${draft.number}`))
    )

  mkdirSync(TARGET_DIR, { recursive: true })
  await writeJSON(SET_FILE, SET)
  await writeJSON(TARGET, questions)

  console.log(`Read ${pages.length} pages of ${SOURCE}`)
  const found = TOPICS.map((topic) => questions.filter((q) => q.topic === topic).length)
  TOPICS.forEach((topic, i) => {
    const mark = found[i] === expected[i] ? 'ok' : 'MISMATCH'
    console.log(`Tarea ${i + 1} (${topic}): ${found[i]} found, ${expected[i]} in the key  ${mark}`)
  })
  const trueFalse = questions.filter((question) => question.type === 'trueFalse').length
  console.log(
    `${questions.length} questions: ${questions.length - trueFalse} choice, ${trueFalse} true/false`
  )
  const dropped = [...kept.keys()].filter((id) => !questions.some((question) => question.id === id))
  if (dropped.length > 0) console.log(`No longer in the manual, dropped: ${dropped.join(', ')}`)
  const unexplained = questions.filter((question) => question.explanation === '')
  if (unexplained.length > 0) {
    console.log(`${unexplained.length} questions still need an explanation and a difficulty`)
  }
  if (verbose) console.log(`Joined hyphenated words:\n  ${joinedHyphens.join('\n  ')}`)
  if (found.some((count, i) => count !== expected[i])) process.exitCode = 1
}

main()
