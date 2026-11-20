import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConfirmBar from './ConfirmBar.vue'

describe('ConfirmBar', () => {
  it('asks and emits confirm or cancel', async () => {
    const wrapper = mount(ConfirmBar)
    expect(wrapper.text()).toContain('¿Confirmas tu respuesta?')
    expect(wrapper.attributes('role')).toBe('group')
    await wrapper.get('[data-action="confirm"]').trigger('click')
    await wrapper.get('[data-action="cancel"]').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('shows the key hints unless asked not to', () => {
    expect(
      mount(ConfirmBar)
        .findAll('kbd')
        .map((k) => k.text())
    ).toEqual(['Esc', 'Intro'])
    expect(mount(ConfirmBar, { props: { keyHints: false } }).findAll('kbd')).toHaveLength(0)
  })

  it('takes its own words', () => {
    const wrapper = mount(ConfirmBar, {
      props: { prompt: '¿Seguro?', confirmLabel: 'Sí', cancelLabel: 'No' },
    })
    expect(wrapper.text()).toContain('¿Seguro?')
    expect(wrapper.get('[data-action="confirm"]').text()).toContain('Sí')
    expect(wrapper.get('[data-action="cancel"]').text()).toContain('No')
  })

  it('emits nothing while disabled', async () => {
    const wrapper = mount(ConfirmBar, { props: { disabled: true } })
    await wrapper.get('[data-action="confirm"]').trigger('click')
    await wrapper.get('[data-action="cancel"]').trigger('click')
    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})
