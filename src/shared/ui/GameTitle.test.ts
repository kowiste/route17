import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GameTitle from './GameTitle.vue'
import { SIGN_DIGITS, SIGN_NUMBER_HEIGHT, SIGN_NUMBER_WIDTH, SIGN_RUNS } from './signNumber'

describe('GameTitle', () => {
  it('reads as "Route 17" for screen readers', () => {
    const wrapper = mount(GameTitle)
    const logo = wrapper.get('[role="img"]')
    expect(logo.attributes('aria-label')).toBe('Route 17')
    expect(logo.text()).toMatch(/^ROUTE$/)
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('draws the 17 as pixel digits on the sign', () => {
    const wrapper = mount(GameTitle)
    const svg = wrapper.get('[data-sign-number]')
    expect(svg.attributes('viewBox')).toBe(`0 0 ${SIGN_NUMBER_WIDTH} ${SIGN_NUMBER_HEIGHT}`)
    expect(svg.findAll('rect')).toHaveLength(SIGN_RUNS.length)
  })

  it('has well-formed digits that stay inside the sign', () => {
    for (const rows of Object.values(SIGN_DIGITS)) {
      expect(rows).toHaveLength(SIGN_NUMBER_HEIGHT)
      for (const row of rows) expect(row).toMatch(/^[.#]{6}$/)
    }
    for (const run of SIGN_RUNS) {
      expect(run.x).toBeGreaterThanOrEqual(0)
      expect(run.x + run.width).toBeLessThanOrEqual(SIGN_NUMBER_WIDTH)
      expect(run.y).toBeLessThan(SIGN_NUMBER_HEIGHT)
    }
  })

  it('shows the tagline when given', () => {
    const wrapper = mount(GameTitle, { props: { tagline: 'Prepara el CCSE', size: 'md' } })
    expect(wrapper.get('p').text()).toBe('Prepara el CCSE')
  })
})
