import { describe, expect, it } from 'vitest'
import { EMode, ETopic, TOPICS } from '@/contracts/question'
import { EErrorCode } from '@/shared/errors/appError'
import { QuestionCatalog } from '../app/questionCatalog'
import { GlobQuestionSetSource, type QuestionFileImports } from './questionFileLoader'

function imports(files: Record<string, unknown>): QuestionFileImports {
  return Object.fromEntries(
    Object.entries(files).map(([path, data]) => [path, () => Promise.resolve(data)])
  )
}

function question(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    topic: 'gobierno',
    type: 'trueFalse',
    question: `¿Verdadero o falso? Afirmación ${id}.`,
    options: ['Verdadero', 'Falso'],
    answer: 1,
    explanation: 'Es falso.',
    ...extra,
  }
}

const GAME_SET = { setID: 'game', mode: 'game', title: 'Modo juego' }

describe('GlobQuestionSetSource with given files', () => {
  it('groups the files by folder and merges question files in name order', async () => {
    const source = new GlobQuestionSetSource(
      imports({
        '/questions/game/t2-derechos.json': [question('g-t2-001')],
        '/questions/official-2026/questions.json': [question('o26-1')],
        '/questions/game/set.json': GAME_SET,
        '/questions/game/t1-gobierno.json': [question('g-t1-001'), question('g-t1-002')],
        '/questions/official-2026/set.json': {
          setID: 'official-2026',
          mode: 'official',
          edition: 2026,
          title: 'Manual CCSE 2026',
        },
      })
    )
    const folders = await source.load()
    expect(folders.map((folder) => folder.folder)).toEqual(['game', 'official-2026'])
    expect(folders[0]?.set).toEqual(GAME_SET)
    expect(folders[0]?.questions.map((q) => q.id)).toEqual(['g-t1-001', 'g-t1-002', 'g-t2-001'])
    expect(folders[1]?.set.edition).toBe(2026)
  })

  it('passes a missing difficulty on as missing: the default is the domain’s', async () => {
    const source = new GlobQuestionSetSource(
      imports({
        '/questions/game/set.json': GAME_SET,
        '/questions/game/t1.json': [question('g-1'), question('g-2', { difficulty: 3 })],
      })
    )
    const [game] = await source.load()
    expect(game?.questions.map((q) => q.difficulty)).toEqual([undefined, 3])
  })

  it('refuses a question file that does not match the format, naming it', async () => {
    const source = new GlobQuestionSetSource(
      imports({
        '/questions/game/set.json': GAME_SET,
        '/questions/game/t1.json': [question('g-1', { answer: 2 })],
      })
    )
    await expect(source.load()).rejects.toMatchObject({
      code: EErrorCode.CorruptData,
      details: {
        file: '/questions/game/t1.json',
        problems: ['0.answer: answer is not one of the options'],
      },
    })
  })

  it('refuses an invalid set.json', async () => {
    const source = new GlobQuestionSetSource(
      imports({
        '/questions/official-2026/set.json': {
          setID: 'official-2026',
          mode: 'official',
          title: 'x',
        },
        '/questions/official-2026/q.json': [question('o-1')],
      })
    )
    await expect(source.load()).rejects.toMatchObject({
      code: EErrorCode.CorruptData,
      details: { file: '/questions/official-2026/set.json' },
    })
  })

  it('refuses a folder without set.json', async () => {
    const source = new GlobQuestionSetSource(
      imports({ '/questions/game/t1.json': [question('g-1')] })
    )
    await expect(source.load()).rejects.toMatchObject({
      code: EErrorCode.CorruptData,
      details: { file: '/questions/game/set.json' },
    })
  })

  it('refuses a file outside a set folder', async () => {
    const source = new GlobQuestionSetSource(imports({ '/questions/stray.json': [] }))
    await expect(source.load()).rejects.toMatchObject({ code: EErrorCode.CorruptData })
  })

  it('has no sets when there are no files', async () => {
    expect(await new GlobQuestionSetSource(imports({})).load()).toEqual([])
  })
})

// The real `questions/` folder. Writers add questions while this runs, so
// nothing here depends on exact counts.
describe('the real questions folder', () => {
  it('loads every set folder, the game set among them', async () => {
    const folders = await new GlobQuestionSetSource().load()
    const game = folders.find((folder) => folder.folder === 'game')
    expect(game?.set.mode).toBe(EMode.Game)
    expect(game?.questions.length).toBeGreaterThan(0)
  })

  it('makes a catalog that plays the game set, with every tarea covered', async () => {
    const catalog = new QuestionCatalog(new GlobQuestionSetSource())
    const game = await catalog.newestSet(EMode.Game)
    expect(game?.setID).toBe('game')
    expect(game?.edition).toBeNull()

    const index = await catalog.index('game')
    expect(index.length).toBe(game?.total)
    expect(new Set(index.map((ref) => ref.id)).size).toBe(index.length)
    for (const { topic } of TOPICS) expect(game?.perTopic[topic]).toBeGreaterThan(0)
    expect(index.every((ref) => [1, 2, 3].includes(ref.difficulty))).toBe(true)

    const firstIDs = index.slice(0, 3).map((ref) => ref.id)
    const questions = await catalog.questions('game', firstIDs)
    expect(questions.map((q) => q.id)).toEqual(firstIDs)
    expect(questions.every((q) => q.answer < q.options.length)).toBe(true)
  })

  it('plays the newest official edition when there is one', async () => {
    const catalog = new QuestionCatalog(new GlobQuestionSetSource())
    const officials = (await catalog.sets()).filter((set) => set.mode === EMode.Official)
    const newest = await catalog.newestSet(EMode.Official)
    if (officials.length === 0) expect(newest).toBeNull()
    else {
      expect(newest?.edition).toBe(Math.max(...officials.map((set) => set.edition ?? 0)))
      expect(newest?.perTopic[ETopic.Government]).toBeGreaterThanOrEqual(0)
    }
  })
})
