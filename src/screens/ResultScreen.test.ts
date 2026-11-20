import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMode } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { ERouteName } from '@/bootstrap/router'
import {
  mountScreen,
  rightAnswer,
  testDeps,
  wrongAnswer,
  type TestDeps,
} from '@/bootstrap/test/harness'
import ResultScreen from './ResultScreen.vue'

async function play(deps: TestDeps, right: number, endWrong: boolean): Promise<void> {
  await deps.rounds.start(EMode.Game)
  for (let i = 0; i < right; i++) {
    deps.rounds.select(rightAnswer(deps))
    await deps.rounds.confirm()
  }
  if (endWrong) {
    deps.rounds.select(wrongAnswer(deps))
    await deps.rounds.confirm()
  }
}

describe('ResultScreen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('says so when no round has ended', async () => {
    const { wrapper } = await mountScreen(ResultScreen, testDeps(), { path: '/resultado' })
    expect(wrapper.find('[data-empty]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Todavía no has terminado ninguna ronda.')
    wrapper.unmount()
  })

  it('after a wrong answer: where she stopped, her points and every answer with its ⓘ', async () => {
    const deps = testDeps()
    await play(deps, 5, true)
    const { wrapper } = await mountScreen(ResultScreen, deps, { path: '/resultado' })
    expect(wrapper.get('[data-headline]').text()).toBe('Fin del viaje')
    expect(wrapper.get('[data-where]').text()).toBe('Te has quedado en Cataluña, parada 6 de 17.')
    expect(wrapper.get('[data-points]').text()).toBe('1.000')
    expect(wrapper.get('[data-right]').text()).toContain('5')
    expect(wrapper.findAll('[data-answer="right"]')).toHaveLength(5)
    expect(wrapper.findAll('[data-answer="wrong"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Tu respuesta:')
    expect(wrapper.find('[data-record]').exists()).toBe(true)

    await wrapper.get('[data-answer="wrong"] [data-info-button]').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('[data-explanation]')?.textContent).toContain(
      'Explicación de ejemplo'
    )
    wrapper.unmount()
  })

  it('celebrates "¡Nacionalidad!" after 17 right answers', async () => {
    const deps = testDeps()
    await play(deps, ROUND_LENGTH, false)
    const { wrapper } = await mountScreen(ResultScreen, deps, { path: '/resultado' })
    expect(wrapper.get('[data-headline]').text()).toBe('¡Nacionalidad!')
    expect(wrapper.get('[data-where]').text()).toContain('¡Has llegado a Madrid!')
    expect(wrapper.get('[data-points]').text()).toBe('100.000')
    expect(wrapper.get('[data-record]').text()).toContain('¡Nuevo récord!')
    wrapper.unmount()
  })

  it('plays again in the same mode, or goes home', async () => {
    const deps = testDeps()
    await play(deps, 0, true)
    const { wrapper, router } = await mountScreen(ResultScreen, deps, { path: '/resultado' })
    expect(wrapper.text()).toContain('Esta vez no te llevas puntos.')
    await wrapper.get('[data-action="again"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Round))
    expect(router.currentRoute.value.params).toEqual({ mode: 'game' })
    await wrapper.get('[data-action="home"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Home))
    wrapper.unmount()
  })
})
