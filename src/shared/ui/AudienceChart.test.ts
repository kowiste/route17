import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AudienceChart from './AudienceChart.vue'

describe('AudienceChart', () => {
  it('draws one bar per option with its percentage', () => {
    const wrapper = mount(AudienceChart, { props: { percentages: [62, 25, 13] } })
    const bars = wrapper.findAll('[data-bar]')
    expect(bars.map((b) => b.attributes('data-bar'))).toEqual(['A', 'B', 'C'])
    expect(bars[0]?.text()).toBe('62 %')
    expect(bars[0]?.get('[style]').attributes('style')).toContain('calc(var(--pixel) * 19)')
    expect(bars[2]?.get('[style]').attributes('style')).toContain('calc(var(--pixel) * 4)')
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe(
      'Lo que vota el público: A, 62 %; B, 25 %; C, 13 %'
    )
  })

  it('shows a dash and no bar for an option removed by the 50:50', () => {
    const wrapper = mount(AudienceChart, {
      props: { percentages: [70, 0, 30], removed: [1], caption: 'El público' },
    })
    const removed = wrapper.get('[data-bar="B"]')
    expect(removed.text()).toBe('—')
    expect(removed.find('[style]').exists()).toBe(false)
    expect(wrapper.get('figcaption').text()).toBe('El público')
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toContain('B, descartada')
  })
})
