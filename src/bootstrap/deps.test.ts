import { describe, expect, it } from 'vitest'
import { EMode } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { recordKey } from '@/features/round/infra/roundRecords'
import { progressKey } from '@/features/progress/infra/progressRepository'
import { rightAnswer, testDeps } from './test/harness'

describe('deps container', () => {
  it('wires the real services together on one store', async () => {
    const deps = testDeps()
    await deps.rounds.start(EMode.Game)
    // The deck is the progress feature's: the deal is saved.
    expect(deps.store.get(progressKey('game'))).not.toBeNull()
    for (let i = 0; i < 3; i++) {
      deps.rounds.select(rightAnswer(deps))
      await deps.rounds.confirm()
    }
    deps.rounds.select(rightAnswer(deps) === 0 ? 1 : 0)
    await deps.rounds.confirm()
    // The record is kept by round/infra, and Home reads it.
    expect(deps.store.get(recordKey('game'))).not.toBeNull()
    expect(await deps.records.best('game')).toBe(3)
    const [, game] = await deps.home.overview()
    expect(game).toMatchObject({ best: 3, progress: { seen: 4, mastered: 3 } })
  })

  it('keeps the avatar and the settings on the same store', () => {
    const deps = testDeps({ welcomed: false })
    expect(deps.settings.load().welcomed).toBe(false)
    deps.settings.rename('Lucía')
    expect(deps.settings.finishWelcome().welcomed).toBe(true)
    expect(deps.store.get('settings')).toContain('Lucía')
    expect(deps.avatar.load()).toBeDefined()
  })

  it('deals whole rounds', async () => {
    const deps = testDeps()
    const state = await deps.rounds.start(EMode.Official)
    expect(state.setID).toBe('official-2026')
    expect(state.answers).toHaveLength(0)
    expect(ROUND_LENGTH).toBe(17)
  })
})
