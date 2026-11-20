import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InfoButton from './InfoButton.vue'

describe('InfoButton', () => {
  it('emits open', async () => {
    const wrapper = mount(InfoButton)
    expect(wrapper.text()).toBe('Explicación')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  it('blinks its icon when asking for attention', () => {
    const wrapper = mount(InfoButton, { props: { attention: true } })
    expect(wrapper.get('svg').classes()).toContain('motion-safe:animate-blink')
  })

  it('does nothing while disabled', async () => {
    const wrapper = mount(InfoButton, { props: { disabled: true, attention: true } })
    expect(wrapper.get('svg').classes()).not.toContain('motion-safe:animate-blink')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('open')).toBeUndefined()
  })
})
