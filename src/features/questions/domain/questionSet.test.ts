import { describe, expect, it } from 'vitest'
import { EMode, EQuestionType, ETopic } from '@/contracts/question'
import { AppError, EErrorCode, isAppError } from '@/shared/errors/appError'
import type { QuestionSetFiles } from './interface'
import type { QuestionEntry, SetFile } from './questionFileSchema'
import { DEFAULT_DIFFICULTY, QuestionSet } from './questionSet'

function entry(id: string, overrides: Partial<QuestionEntry> = {}): QuestionEntry {
  return {
    id,
    topic: ETopic.Government,
    type: EQuestionType.Choice,
    question: `¿Cuál es la respuesta de ${id}?`,
    options: ['Una', 'Otra', 'La tercera'],
    answer: 0,
    explanation: 'Porque lo dice la Constitución.',
    difficulty: 1,
    ...overrides,
  }
}

function gameFiles(questions: QuestionEntry[], set: Partial<SetFile> = {}): QuestionSetFiles {
  return {
    folder: 'game',
    set: { setID: 'game', mode: EMode.Game, title: 'Modo juego', ...set },
    questions,
  }
}

function errorOf(make: () => unknown): AppError {
  try {
    make()
  } catch (error) {
    if (isAppError(error)) return error
    throw error
  }
  throw new Error('expected an AppError')
}

describe('QuestionSet', () => {
  it('summarises the set: mode, title, total and questions per tarea', () => {
    const set = QuestionSet.create(
      gameFiles([
        entry('g-1'),
        entry('g-2', { topic: ETopic.Rights }),
        entry('g-3', { topic: ETopic.Rights }),
        entry('g-4', { topic: ETopic.Society }),
      ])
    )
    expect(set.summary()).toEqual({
      setID: 'game',
      mode: EMode.Game,
      edition: null,
      title: 'Modo juego',
      total: 4,
      perTopic: {
        [ETopic.Government]: 1,
        [ETopic.Rights]: 2,
        [ETopic.Territory]: 0,
        [ETopic.CultureHistory]: 0,
        [ETopic.Society]: 1,
      },
    })
  })

  it('gives a question without a difficulty the default, 2', () => {
    const { difficulty: _omitted, ...withoutDifficulty } = entry('g-2')
    const set = QuestionSet.create(gameFiles([entry('g-1', { difficulty: 3 }), withoutDifficulty]))
    expect(DEFAULT_DIFFICULTY).toBe(2)
    expect(set.refs()).toEqual([
      { id: 'g-1', topic: ETopic.Government, difficulty: 3 },
      { id: 'g-2', topic: ETopic.Government, difficulty: 2 },
    ])
    expect(set.pick(['g-2'])[0]?.difficulty).toBe(2)
  })

  it('keeps the questions in file order and picks them in the order asked', () => {
    const set = QuestionSet.create(gameFiles([entry('g-1'), entry('g-2'), entry('g-3')]))
    expect(set.refs().map((ref) => ref.id)).toEqual(['g-1', 'g-2', 'g-3'])
    expect(set.pick(['g-3', 'g-1']).map((q) => q.id)).toEqual(['g-3', 'g-1'])
    expect(set.pick(['g-2'])[0]).toEqual({
      id: 'g-2',
      topic: ETopic.Government,
      type: EQuestionType.Choice,
      question: '¿Cuál es la respuesta de g-2?',
      options: ['Una', 'Otra', 'La tercera'],
      answer: 0,
      explanation: 'Porque lo dice la Constitución.',
      difficulty: 1,
    })
  })

  it('refuses to pick a question the set does not have', () => {
    const set = QuestionSet.create(gameFiles([entry('g-1')]))
    const error = errorOf(() => set.pick(['g-1', 'g-9']))
    expect(error.code).toBe(EErrorCode.NotFound)
    expect(error.details).toMatchObject({ setID: 'game', questionID: 'g-9' })
  })

  it('takes an official set with its edition from its folder official-YYYY', () => {
    const set = QuestionSet.create({
      folder: 'official-2026',
      set: { setID: 'official-2026', mode: EMode.Official, edition: 2026, title: 'Manual 2026' },
      questions: [entry('o26-1001')],
    })
    expect(set.summary()).toMatchObject({ mode: EMode.Official, edition: 2026, total: 1 })
  })

  it('refuses a set whose setID is not its folder', () => {
    const error = errorOf(() =>
      QuestionSet.create({ ...gameFiles([entry('g-1')]), folder: 'juego' })
    )
    expect(error.code).toBe(EErrorCode.CorruptData)
    expect(error.details.problems).toEqual(['setID "game" is not the folder\'s name "juego"'])
  })

  it('refuses an official set outside official-<edition> or without an edition', () => {
    const wrongFolder = errorOf(() =>
      QuestionSet.create({
        folder: 'official-2025',
        set: { setID: 'official-2025', mode: EMode.Official, edition: 2026, title: 'Manual' },
        questions: [entry('o-1')],
      })
    )
    expect(wrongFolder.code).toBe(EErrorCode.CorruptData)
    expect(wrongFolder.details.problems).toEqual([
      'an official set of 2026 lives in "official-2026"',
    ])

    const noEdition = errorOf(() =>
      QuestionSet.create({
        folder: 'official',
        set: { setID: 'official', mode: EMode.Official, title: 'Manual' },
        questions: [entry('o-1')],
      })
    )
    expect(noEdition.details.problems).toEqual(['an official set needs its edition'])
  })

  it('refuses a set without questions', () => {
    const error = errorOf(() => QuestionSet.create(gameFiles([])))
    expect(error.code).toBe(EErrorCode.CorruptData)
    expect(error.details.problems).toEqual(['the set has no questions'])
  })

  it('refuses an ID used twice, even in different files', () => {
    const error = errorOf(() =>
      QuestionSet.create(
        gameFiles([entry('g-1'), entry('g-2'), entry('g-1', { question: '¿Otra?' })])
      )
    )
    expect(error.code).toBe(EErrorCode.CorruptData)
    expect(error.details.problems).toEqual(['question ID g-1 is used twice'])
  })

  it('refuses the same question asked twice, whatever the case and spacing', () => {
    const error = errorOf(() =>
      QuestionSet.create(
        gameFiles([
          entry('g-1', { question: '¿Quién es el jefe del Estado?' }),
          entry('g-2', { question: '  ¿quién es el  jefe del Estado? ' }),
        ])
      )
    )
    expect(error.details.problems).toEqual(['g-1 and g-2 ask the same question'])
  })

  it('lists every problem at once', () => {
    const error = errorOf(() =>
      QuestionSet.create({
        ...gameFiles([entry('g-1'), entry('g-1')]),
        folder: 'other',
      })
    )
    expect(error.details.problems).toHaveLength(3)
  })
})
