import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PixelPanel from './PixelPanel.vue'

describe('PixelPanel', () => {
  it('frames its content, with a title when given', () => {
    const wrapper = mount(PixelPanel, {
      props: { title: 'Ajustes' },
      slots: { default: '<p>Dentro</p>' },
    })
    expect(wrapper.get('h2').text()).toBe('Ajustes')
    expect(wrapper.get('.pixel-corners').classes()).toContain('bg-frame')
    expect(wrapper.get('.pixel-corners-inner p').text()).toBe('Dentro')
    expect(wrapper.classes()).toContain('pixel-shadow')
  })

  it('has no heading without a title, and no shadow when asked', () => {
    const wrapper = mount(PixelPanel, { props: { shadow: false } })
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('pixel-shadow')
  })

  it('renders the tag and tone it is given', () => {
    const wrapper = mount(PixelPanel, { props: { tag: 'section', tone: 'lcd' } })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.get('.pixel-corners-inner').classes()).toContain('bg-lcd')
  })
})
