import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import AppModal from './AppModal.vue'

function mountModal(open: boolean) {
  return mount(AppModal, {
    props: { open, title: 'Un título' },
    slots: { default: '<p>Contenido</p>', footer: '<button>Vale</button>' },
    attachTo: document.body,
  })
}

describe('AppModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens as a modal dialog with its title, content and footer', () => {
    const wrapper = mountModal(true)
    const dialog = wrapper.get('dialog')
    expect(dialog.element.open).toBe(true)
    expect(wrapper.get('h2').text()).toBe('Un título')
    expect(dialog.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
    expect(wrapper.text()).toContain('Contenido')
    expect(wrapper.text()).toContain('Vale')
    wrapper.unmount()
  })

  it('stays closed while open is false, and follows the prop', async () => {
    const wrapper = mountModal(false)
    expect(wrapper.get('dialog').element.open).toBe(false)
    await wrapper.setProps({ open: true })
    expect(wrapper.get('dialog').element.open).toBe(true)
    await wrapper.setProps({ open: false })
    expect(wrapper.get('dialog').element.open).toBe(false)
    wrapper.unmount()
  })

  it('emits close from the close button', async () => {
    const wrapper = mountModal(true)
    await wrapper.get('[data-modal-close]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.get('[data-modal-close]').text()).toBe('Cerrar')
    wrapper.unmount()
  })

  it('emits close on Esc (the cancel event) and keeps the dialog for the parent to close', async () => {
    const wrapper = mountModal(true)
    const cancel = new Event('cancel', { cancelable: true })
    wrapper.get('dialog').element.dispatchEvent(cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits close on a click on the backdrop, not on the box', async () => {
    const wrapper = mountModal(true)
    await wrapper.get('p').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
    await wrapper.get('dialog').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('tells the parent when the browser closes it on its own', async () => {
    const wrapper = mountModal(true)
    wrapper.get('dialog').element.dispatchEvent(new Event('close'))
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
