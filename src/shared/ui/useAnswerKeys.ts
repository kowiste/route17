// The keyboard on the laptop while a question is open: A/B/C (or 1/2/3) pick
// an option, Enter confirms the picked one, Esc cancels the pick. The round
// screen calls `useAnswerKeys` once; the component handles the browser bits.

import { onBeforeUnmount, onMounted } from 'vue'

export type AnswerKeyAction =
  | { readonly kind: 'choose'; readonly index: number }
  | { readonly kind: 'confirm' }
  | { readonly kind: 'cancel' }

const LETTERS = ['a', 'b', 'c']
const DIGITS = ['1', '2', '3']

/** What a key means for a question with `optionCount` options; null when nothing. */
export function answerKeyAction(key: string, optionCount: number): AnswerKeyAction | null {
  if (key === 'Enter') return { kind: 'confirm' }
  if (key === 'Escape' || key === 'Esc') return { kind: 'cancel' }
  const lower = key.toLowerCase()
  const letter = LETTERS.indexOf(lower)
  const index = letter >= 0 ? letter : DIGITS.indexOf(lower)
  if (index < 0 || index >= optionCount) return null
  return { kind: 'choose', index }
}

export interface AnswerKeyOptions {
  /** How many options the question has (2 for true/false). */
  optionCount(): number
  /** The picked option, or null. */
  selected(): number | null
  /** False while the keys mean nothing (no question, already confirmed). */
  enabled(): boolean
  /** Whether an option can be picked (not removed by the 50:50). Default: all can. */
  canChoose?(index: number): boolean
  choose(index: number): void
  confirm(): void
  cancel(): void
}

function isTyping(target: Element): boolean {
  if (target instanceof HTMLElement && target.isContentEditable) return true
  return target.closest('input, textarea, select') !== null
}

/** Handles one keydown; exported for the tests. Returns whether it acted. */
export function handleAnswerKey(event: KeyboardEvent, options: AnswerKeyOptions): boolean {
  if (!options.enabled()) return false
  if (event.defaultPrevented || event.repeat) return false
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  const target = event.target instanceof Element ? event.target : null
  // Typing somewhere, or a dialog (the ⓘ) is open on top: not for us.
  if (target !== null && (isTyping(target) || target.closest('dialog') !== null)) return false

  const action = answerKeyAction(event.key, options.optionCount())
  if (action === null) return false

  if (action.kind === 'confirm') {
    const selected = options.selected()
    if (selected === null) return false
    if (target !== null) {
      // Enter on another option's button picks that one (its own click); Enter
      // on any other button presses that button.
      const option = target.closest('[data-option-index]')
      if (option !== null && Number(option.getAttribute('data-option-index')) !== selected) {
        return false
      }
      if (option === null && target.closest('button, a, [role="button"]') !== null) return false
    }
    event.preventDefault()
    options.confirm()
    return true
  }

  if (action.kind === 'cancel') {
    if (options.selected() === null) return false
    event.preventDefault()
    options.cancel()
    return true
  }

  if (options.canChoose !== undefined && !options.canChoose(action.index)) return false
  event.preventDefault()
  options.choose(action.index)
  return true
}

/** Listens to the keyboard while the calling component is mounted. */
export function useAnswerKeys(options: AnswerKeyOptions): void {
  function onKeyDown(event: KeyboardEvent): void {
    handleAnswerKey(event, options)
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
