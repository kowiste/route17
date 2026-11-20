import { describe, expect, it } from 'vitest'
import { ETopic, TOPICS } from '@/contracts/question'
import {
  formatPercent,
  formatPoints,
  optionLetter,
  rungComunidadName,
  rungState,
  stopLabel,
  topicLabel,
} from './format'
import { ELadderStatus, ERungState } from './types'

describe('formatPoints', () => {
  it('puts a dot every three digits, also in four-digit numbers', () => {
    expect(formatPoints(100)).toBe('100')
    expect(formatPoints(1000)).toBe('1.000')
    expect(formatPoints(7500)).toBe('7.500')
    expect(formatPoints(100000)).toBe('100.000')
    expect(formatPoints(1234567)).toBe('1.234.567')
    expect(formatPoints(0)).toBe('0')
  })
})

describe('formatPercent', () => {
  it('rounds and leaves a non-breaking space before the sign', () => {
    expect(formatPercent(62.4)).toBe('62 %')
    expect(formatPercent(0)).toBe('0 %')
  })
})

describe('optionLetter', () => {
  it('names options A, B, C', () => {
    expect([0, 1, 2].map(optionLetter)).toEqual(['A', 'B', 'C'])
  })
})

describe('topicLabel', () => {
  it('gives every tarea its number, exam title and a short name', () => {
    for (const { topic, number, title } of TOPICS) {
      const label = topicLabel(topic)
      expect(label.number).toBe(number)
      expect(label.title).toBe(title)
      expect(label.short.length).toBeGreaterThan(0)
      expect(label.short.length).toBeLessThanOrEqual(26)
    }
    expect(topicLabel(ETopic.Society).short).toBe('Sociedad')
  })
})

describe('stop labels', () => {
  it('reads the stop and its comunidad', () => {
    expect(stopLabel(3)).toBe('Parada 3 de 17')
    expect(rungComunidadName(1)).toBe('Canarias')
    expect(rungComunidadName(17)).toBe('Madrid')
    expect(rungComunidadName(0)).toBe('')
    expect(rungComunidadName(18)).toBe('')
  })
})

describe('rungState', () => {
  it('while playing: done below, current, ahead above', () => {
    expect(rungState(2, 5, ELadderStatus.Playing)).toBe(ERungState.Done)
    expect(rungState(5, 5, ELadderStatus.Playing)).toBe(ERungState.Current)
    expect(rungState(6, 5, ELadderStatus.Playing)).toBe(ERungState.Ahead)
  })

  it('lost: the current rung is the failed one', () => {
    expect(rungState(4, 5, ELadderStatus.Lost)).toBe(ERungState.Done)
    expect(rungState(5, 5, ELadderStatus.Lost)).toBe(ERungState.Failed)
    expect(rungState(6, 5, ELadderStatus.Lost)).toBe(ERungState.Ahead)
  })

  it('stopped: the current rung was never answered', () => {
    expect(rungState(4, 5, ELadderStatus.Stopped)).toBe(ERungState.Done)
    expect(rungState(5, 5, ELadderStatus.Stopped)).toBe(ERungState.Ahead)
  })

  it('won: every rung is done', () => {
    expect(rungState(17, 17, ELadderStatus.Won)).toBe(ERungState.Done)
    expect(rungState(1, 17, ELadderStatus.Won)).toBe(ERungState.Done)
  })
})
