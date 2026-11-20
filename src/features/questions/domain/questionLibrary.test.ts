import { describe, expect, it } from 'vitest'
import { EMode, EQuestionType, ETopic } from '@/contracts/question'
import { AppError, EErrorCode, isAppError } from '@/shared/errors/appError'
import type { QuestionSetFiles } from './interface'
import type { QuestionEntry } from './questionFileSchema'
import { QuestionLibrary } from './questionLibrary'

function entry(id: string): QuestionEntry {
  return {
    id,
    topic: ETopic.Territory,
    type: EQuestionType.TrueFalse,
    question: `¿Verdadero o falso? Afirmación ${id}.`,
    options: ['Verdadero', 'Falso'],
    answer: 0,
    explanation: 'Así es.',
  }
}

function game(folder = 'game'): QuestionSetFiles {
  return {
    folder,
    set: { setID: folder, mode: EMode.Game, title: 'Modo juego' },
    questions: [entry(`${folder}-1`)],
  }
}

function official(edition: number): QuestionSetFiles {
  const folder = `official-${edition}`
  return {
    folder,
    set: { setID: folder, mode: EMode.Official, edition, title: `Manual CCSE ${edition}` },
    questions: [entry(`o-${edition}`)],
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

describe('QuestionLibrary', () => {
  it('lists official sets newest edition first, then the game set', () => {
    const library = QuestionLibrary.create([game(), official(2026), official(2028), official(2027)])
    expect(library.sets().map((set) => set.setID)).toEqual([
      'official-2028',
      'official-2027',
      'official-2026',
      'game',
    ])
  })

  it('plays the newest official edition in the official mode and the game set in the game mode', () => {
    const library = QuestionLibrary.create([official(2026), game(), official(2027)])
    expect(library.newest(EMode.Official)?.setID).toBe('official-2027')
    expect(library.newest(EMode.Game)?.setID).toBe('game')
  })

  it('has no set for a mode without one', () => {
    const library = QuestionLibrary.create([game()])
    expect(library.newest(EMode.Official)).toBeNull()
    expect(QuestionLibrary.create([]).newest(EMode.Game)).toBeNull()
  })

  it('finds a set by its ID, and refuses an unknown one', () => {
    const library = QuestionLibrary.create([game(), official(2026)])
    expect(library.get('official-2026').edition).toBe(2026)
    const error = errorOf(() => library.get('official-1999'))
    expect(error.code).toBe(EErrorCode.NotFound)
  })

  it('refuses an invalid set and two sets with the same ID', () => {
    const broken = { ...game(), questions: [] }
    expect(errorOf(() => QuestionLibrary.create([official(2026), broken])).code).toBe(
      EErrorCode.CorruptData
    )
    expect(errorOf(() => QuestionLibrary.create([game(), game()])).code).toBe(
      EErrorCode.CorruptData
    )
  })
})
