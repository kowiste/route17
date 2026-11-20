<script setup lang="ts">
// Something went wrong: a friendly message in a dialog box, a way to try
// again and a way home. Never a blank screen.

import { computed } from 'vue'
import AppButton from '@/shared/ui/AppButton.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import { friendlyError } from './errorMessage'

interface Props {
  error: unknown
  title?: string
  /** Shows "Reintentar". */
  retry?: boolean
  /** Shows "Inicio". */
  home?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '¡Vaya!',
  retry: true,
  home: true,
})

const emit = defineEmits<{
  retry: []
  home: []
}>()

const message = computed(() => friendlyError(props.error))

function onRetry(): void {
  emit('retry')
}

function onHome(): void {
  emit('home')
}
</script>

<template>
  <PixelPanel tone="surface" padding="lg" role="alert" data-error-panel>
    <h2 class="font-pixel text-2xl leading-tight">{{ title }}</h2>
    <p class="mt-2 text-base leading-relaxed md:text-lg">{{ message }}</p>
    <div v-if="retry || home" class="mt-4 flex flex-wrap gap-3">
      <AppButton v-if="retry" data-action="retry" @click="onRetry">Reintentar</AppButton>
      <AppButton v-if="home" variant="secondary" data-action="home" @click="onHome">
        Inicio
      </AppButton>
    </div>
  </PixelPanel>
</template>
