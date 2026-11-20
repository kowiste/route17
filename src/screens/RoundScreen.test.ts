import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { ELifeline } from '@/contracts/lifeline'
import { EMode } from '@/contracts/question'
import { ERouteName } from '@/bootstrap/router'
import {
  mountScreen,
  rightAnswer,
  testDeps,
  wrongAnswer,
  type TestDeps,
} from '@/bootstrap/test/harness'
import { ESound } from '@/shared/sound/sounds'
import { FakeCatalog } from '@/test/fixtures/questions'
import RoundScreen from './RoundScreen.vue'

/** Stands for the map: shows its props, and the test says when she arrives. */
const RouteMapStub = defineComponent({
  name: 'RouteMap',
  props: {
    look: { type: Object, required: true },
    stop: { type: Number, required: true },
    reached: { type: Number, required: true },
    best: { type: Number, required: true },
    state: { type: String, required: true },
  },
  emits: ['arrived'],
  setup(props) {
    return () =>
      h('div', {
        'data-map': '',
        'data-stop': props.stop,
        'data-best': props.best,
        'data-state': props.state,
      })
  },
})

async function mountRound(deps: TestDeps = testDeps(), mode = 'game') {
  const mounted = await mountScreen(RoundScreen, deps, {
    path: `/jugar/${mode}`,
    props: { mode },
    stubs: { RouteMap: RouteMapStub },
  })
  return { ...mounted, deps }
}

function map(wrapper: VueWrapper) {
  return wrapper.get('[data-map]')
}

async function pick(wrapper: VueWrapper, option: number): Promise<void> {
  await wrapper.get(`[data-option-index="${option}"]`).trigger('click')
}

function mainButton(wrapper: VueWrapper): ReturnType<VueWrapper['get']> {
  return wrapper.get('[data-main-action]')
}

async function click(wrapper: VueWrapper, action: string): Promise<void> {
  await wrapper.get(`[data-action="${action}"]`).trigger('click')
  await flushPromises()
}

describe('RoundScreen', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('opens at the first stop with the question, the ladder and the lifelines', async () => {
    const { wrapper } = await mountRound()
    expect(map(wrapper).attributes()).toMatchObject({
      'data-stop': '0',
      'data-state': 'idle',
      'data-best': '-1',
    })
    expect(wrapper.text()).toContain('Parada')
    expect(wrapper.text()).toContain('Canarias')
    expect(wrapper.findAll('[data-option-index]').length).toBeGreaterThanOrEqual(2)
    expect(wrapper.find('[data-lifeline="fiftyFifty"]').exists()).toBe(true)
    expect(wrapper.find('[data-hint]').exists()).toBe(true)
    expect(wrapper.find('[data-points]').text()).toContain('0')
    wrapper.unmount()
  })

  it('confirms with the main button, reveals a right answer, then travels on "Continuar"', async () => {
    const { wrapper, deps } = await mountRound()
    expect(mainButton(wrapper).attributes('data-action')).toBe('confirm')
    expect(mainButton(wrapper).text()).toBe('Confirmar')
    expect(mainButton(wrapper).attributes('disabled')).toBeDefined()
    await pick(wrapper, rightAnswer(deps))
    expect(mainButton(wrapper).attributes('disabled')).toBeUndefined()
    await click(wrapper, 'confirm')
    expect(mainButton(wrapper).text()).toBe('Continuar')
    expect(wrapper.get('[data-verdict]').text()).toContain('¡Correcto!')
    expect(wrapper.find('[data-info-button]').exists()).toBe(true)
    expect(document.activeElement?.getAttribute('data-action')).toBe('continue')
    expect(map(wrapper).attributes('data-stop')).toBe('0')
    expect(deps.recorded.played).toContain(ESound.Correct)

    await click(wrapper, 'continue')
    expect(map(wrapper).attributes()).toMatchObject({
      'data-stop': '1',
      'data-state': 'travelling',
    })
    expect(wrapper.get('[data-travelling]').text()).toContain('Andalucía')
    expect(mainButton(wrapper).attributes('disabled')).toBeDefined()

    wrapper.getComponent(RouteMapStub).vm.$emit('arrived', 1)
    await flushPromises()
    expect(map(wrapper).attributes('data-state')).toBe('idle')
    expect(wrapper.find('[data-verdict]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Andalucía')
    expect(deps.rounds.state()?.rung).toBe(2)
    expect(mainButton(wrapper).text()).toBe('Confirmar')
    expect(mainButton(wrapper).attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('keeps Plantarse on the left and the main button on the right; she can change her pick', async () => {
    const { wrapper, deps } = await mountRound()
    const bar = wrapper.get('[data-action-bar]')
    const buttons = bar.findAll('button')
    expect(buttons.map((button) => button.attributes('data-action'))).toEqual(['stop', 'confirm'])

    await pick(wrapper, wrongAnswer(deps))
    await pick(wrapper, rightAnswer(deps))
    expect(deps.rounds.state()?.selected).toBe(rightAnswer(deps))
    expect(wrapper.get('[data-hint]').text()).toContain('Puedes cambiarla')

    await click(wrapper, 'confirm')
    expect(wrapper.get('[data-verdict]').text()).toContain('¡Correcto!')
    expect(wrapper.get('[data-action="stop"]').attributes('disabled')).toBeDefined()
    const reveal = wrapper.get('[data-reveal]').element
    expect(reveal.lastElementChild?.hasAttribute('data-info-button')).toBe(true)
    wrapper.unmount()
  })

  it('shows the next question even if the map never says she arrived', async () => {
    vi.useFakeTimers()
    const { wrapper, deps } = await mountRound()
    await pick(wrapper, rightAnswer(deps))
    await click(wrapper, 'confirm')
    await click(wrapper, 'continue')
    vi.advanceTimersByTime(4000)
    await flushPromises()
    expect(wrapper.find('[data-travelling]').exists()).toBe(false)
    expect(wrapper.find('[data-hint]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('on a wrong answer shows the right one, makes her sad and leads to the result', async () => {
    const { wrapper, deps, router } = await mountRound()
    const right = rightAnswer(deps)
    await pick(wrapper, wrongAnswer(deps))
    await click(wrapper, 'confirm')
    expect(wrapper.get('[data-verdict]').text()).toContain('Incorrecto')
    expect(wrapper.get(`[data-option-index="${right}"]`).attributes('data-state')).toBe('correct')
    expect(map(wrapper).attributes('data-state')).toBe('lost')
    expect(wrapper.find('[data-action="continue"]').exists()).toBe(false)
    await click(wrapper, 'result')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Result))
    wrapper.unmount()
  })

  it('answers from the keyboard: a letter picks, Enter confirms', async () => {
    const { wrapper, deps } = await mountRound()
    const right = rightAnswer(deps)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: String(right + 1) }))
    await flushPromises()
    expect(deps.rounds.state()?.selected).toBe(right)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await flushPromises()
    expect(wrapper.get('[data-verdict]').text()).toContain('¡Correcto!')
    wrapper.unmount()
  })

  it('shows the audience vote when she asks the público', async () => {
    const { wrapper, deps } = await mountRound()
    await wrapper.get(`[data-lifeline="${ELifeline.Audience}"]`).trigger('click')
    await flushPromises()
    expect(deps.rounds.state()?.lifelines.audience.used).toBe(true)
    expect(document.body.textContent).toContain('Lo que vota el público')
    await wrapper.get('[data-action="back-to-question"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-action="show-audience"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('plants her with a confirm, keeping her points', async () => {
    const { wrapper, deps, router } = await mountRound()
    await click(wrapper, 'stop')
    expect(wrapper.get('[data-stop-text]').text()).toContain('te vas sin nada')
    await click(wrapper, 'confirm-stop')
    expect(deps.rounds.state()?.status).toBe('stopped')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Result))
    wrapper.unmount()
  })

  it('asks before leaving a round in progress', async () => {
    const { wrapper, router } = await mountRound()
    await click(wrapper, 'exit')
    expect(document.body.textContent).toContain('¿Salir de la ronda?')
    await click(wrapper, 'confirm-exit')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Home))
    wrapper.unmount()
  })

  it('explains in Spanish when the round can not start', async () => {
    const deps = testDeps({ catalog: new FakeCatalog([]) })
    const { wrapper } = await mountRound(deps, EMode.Official)
    expect(wrapper.get('[data-error-panel]').text()).toContain('todavía no tiene preguntas')
    expect(wrapper.find('[data-action="retry"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
