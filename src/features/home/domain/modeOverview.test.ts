import { describe, expect, it } from 'vitest'
import type { QuestionSetSummary } from '@/contracts/catalog'
import { EMode, ETopic } from '@/contracts/question'
import { HOME_MODES, isPlayable, modeOverview } from './modeOverview'

function set(total: number): QuestionSetSummary {
  return {
    setID: 'official-2026',
    mode: EMode.Official,
    edition: 2026,
    title: 'Manual CCSE 2026',
    total,
    perTopic: {
      [ETopic.Government]: total,
      [ETopic.Rights]: 0,
      [ETopic.Territory]: 0,
      [ETopic.CultureHistory]: 0,
      [ETopic.Society]: 0,
    },
  }
}

describe('mode overview', () => {
  it('shows the official mode first', () => {
    expect(HOME_MODES).toEqual([EMode.Official, EMode.Game])
  })

  it('is playable only with a set of at least one round of questions', () => {
    expect(isPlayable(null)).toBe(false)
    expect(isPlayable(set(16))).toBe(false)
    expect(isPlayable(set(17))).toBe(true)
  })

  it('is pending, with no progress or record, while the mode has no set', () => {
    expect(modeOverview(EMode.Official, null, { seen: 3, mastered: 1, total: 9 }, 4)).toEqual({
      mode: EMode.Official,
      setID: null,
      setTitle: null,
      playable: false,
      progress: null,
      best: 0,
    })
  })

  it('carries the set, her progress and her record', () => {
    const progress = { seen: 40, mastered: 30, total: 300 }
    expect(modeOverview(EMode.Official, set(300), progress, 9)).toEqual({
      mode: EMode.Official,
      setID: 'official-2026',
      setTitle: 'Manual CCSE 2026',
      playable: true,
      progress,
      best: 9,
    })
  })
})
