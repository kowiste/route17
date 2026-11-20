import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AnswerOption from './AnswerOption.vue'
import { EAnswerState } from './types'

function option(state: EAnswerState, locked = false) {
  return mount(AnswerOption, { props: { index: 1, text: 'El rey', state, locked } })
}

describe('AnswerOption', () => {
  it('shows its letter and text, and emits choose with its index', async () => {
    const wrapper = option(EAnswerState.Idle)
    const button = wrapper.get('button')
    expect(button.text()).toContain('B')
    expect(button.text()).toContain('El rey')
    expect(button.attributes('data-option-index')).toBe('1')
    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(wrapper.emitted('choose')).toEqual([[1]])
  })

  it('when selected: pressed, highlighted, still choosable', async () => {
    const wrapper = option(EAnswerState.Selected)
    const button = wrapper.get('button')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(wrapper.html()).toContain('bg-selected')
    expect(wrapper.text()).toContain('(elegida)')
    await button.trigger('click')
    expect(wrapper.emitted('choose')).toEqual([[1]])
  })

  it.each([
    [EAnswerState.Correct, 'bg-correct', '(correcta)'],
    [EAnswerState.Wrong, 'bg-wrong', '(incorrecta)'],
    [EAnswerState.Removed, 'line-through', '(descartada por el 50:50)'],
  ])('when %s: shown as such and not choosable', async (state, mark, status) => {
    const wrapper = option(state)
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('data-state')).toBe(state)
    expect(wrapper.html()).toContain(mark)
    expect(wrapper.text()).toContain(status)
    await button.trigger('click')
    expect(wrapper.emitted('choose')).toBeUndefined()
  })

  it('cannot be chosen once locked', async () => {
    const wrapper = option(EAnswerState.Idle, true)
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('choose')).toBeUndefined()
  })
})
