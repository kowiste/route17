<script setup lang="ts">
import AppButton from './AppButton.vue'
import PixelIcon from './PixelIcon.vue'
import { EPixelIcon } from './icons'

// The ⓘ: opens the explanation once she has answered.

interface Props {
  disabled?: boolean
  label?: string
  /** Blinks the icon to draw the eye (right after answering). */
  attention?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: 'Explicación',
  attention: false,
})

const emit = defineEmits<{
  open: []
}>()

function onOpen(): void {
  if (!props.disabled) emit('open')
}
</script>

<template>
  <AppButton variant="sign" size="sm" :disabled="disabled" data-info-button @click="onOpen">
    <PixelIcon
      :name="EPixelIcon.Info"
      class="text-xl"
      :class="attention && !disabled ? 'motion-safe:animate-blink' : ''"
    />
    <span>{{ label }}</span>
  </AppButton>
</template>
