import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ROUTE, SAFE_RUNGS } from '@/contracts/route'
import PrizeLadder from './PrizeLadder.vue'
import { ELadderStatus, ERungState, type LadderRung } from './types'

const POINTS = [
  100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000,
  100000,
]

const RUNGS: LadderRung[] = ROUTE.map((comunidad, i) => ({
  comunidad,
  points: POINTS[i] ?? 0,
  safe: SAFE_RUNGS.includes(i + 1),
}))

function ladder(props: Partial<InstanceType<typeof PrizeLadder>['$props']> = {}) {
  return mount(PrizeLadder, { props: { rungs: RUNGS, current: 6, ...props } })
}

function states(wrapper: ReturnType<typeof ladder>, layout: 'full' | 'strip'): string[] {
  return wrapper
    .get(`[data-layout="${layout}"]`)
    .findAll('[data-state]')
    .map((el) => el.attributes('data-state') ?? '')
}

describe('PrizeLadder', () => {
  it('lists the 17 rungs top first, with the current one marked', () => {
    const wrapper = ladder({ layout: 'full', points: 1000, safePoints: 1000 })
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(17)
    expect(items[0]?.text()).toContain('Madrid')
    expect(items[0]?.text()).toContain('100.000')
    expect(items[16]?.text()).toContain('Canarias')
    const current = wrapper.get('[aria-current="step"]')
    expect(current.text()).toContain('Cataluña')
    expect(current.text()).toContain('1.500')
    expect(wrapper.text()).toContain('Puntos: 1.000')
    expect(wrapper.text()).toContain('Asegurado: 1.000')
    expect(wrapper.find('[data-layout="strip"]').exists()).toBe(false)
  })

  it('marks the safe rungs and the finish', () => {
    const wrapper = ladder({ layout: 'full' })
    expect(wrapper.findAll('[aria-label="Parada segura"]')).toHaveLength(SAFE_RUNGS.length)
    expect(wrapper.findAll('[aria-label="¡Nacionalidad!"]')).toHaveLength(1)
  })

  it('shows a strip with a caption on the phone', () => {
    const wrapper = ladder({ layout: 'strip', safePoints: 1000 })
    const strip = wrapper.get('[data-layout="strip"]')
    expect(strip.get('[role="img"]').attributes('aria-label')).toBe(
      'Parada 6 de 17, Cataluña, 1.500 puntos'
    )
    expect(strip.text()).toContain('6/17 · Cataluña · 1.500')
    expect(strip.text()).toContain('Asegurado: 1.000')
    expect(states(wrapper, 'strip').slice(4, 7)).toEqual([
      ERungState.Done,
      ERungState.Current,
      ERungState.Ahead,
    ])
    expect(wrapper.find('[data-layout="full"]').exists()).toBe(false)
  })

  it('renders both in auto, each for its screen size', () => {
    const wrapper = ladder()
    expect(wrapper.get('[data-layout="strip"]').classes()).toContain('md:hidden')
    expect(wrapper.get('[data-layout="full"]').classes()).toEqual(['hidden', 'md:block'])
  })

  it('marks where she failed when lost', () => {
    const wrapper = ladder({ layout: 'strip', current: 8, status: ELadderStatus.Lost })
    expect(states(wrapper, 'strip')[7]).toBe(ERungState.Failed)
    expect(states(wrapper, 'strip')[6]).toBe(ERungState.Done)
  })

  it('lights up the finish when won', () => {
    const wrapper = ladder({ layout: 'full', current: 17, status: ELadderStatus.Won })
    expect(states(wrapper, 'full').every((s) => s === ERungState.Done)).toBe(true)
    expect(wrapper.findAll('li')[0]?.classes()).toContain('bg-correct')
  })
})
