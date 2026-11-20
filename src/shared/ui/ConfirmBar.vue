<script setup lang="ts">
import AppButton from './AppButton.vue'
import PixelPanel from './PixelPanel.vue'

// The second step of answering: confirm the picked option or change it.
// On the laptop it shows the keys (Intro, Esc); useAnswerKeys handles them.

interface Props {
  prompt?: string
  confirmLabel?: string
  cancelLabel?: string
  disabled?: boolean
  /** Show the Intro / Esc hints (laptop widths only). */
  keyHints?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  prompt: '¿Confirmas tu respuesta?',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cambiar',
  disabled: false,
  keyHints: true,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onConfirm(): void {
  if (!props.disabled) emit('confirm')
}

function onCancel(): void {
  if (!props.disabled) emit('cancel')
}
</script>

<template>
  <PixelPanel tone="accent" padding="sm" role="group" :aria-label="prompt">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="text-center font-pixel text-lg leading-tight md:text-left md:text-xl">
        {{ prompt }}
      </p>
      <div class="grid grid-cols-2 gap-3 md:flex md:shrink-0">
        <AppButton variant="secondary" :disabled="disabled" data-action="cancel" @click="onCancel">
          {{ cancelLabel }}
          <kbd v-if="keyHints" class="hidden px-1 font-pixel text-sm opacity-70 md:inline">Esc</kbd>
        </AppButton>
        <AppButton variant="primary" :disabled="disabled" data-action="confirm" @click="onConfirm">
          {{ confirmLabel }}
          <kbd v-if="keyHints" class="hidden px-1 font-pixel text-sm opacity-80 md:inline"
            >Intro</kbd
          >
        </AppButton>
      </div>
    </div>
  </PixelPanel>
</template>
