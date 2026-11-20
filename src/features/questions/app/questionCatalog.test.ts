import { describe, expect, it } from 'vitest'
import { EMode, EQuestionType, ETopic } from '@/contracts/question'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import type { IQuestionSetSource, QuestionSetFiles } from '../domain/interface'
import type { QuestionEntry } from '../domain/questionFileSchema'
import { QuestionCatalog } from './questionCatalog'

function entry(id: string, topic: ETopic, difficulty?: 1 | 2 | 3): QuestionEntry {
  return {
    id,
    topic,
    type: EQuestionType.Choice,
    question: `¿Pregunta ${id}?`,
    options: ['Sí', 'No', 'Quizá'],
    answer: 1,
    explanation: 'Explicación.',
    ...(difficulty === undefined ? {} : { difficulty }),
  }
}

const GAME: QuestionSetFiles = {
  folder: 'game',
  set: { setID: 'game', mode: EMode.Game, title: 'Modo juego' },
  questions: [
    entry('g-1', ETopic.Government, 1),
    entry('g-2', ETopic.Rights),
    entry('g-3', ETopic.Society, 3),
  ],
}

function official(edition: number): QuestionSetFiles {
  return {
    folder: `official-${edition}`,
    set: {
      setID: `official-${edition}`,
      mode: EMode.Official,
      edition,
      title: `Manual CCSE ${edition}`,
    },
    questions: [entry(`o-${edition}-1`, ETopic.CultureHistory, 2)],
  }
}

class FakeSource implements IQuestionSetSource {
  loads = 0
  failuresLeft = 0

  constructor(private readonly folders: readonly QuestionSetFiles[]) {}

  async load(): Promise<readonly QuestionSetFiles[]> {
    this.loads += 1
    if (this.failuresLeft > 0) {
      this.failuresLeft -= 1
      throw new Error('offline')
    }
    return this.folders
  }
}

describe('QuestionCatalog', () => {
  it('lists the sets, official ones newest first', async () => {
    const catalog = new QuestionCatalog(new FakeSource([GAME, official(2026), official(2027)]))
    const sets = await catalog.sets()
    expect(sets.map((set) => set.setID)).toEqual(['official-2027', 'official-2026', 'game'])
    expect(sets[2]).toEqual({
      setID: 'game',
      mode: EMode.Game,
      edition: null,
      title: 'Modo juego',
      total: 3,
      perTopic: {
        [ETopic.Government]: 1,
        [ETopic.Rights]: 1,
        [ETopic.Territory]: 0,
        [ETopic.CultureHistory]: 0,
        [ETopic.Society]: 1,
      },
    })
  })

  it('gives the set each mode plays, or null', async () => {
    const both = new QuestionCatalog(new FakeSource([official(2026), GAME, official(2027)]))
    expect((await both.newestSet(EMode.Official))?.setID).toBe('official-2027')
    expect((await both.newestSet(EMode.Game))?.setID).toBe('game')
    const gameOnly = new QuestionCatalog(new FakeSource([GAME]))
    expect(await gameOnly.newestSet(EMode.Official)).toBeNull()
  })

  it('indexes a set with the default difficulty filled in', async () => {
    const catalog = new QuestionCatalog(new FakeSource([GAME]))
    expect(await catalog.index('game')).toEqual([
      { id: 'g-1', topic: ETopic.Government, difficulty: 1 },
      { id: 'g-2', topic: ETopic.Rights, difficulty: 2 },
      { id: 'g-3', topic: ETopic.Society, difficulty: 3 },
    ])
  })

  it('gives the questions in the order asked', async () => {
    const catalog = new QuestionCatalog(new FakeSource([GAME]))
    const questions = await catalog.questions('game', ['g-3', 'g-1'])
    expect(questions.map((q) => q.id)).toEqual(['g-3', 'g-1'])
    expect(questions[0]?.options).toEqual(['Sí', 'No', 'Quizá'])
  })

  it('refuses an unknown set or question with notFound', async () => {
    const catalog = new QuestionCatalog(new FakeSource([GAME]))
    await expect(catalog.index('official-2026')).rejects.toMatchObject({
      code: EErrorCode.NotFound,
    })
    await expect(catalog.questions('official-2026', ['o-1'])).rejects.toBeInstanceOf(AppError)
    await expect(catalog.questions('game', ['g-1', 'g-404'])).rejects.toMatchObject({
      code: EErrorCode.NotFound,
    })
  })

  it('loads the files once', async () => {
    const source = new FakeSource([GAME])
    const catalog = new QuestionCatalog(source)
    await Promise.all([catalog.sets(), catalog.index('game'), catalog.newestSet(EMode.Game)])
    await catalog.questions('game', ['g-1'])
    expect(source.loads).toBe(1)
  })

  it('tries again after a load that failed', async () => {
    const source = new FakeSource([GAME])
    source.failuresLeft = 1
    const catalog = new QuestionCatalog(source)
    await expect(catalog.sets()).rejects.toThrow('offline')
    expect((await catalog.sets()).map((set) => set.setID)).toEqual(['game'])
    expect(source.loads).toBe(2)
  })

  it('refuses an invalid set with corruptData', async () => {
    const catalog = new QuestionCatalog(new FakeSource([{ ...GAME, folder: 'juego' }]))
    await expect(catalog.sets()).rejects.toMatchObject({ code: EErrorCode.CorruptData })
  })
})
