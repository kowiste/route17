import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppButton from './AppButton.vue'
import type { ButtonVariant } from './types'

describe('AppButton', () => {
  it('is a plain button with its label, and emits click', async () => {
    const wrapper = mount(AppButton, { slots: { default: 'Jugar' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Jugar')
    await button.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('can be a submit button', () => {
    const wrapper = mount(AppButton, { props: { type: 'submit' }, slots: { default: 'Guardar' } })
    expect(wrapper.get('button').attributes('type')).toBe('submit')
  })

  it('does nothing while disabled', async () => {
    const wrapper = mount(AppButton, { props: { disabled: true }, slots: { default: 'Jugar' } })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('paints each variant with its tokens', () => {
    function face(variant: ButtonVariant): string[] {
      return mount(AppButton, { props: { variant } }).get('.pixel-corners-inner').classes()
    }
    expect(face('primary')).toContain('bg-primary')
    expect(face('secondary')).toContain('bg-surface')
    expect(face('accent')).toContain('bg-accent')
    expect(face('sign')).toContain('bg-sign')
  })

  it('takes the full width when block', () => {
    const wrapper = mount(AppButton, { props: { block: true } })
    expect(wrapper.get('button').classes()).toContain('w-full')
  })
})
