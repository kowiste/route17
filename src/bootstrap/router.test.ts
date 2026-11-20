import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { EMode } from '@/contracts/question'
import { createAppRouter, ERouteName, modeParam, roundRoute } from './router'

function router(needsWelcome: boolean) {
  return createAppRouter({ history: createMemoryHistory(), needsWelcome: () => needsWelcome })
}

describe('router', () => {
  it('sends her to the welcome until she has done it', async () => {
    const first = router(true)
    await first.push('/jugar/game')
    expect(first.currentRoute.value.name).toBe(ERouteName.Welcome)
    await first.push('/bienvenida')
    expect(first.currentRoute.value.name).toBe(ERouteName.Welcome)
  })

  it('skips the welcome once it is done', async () => {
    const later = router(false)
    await later.push('/bienvenida')
    expect(later.currentRoute.value.name).toBe(ERouteName.Home)
    await later.push(roundRoute(EMode.Game))
    expect(later.currentRoute.value).toMatchObject({
      name: ERouteName.Round,
      params: { mode: 'game' },
    })
  })

  it('has the Spanish paths and sends unknown ones home', async () => {
    const later = router(false)
    for (const [path, name] of [
      ['/progreso', ERouteName.Progress],
      ['/ajustes', ERouteName.Settings],
      ['/resultado', ERouteName.Result],
      ['/jugar/tele', ERouteName.Home],
      ['/nada', ERouteName.Home],
    ] as const) {
      await later.push(path)
      expect(later.currentRoute.value.name).toBe(name)
    }
  })

  it('reads a mode from the route', () => {
    expect(modeParam('official')).toBe(EMode.Official)
    expect(modeParam('game')).toBe(EMode.Game)
    expect(modeParam('tele')).toBeNull()
  })
})
