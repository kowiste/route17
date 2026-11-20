<script setup lang="ts">
import { computed } from 'vue'
import PixelIcon from './PixelIcon.vue'
import { optionLetter } from './format'
import { EPixelIcon } from './icons'
import { EAnswerState } from './types'

// One answer: its letter (A, B, C: also the key that picks it), the text, and
// how it looks. Emits `choose` with its index while it can still be picked.

interface Props {
  /** 0-based; gives the letter and the `data-option-index` the keyboard uses. */
  index: number
  text: string
  state?: EAnswerState
  /** After the confirm: nothing can be picked any more. */
  locked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  state: EAnswerState.Idle,
  locked: false,
})

const emit = defineEmits<{
  choose: [index: number]
}>()

const FACE: Readonly<Record<EAnswerState, string>> = {
  [EAnswerState.Idle]: 'bg-surface text-ink',
  [EAnswerState.Selected]: 'bg-selected text-selected-ink',
  [EAnswerState.Correct]: 'bg-correct text-correct-ink',
  [EAnswerState.Wrong]: 'bg-wrong text-wrong-ink',
  [EAnswerState.Removed]: 'bg-surface-alt text-muted',
}

const BADGE: Readonly<Record<EAnswerState, string>> = {
  [EAnswerState.Idle]: 'bg-sign text-sign-ink',
  [EAnswerState.Selected]: 'bg-selected-ink text-selected',
  [EAnswerState.Correct]: 'bg-correct-ink text-correct',
  [EAnswerState.Wrong]: 'bg-wrong-ink text-wrong',
  [EAnswerState.Removed]: 'bg-line text-muted',
}

const STATUS: Readonly<Record<EAnswerState, string>> = {
  [EAnswerState.Idle]: '',
  [EAnswerState.Selected]: '(elegida)',
  [EAnswerState.Correct]: '(correcta)',
  [EAnswerState.Wrong]: '(incorrecta)',
  [EAnswerState.Removed]: '(descartada por el 50:50)',
}

const letter = computed(() => optionLetter(props.index))
const interactive = computed(
  () =>
    !props.locked && (props.state === EAnswerState.Idle || props.state === EAnswerState.Selected)
)
const removed = computed(() => props.state === EAnswerState.Removed)
const faceClass = computed(() => {
  if (props.locked && props.state === EAnswerState.Idle) return 'bg-surface text-muted'
  return interactive.value && props.state === EAnswerState.Idle
    ? `${FACE[props.state]} group-hover:bg-surface-alt`
    : FACE[props.state]
})

function onClick(): void {
  if (interactive.value) emit('choose', props.index)
}
</script>

<template>
  <button
    type="button"
    class="group block w-full touch-manipulation text-left disabled:cursor-default"
    :disabled="!interactive"
    :aria-pressed="state === EAnswerState.Selected"
    :data-option-index="index"
    :data-state="state"
    @click="onClick"
  >
    <span
      class="flex w-full"
      :class="[
        removed ? '' : 'pixel-shadow',
        interactive ? 'group-active:translate-y-(--pixel) group-active:filter-none' : '',
      ]"
    >
      <span class="pixel-corners flex w-full bg-frame p-(--pixel)">
        <span
          class="pixel-corners-inner flex min-h-12 w-full items-center gap-2 py-2 pr-3 pl-1 md:gap-3 md:py-3"
          :class="faceClass"
        >
          <PixelIcon
            :name="EPixelIcon.Cursor"
            class="text-base"
            :class="state === EAnswerState.Selected ? 'motion-safe:animate-blink' : 'invisible'"
          />
          <span
            class="pixel-corners-inner hud-number grid size-8 shrink-0 place-items-center text-lg md:size-9 md:text-xl"
            :class="BADGE[state]"
            >{{ letter }}</span
          >
          <span
            class="min-w-0 flex-1 text-base leading-snug md:text-lg"
            :class="removed ? 'line-through' : ''"
            >{{ text }}</span
          >
          <PixelIcon
            v-if="state === EAnswerState.Correct"
            :name="EPixelIcon.Check"
            class="text-xl"
          />
          <PixelIcon
            v-else-if="state === EAnswerState.Wrong"
            :name="EPixelIcon.Cross"
            class="text-xl"
          />
          <span v-if="STATUS[state]" class="sr-only">{{ STATUS[state] }}</span>
        </span>
      </span>
    </span>
  </button>
</template>
