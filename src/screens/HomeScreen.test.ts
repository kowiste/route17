import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMode } from '@/contracts/question'
import { ERouteName } from '@/bootstrap/router'
import { mountScreen, testDeps } from '@/bootstrap/test/harness'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import { FakeCatalog, sampleQuestions } from '@/test/fixtures/questions'
import HomeScreen from './HomeScreen.vue'

describe('HomeScreen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('greets her and shows both modes with her progress and record', async () => {
    const deps = testDeps()
    await deps.records.save('game', 5)
    const { wrapper } = await mountScreen(HomeScreen, deps)
    expect(wrapper.get('[data-greeting]').text()).toBe('¡Hola, Lucía!')
    expect(wrapper.find('canvas[aria-label="Tu personaje"]').exists()).toBe(true)
    const official = wrapper.get(`[data-mode="${EMode.Official}"]`)
    const game = wrapper.get(`[data-mode="${EMode.Game}"]`)
    expect(official.text()).toContain('Modo oficial')
    expect(official.text()).toContain('Manual CCSE 2026')
    expect(game.text()).toContain('0 de 20 dominadas')
    expect(game.text()).toContain('Récord: parada 5 de 17')
    wrapper.unmount()
  })

  it('starts a round of the mode she picks', async () => {
    const { wrapper, router } = await mountScreen(HomeScreen, testDeps())
    await wrapper.get(`[data-mode="${EMode.Game}"] button`).trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Round))
    expect(router.currentRoute.value.params).toEqual({ mode: 'game' })
    wrapper.unmount()
  })

  it('shows the official mode as "Pendiente" until its questions exist', async () => {
    const { wrapper, router } = await mountScreen(HomeScreen, testDeps({ official: false }))
    const official = wrapper.get(`[data-mode="${EMode.Official}"]`)
    expect(official.text()).toContain('Pendiente')
    expect(official.get('button').attributes('disabled')).toBeDefined()
    await official.get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(ERouteName.Home)
    wrapper.unmount()
  })

  it('opens Progreso and Ajustes', async () => {
    const { wrapper, router } = await mountScreen(HomeScreen, testDeps())
    await wrapper.get('[data-action="progress"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Progress))
    await wrapper.get('[data-action="settings"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Settings))
    wrapper.unmount()
  })

  it('explains in Spanish when the questions can not be read, and tries again', async () => {
    const catalog = new FakeCatalog([
      { setID: 'game', mode: EMode.Game, questions: sampleQuestions('g') },
    ])
    const working = catalog.newestSet.bind(catalog)
    catalog.newestSet = async () => {
      throw new AppError(EErrorCode.CorruptData, 'question file broken')
    }
    const { wrapper } = await mountScreen(HomeScreen, testDeps({ catalog }))
    expect(wrapper.get('[data-error-panel]').text()).toContain('no se pueden leer')
    expect(wrapper.text()).not.toContain('question file broken')
    catalog.newestSet = working
    await wrapper.get('[data-action="retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-error-panel]').exists()).toBe(false)
    expect(wrapper.find(`[data-mode="${EMode.Game}"]`).exists()).toBe(true)
    wrapper.unmount()
  })
})
