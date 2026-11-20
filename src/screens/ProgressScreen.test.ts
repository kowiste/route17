import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { EMode } from '@/contracts/question'
import { mountScreen, testDeps, type TestDeps } from '@/bootstrap/test/harness'
import ProgressScreen from './ProgressScreen.vue'

async function playOneRound(deps: TestDeps): Promise<void> {
  const ids = await deps.deck.deal('game', 17)
  await deps.deck.finish('game', {
    answered: ids.slice(0, 4).map((questionID, i) => ({ questionID, correct: i < 3 })),
    unreached: ids.slice(4),
  })
}

describe('ProgressScreen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows each mode overall and per tarea, with rounds played and the cycle', async () => {
    const deps = testDeps()
    await playOneRound(deps)
    const { wrapper } = await mountScreen(ProgressScreen, deps, { path: '/progreso' })
    const game = wrapper.get(`[data-mode="${EMode.Game}"]`)
    expect(game.get('[data-overall]').text()).toBe('3 de 20 dominadas · 4 vistas')
    expect(game.get('[data-rounds]').text()).toBe('1')
    expect(game.get('[data-cycle]').text()).toBe('1')
    expect(game.findAll('[data-topic]')).toHaveLength(5)
    expect(wrapper.get(`[data-mode="${EMode.Official}"]`).text()).toContain('Manual CCSE 2026')
    wrapper.unmount()
  })

  it('starts a mode over after she confirms', async () => {
    const deps = testDeps()
    await playOneRound(deps)
    const { wrapper } = await mountScreen(ProgressScreen, deps, { path: '/progreso' })
    function game() {
      return wrapper.get(`[data-mode="${EMode.Game}"]`)
    }
    await game().get('[data-action="reset"]').trigger('click')
    expect(document.body.textContent).toContain('¿Empezar de cero?')
    await wrapper.get('[data-action="cancel-reset"]').trigger('click')
    expect(game().get('[data-rounds]').text()).toBe('1')

    await game().get('[data-action="reset"]').trigger('click')
    await wrapper.get('[data-action="confirm-reset"]').trigger('click')
    await flushPromises()
    expect(game().get('[data-overall]').text()).toBe('0 de 20 dominadas · 0 vistas')
    expect(game().get('[data-rounds]').text()).toBe('0')
    wrapper.unmount()
  })

  it('shows the official mode as pending without its questions', async () => {
    const { wrapper } = await mountScreen(ProgressScreen, testDeps({ official: false }), {
      path: '/progreso',
    })
    const official = wrapper.get(`[data-mode="${EMode.Official}"]`)
    expect(official.find('[data-pending]').exists()).toBe(true)
    expect(official.find('[data-action="reset"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
