import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LifelineBar from './LifelineBar.vue'
import { ELifeline } from './types'

function button(wrapper: ReturnType<typeof mount>, lifeline: ELifeline) {
  return wrapper.get(`[data-lifeline="${lifeline}"]`)
}

describe('LifelineBar', () => {
  it('shows the three lifelines and emits use with the one pressed', async () => {
    const wrapper = mount(LifelineBar)
    expect(wrapper.findAll('button')).toHaveLength(3)
    expect(wrapper.text()).toContain('50:50')
    expect(wrapper.text()).toContain('Público')
    expect(wrapper.text()).toContain('Amigo')
    await button(wrapper, ELifeline.Audience).trigger('click')
    await button(wrapper, ELifeline.FiftyFifty).trigger('click')
    expect(wrapper.emitted('use')).toEqual([[ELifeline.Audience], [ELifeline.FiftyFifty]])
  })

  it('crosses out a used lifeline and greys out an unavailable one', async () => {
    const wrapper = mount(LifelineBar, {
      props: { used: [ELifeline.Friend], unavailable: [ELifeline.FiftyFifty] },
    })
    const friend = button(wrapper, ELifeline.Friend)
    const fifty = button(wrapper, ELifeline.FiftyFifty)
    expect(friend.attributes('disabled')).toBeDefined()
    expect(friend.attributes('aria-label')).toBe('Comodín: llamar a un amigo (usado)')
    expect(friend.html()).toContain('line-through')
    expect(fifty.attributes('disabled')).toBeDefined()
    expect(fifty.attributes('aria-label')).toBe('Comodín del 50:50 (no disponible)')
    await friend.trigger('click')
    await fifty.trigger('click')
    expect(wrapper.emitted('use')).toBeUndefined()
    expect(button(wrapper, ELifeline.Audience).attributes('disabled')).toBeUndefined()
  })

  it('emits nothing while the whole bar is disabled', async () => {
    const wrapper = mount(LifelineBar, { props: { disabled: true } })
    for (const b of wrapper.findAll('button')) {
      expect(b.attributes('disabled')).toBeDefined()
      await b.trigger('click')
    }
    expect(wrapper.emitted('use')).toBeUndefined()
  })
})
