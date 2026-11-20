<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonSize, ButtonVariant } from './types'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  /** `submit` only inside a form. */
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Takes the full width. */
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const FACE: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-primary text-primary-ink group-hover:brightness-110',
  secondary: 'bg-surface text-ink group-hover:bg-surface-alt',
  accent: 'bg-accent text-accent-ink group-hover:brightness-105',
  sign: 'bg-sign text-sign-ink group-hover:brightness-110',
}

const SIZE: Readonly<Record<ButtonSize, string>> = {
  sm: 'min-h-9 px-3 py-1 text-base',
  md: 'min-h-11 px-4 py-2 text-lg',
  lg: 'min-h-14 px-6 py-3 text-2xl',
}

const faceClass = computed(() => [
  SIZE[props.size],
  props.disabled
    ? 'bg-surface-alt text-muted'
    : `${FACE[props.variant]} pixel-bevel group-active:shadow-none`,
])

function onClick(event: MouseEvent): void {
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="group max-w-full touch-manipulation align-middle select-none disabled:cursor-not-allowed"
    :class="block ? 'flex w-full' : 'inline-flex'"
    @click="onClick"
  >
    <span
      class="flex w-full"
      :class="
        disabled ? '' : 'pixel-shadow group-active:translate-y-(--pixel) group-active:filter-none'
      "
    >
      <span class="pixel-corners flex w-full bg-frame p-(--pixel)">
        <span
          class="pixel-corners-inner flex w-full items-center justify-center gap-2 text-center font-pixel leading-tight"
          :class="faceClass"
        >
          <slot />
        </span>
      </span>
    </span>
  </button>
</template>
