import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR_LOOK } from '@/contracts/avatar'
import { LEG_DURATION_MS } from '../domain/timeline'
import RouteMap from './RouteMap.vue'

type Props = InstanceType<typeof RouteMap>['$props']

const start: Props = { look: DEFAULT_AVATAR_LOOK, stop: 0, reached: 0, best: -1, state: 'idle' }

function reduceMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

function mountMap(props: Partial<Props> = {}) {
  return mount(RouteMap, { props: { ...start, ...props } })
}

function label(wrapper: ReturnType<typeof mountMap>): string | undefined {
  return wrapper.find('svg').attributes('aria-label')
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('RouteMap', () => {
  it('draws every comunidad, Ceuta and Melilla, and says where she is', () => {
    reduceMotion(false)
    const wrapper = mountMap({ stop: 1, reached: 1 })
    expect(wrapper.findAll('[data-region]')).toHaveLength(19)
    expect(wrapper.find('svg').attributes('role')).toBe('img')
    expect(label(wrapper)).toBe('Estás en Andalucía, parada 2 de 17')
    expect(wrapper.emitted('arrived')).toBeUndefined()
    wrapper.unmount()
  })

  it('travels a leg when the stop goes up by one, then says she arrived', async () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
    reduceMotion(false)
    const wrapper = mountMap()
    await wrapper.setProps({ stop: 1, state: 'travelling' })
    expect(label(wrapper)).toBe('Viajando a Andalucía, parada 2 de 17')
    vi.advanceTimersByTime(LEG_DURATION_MS / 2)
    expect(wrapper.emitted('arrived')).toBeUndefined()
    vi.advanceTimersByTime(LEG_DURATION_MS)
    expect(wrapper.emitted('arrived')).toEqual([[1]])
    await wrapper.setProps({ state: 'idle' })
    expect(label(wrapper)).toBe('Estás en Andalucía, parada 2 de 17')
    wrapper.unmount()
  })

  it('moves her at once with reduced motion', async () => {
    reduceMotion(true)
    const wrapper = mountMap()
    await wrapper.setProps({ stop: 1 })
    expect(wrapper.emitted('arrived')).toEqual([[1]])
    expect(label(wrapper)).toBe('Estás en Andalucía, parada 2 de 17')
    wrapper.unmount()
  })

  it('puts her straight at any stop that is not the next one (a new round, a jump)', async () => {
    reduceMotion(false)
    const wrapper = mountMap({ stop: 6, reached: 6 })
    await wrapper.setProps({ stop: 0, reached: 0 })
    await wrapper.setProps({ stop: 9 })
    expect(wrapper.emitted('arrived')).toEqual([[0], [9]])
    expect(label(wrapper)).toBe('Estás en País Vasco, parada 10 de 17')
    wrapper.unmount()
  })

  it('marks her best stop only once she has one', async () => {
    reduceMotion(true)
    const wrapper = mountMap()
    expect(wrapper.find('[data-testid="record"]').exists()).toBe(false)
    await wrapper.setProps({ best: 4 })
    expect(wrapper.find('[data-testid="record"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('sets off fireworks when she wins in Madrid, and looks sad when she loses', async () => {
    reduceMotion(true)
    const wrapper = mountMap({ stop: 16, reached: 16, state: 'won' })
    expect(wrapper.findAll('[data-testid="firework"]').length).toBeGreaterThan(0)
    expect(label(wrapper)).toBe('¡Has llegado a Madrid! Fin de la ruta, parada 17 de 17')
    await wrapper.setProps({ stop: 7, reached: 7, state: 'lost' })
    expect(wrapper.findAll('[data-testid="firework"]')).toHaveLength(0)
    expect(label(wrapper)).toBe('Te has quedado en Navarra, parada 8 de 17')
    wrapper.unmount()
  })
})
