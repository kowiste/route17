import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import {
  answerKeyAction,
  handleAnswerKey,
  useAnswerKeys,
  type AnswerKeyOptions,
} from './useAnswerKeys'

function options(overrides: Partial<AnswerKeyOptions> = {}) {
  return {
    optionCount: () => 3,
    selected: () => null,
    enabled: () => true,
    choose: vi.fn<(index: number) => void>(),
    confirm: vi.fn<() => void>(),
    cancel: vi.fn<() => void>(),
    ...overrides,
  }
}

function keydown(key: string, target: Element = document.body, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  Object.defineProperty(event, 'target', { value: target })
  return event
}

describe('answerKeyAction', () => {
  it('maps A/B/C and 1/2/3 to the options, Enter and Esc to confirm and cancel', () => {
    expect(answerKeyAction('a', 3)).toEqual({ kind: 'choose', index: 0 })
    expect(answerKeyAction('B', 3)).toEqual({ kind: 'choose', index: 1 })
    expect(answerKeyAction('3', 3)).toEqual({ kind: 'choose', index: 2 })
    expect(answerKeyAction('Enter', 3)).toEqual({ kind: 'confirm' })
    expect(answerKeyAction('Escape', 3)).toEqual({ kind: 'cancel' })
  })

  it('ignores options a true/false question does not have, and other keys', () => {
    expect(answerKeyAction('c', 2)).toBeNull()
    expect(answerKeyAction('3', 2)).toBeNull()
    expect(answerKeyAction('d', 3)).toBeNull()
    expect(answerKeyAction(' ', 3)).toBeNull()
  })
})

describe('handleAnswerKey', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('chooses with a letter', () => {
    const opts = options()
    const event = keydown('b')
    expect(handleAnswerKey(event, opts)).toBe(true)
    expect(opts.choose).toHaveBeenCalledWith(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('skips options that cannot be chosen', () => {
    const opts = options({ canChoose: (index) => index !== 1 })
    expect(handleAnswerKey(keydown('b'), opts)).toBe(false)
    expect(opts.choose).not.toHaveBeenCalled()
  })

  it('confirms with Enter only when something is picked', () => {
    const none = options()
    expect(handleAnswerKey(keydown('Enter'), none)).toBe(false)
    const picked = options({ selected: () => 2 })
    expect(handleAnswerKey(keydown('Enter'), picked)).toBe(true)
    expect(picked.confirm).toHaveBeenCalledOnce()
  })

  it('cancels with Esc only when something is picked', () => {
    const none = options()
    expect(handleAnswerKey(keydown('Escape'), none)).toBe(false)
    const picked = options({ selected: () => 0 })
    expect(handleAnswerKey(keydown('Escape'), picked)).toBe(true)
    expect(picked.cancel).toHaveBeenCalledOnce()
  })

  it('leaves Enter on another option to that option, and on other buttons to them', () => {
    document.body.innerHTML =
      '<button data-option-index="0">A</button><button data-option-index="1">B</button><button id="other">Otro</button>'
    const opts = options({ selected: () => 1 })
    const [a, b] = document.querySelectorAll('[data-option-index]')
    const other = document.getElementById('other')
    expect(handleAnswerKey(keydown('Enter', a ?? document.body), opts)).toBe(false)
    expect(handleAnswerKey(keydown('Enter', other ?? document.body), opts)).toBe(false)
    expect(opts.confirm).not.toHaveBeenCalled()
    expect(handleAnswerKey(keydown('Enter', b ?? document.body), opts)).toBe(true)
    expect(opts.confirm).toHaveBeenCalledOnce()
  })

  it('does nothing while disabled, typing, in a dialog, with modifiers or on repeat', () => {
    document.body.innerHTML =
      '<input id="name"><dialog open><button id="inside">x</button></dialog>'
    const input = document.getElementById('name') ?? document.body
    const inside = document.getElementById('inside') ?? document.body
    expect(handleAnswerKey(keydown('a'), options({ enabled: () => false }))).toBe(false)
    const opts = options({ selected: () => 0 })
    expect(handleAnswerKey(keydown('a', input), opts)).toBe(false)
    expect(handleAnswerKey(keydown('Escape', inside), opts)).toBe(false)
    expect(handleAnswerKey(keydown('a', document.body, { ctrlKey: true }), opts)).toBe(false)
    expect(handleAnswerKey(keydown('Enter', document.body, { repeat: true }), opts)).toBe(false)
    expect(opts.choose).not.toHaveBeenCalled()
    expect(opts.confirm).not.toHaveBeenCalled()
    expect(opts.cancel).not.toHaveBeenCalled()
  })
})

describe('useAnswerKeys', () => {
  it('listens on the window while the component is mounted', () => {
    const opts = options()
    const Host = defineComponent({
      setup() {
        useAnswerKeys(opts)
        return () => h('div')
      },
    })
    const wrapper = mount(Host)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }))
    expect(opts.choose).toHaveBeenCalledWith(2)
    wrapper.unmount()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(opts.choose).toHaveBeenCalledOnce()
  })
})
