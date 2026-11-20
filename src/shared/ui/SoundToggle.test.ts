import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SoundToggle from './SoundToggle.vue'

describe('SoundToggle', () => {
  it('shows the sound on and asks to mute it', async () => {
    const wrapper = mount(SoundToggle, { props: { muted: false } })
    expect(wrapper.text()).toBe('Sonido: sí')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:muted')).toEqual([[true]])
  })

  it('shows the sound off and asks to unmute it', async () => {
    const wrapper = mount(SoundToggle, { props: { muted: true } })
    expect(wrapper.text()).toBe('Sonido: no')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:muted')).toEqual([[false]])
  })
})
