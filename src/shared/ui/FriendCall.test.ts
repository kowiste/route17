import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FriendCall from './FriendCall.vue'

describe('FriendCall', () => {
  it('rings while calling, without the answer yet', () => {
    const wrapper = mount(FriendCall, {
      props: { calling: true, friendName: 'Lola', message: 'Creo que es la B' },
    })
    expect(wrapper.text()).toContain('Llamando a Lola…')
    expect(wrapper.text()).not.toContain('Creo que es la B')
    expect(wrapper.find('[data-friend-option]').exists()).toBe(false)
  })

  it('then shows what the friend says, the option and how sure', () => {
    const wrapper = mount(FriendCall, {
      props: {
        message: 'Creo que es la B',
        optionIndex: 1,
        optionText: 'El rey',
        confidence: 80,
      },
    })
    expect(wrapper.text()).toContain('Tu amigo dice:')
    expect(wrapper.text()).toContain('«Creo que es la B»')
    expect(wrapper.get('[data-friend-option]').text().replace(/\s+/g, ' ')).toBe(
      'Su respuesta: B · El rey'
    )
    expect(wrapper.get('[aria-label^="Seguridad"]').attributes('aria-label')).toBe(
      'Seguridad: 80 %'
    )
    const bars = wrapper.findAll('[aria-label^="Seguridad"] > span')
    expect(bars.filter((b) => b.classes().includes('bg-lcd-ink'))).toHaveLength(4)
  })

  it('emits hangUp from Colgar', async () => {
    const wrapper = mount(FriendCall, { props: { calling: true } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').text()).toBe('Colgar')
    expect(wrapper.emitted('hangUp')).toHaveLength(1)
  })
})
