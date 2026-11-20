<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import AppButton from './AppButton.vue'
import PixelIcon from './PixelIcon.vue'
import PixelPanel from './PixelPanel.vue'
import { EPixelIcon } from './icons'

// A native <dialog> opened with showModal(): it sits above everything (even
// boxes with a shadow filter), keeps the focus inside and closes with Esc.
// The parent owns `open`; every way of closing emits `close`.

interface Props {
  open: boolean
  title: string
  /** `sheet`: at the bottom of a phone screen, centred from the tablet up. */
  placement?: 'center' | 'sheet'
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'center',
  closeLabel: 'Cerrar',
})

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const titleID = useId()

const PLACEMENT = {
  center: 'm-auto w-[calc(100%-1.5rem)] max-w-lg pb-(--pixel)',
  sheet:
    'mx-auto mt-auto mb-0 w-full max-w-none pb-[max(var(--pixel),env(safe-area-inset-bottom))] md:m-auto md:w-[calc(100%-1.5rem)] md:max-w-lg md:pb-(--pixel)',
} as const

function sync(): void {
  const element = dialog.value
  if (element === null) return
  if (props.open && !element.open) {
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
  } else if (!props.open && element.open) {
    element.close()
  }
}

function requestClose(): void {
  emit('close')
}

function onCancel(event: Event): void {
  // Esc: the parent decides, through `open`.
  event.preventDefault()
  emit('close')
}

function onClick(event: MouseEvent): void {
  // A click on the <dialog> itself, not on the box inside it, is a click on the backdrop.
  if (event.target === dialog.value) emit('close')
}

function onNativeClose(): void {
  // The browser closed it on its own (a repeated Esc): let the parent catch up.
  if (props.open) emit('close')
}

function closeOnUnmount(): void {
  if (dialog.value?.open === true) dialog.value.close()
}

onMounted(sync)
onBeforeUnmount(closeOnUnmount)

watch(() => props.open, sync, { flush: 'post' })
</script>

<template>
  <dialog
    ref="dialog"
    class="max-h-[calc(100dvh-1rem)] overflow-y-auto bg-transparent p-0 pr-(--pixel) text-ink backdrop:bg-shade/70"
    :class="PLACEMENT[placement]"
    :aria-labelledby="titleID"
    @cancel="onCancel"
    @click="onClick"
    @close="onNativeClose"
  >
    <PixelPanel class="motion-safe:animate-pop-in" padding="lg">
      <div class="mb-4 flex items-start justify-between gap-3">
        <h2 :id="titleID" class="font-pixel text-2xl leading-tight">{{ title }}</h2>
        <AppButton variant="secondary" size="sm" data-modal-close @click="requestClose">
          <PixelIcon :name="EPixelIcon.Cross" />
          <span class="sr-only">{{ closeLabel }}</span>
        </AppButton>
      </div>
      <slot />
      <div v-if="$slots.footer" class="mt-5 flex flex-wrap justify-end gap-3">
        <slot name="footer" />
      </div>
    </PixelPanel>
  </dialog>
</template>
