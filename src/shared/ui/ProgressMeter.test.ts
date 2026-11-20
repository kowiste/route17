import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProgressMeter from './ProgressMeter.vue'

describe('ProgressMeter', () => {
  it('is a progress bar with its value and label', () => {
    const wrapper = mount(ProgressMeter, {
      props: { value: 25, secondary: 50, max: 100, label: '25 dominadas y 50 vistas' },
    })
    const bar = wrapper.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('25')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(bar.attributes('aria-valuetext')).toBe('25 dominadas y 50 vistas')
    expect(wrapper.get('[data-part="main"]').attributes('style')).toContain('width: 25%')
    expect(wrapper.get('[data-part="secondary"]').attributes('style')).toContain('width: 50%')
  })

  it('stays inside 0-100 % and survives an empty set', () => {
    const over = mount(ProgressMeter, { props: { value: 150, max: 100, label: '' } })
    expect(over.get('[data-part="main"]').attributes('style')).toContain('width: 100%')
    expect(over.find('[data-part="secondary"]').exists()).toBe(false)
    const empty = mount(ProgressMeter, { props: { value: 0, max: 0, label: '' } })
    expect(empty.get('[data-part="main"]').attributes('style')).toContain('width: 0%')
  })
})
