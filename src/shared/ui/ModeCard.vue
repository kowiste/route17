<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressCount } from '@/contracts/deck'
import { ROUND_LENGTH } from '@/contracts/route'
import AppButton from './AppButton.vue'
import PixelIcon from './PixelIcon.vue'
import PixelPanel from './PixelPanel.vue'
import ProgressMeter from './ProgressMeter.vue'
import { rungComunidadName } from './format'
import { EPixelIcon } from './icons'

interface Props {
  title: string
  subtitle: string
  /** Her progress in the mode's set; null hides the bar. */
  progress?: ProgressCount | null
  /** The furthest rung she has reached (1-17); null or 0 hides it. */
  bestRung?: number | null
  disabled?: boolean
  /** Why it can't be played yet, or any short note. */
  note?: string
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  progress: null,
  bestRung: null,
  disabled: false,
  note: '',
  actionLabel: 'Jugar',
})

const emit = defineEmits<{
  start: []
}>()

const progressText = computed(() => {
  const progress = props.progress
  if (progress === null) return ''
  return `${progress.mastered} de ${progress.total} dominadas · ${progress.seen} vistas`
})

const bestText = computed(() => {
  const best = props.bestRung ?? 0
  if (best <= 0) return ''
  return `Récord: parada ${best} de ${ROUND_LENGTH} · ${rungComunidadName(best)}`
})

function onStart(): void {
  if (!props.disabled) emit('start')
}
</script>

<template>
  <PixelPanel tag="article" :tone="disabled ? 'alt' : 'surface'" padding="lg" class="h-full">
    <div class="flex h-full flex-col gap-3">
      <div>
        <h2 class="font-pixel text-2xl leading-tight md:text-3xl">{{ title }}</h2>
        <p class="mt-1 text-base text-muted">{{ subtitle }}</p>
      </div>
      <div v-if="progress !== null" class="flex flex-col gap-1">
        <ProgressMeter
          :value="progress.mastered"
          :secondary="progress.seen"
          :max="progress.total"
          :label="progressText"
        />
        <p class="text-sm text-muted">{{ progressText }}</p>
      </div>
      <p v-if="bestText" class="flex items-center gap-2 text-sm">
        <PixelIcon :name="EPixelIcon.Flag" />
        <span>{{ bestText }}</span>
      </p>
      <p v-if="note" class="font-pixel text-base" :class="disabled ? 'text-ink' : 'text-muted'">
        {{ note }}
      </p>
      <AppButton class="mt-auto" size="lg" block :disabled="disabled" @click="onStart">
        {{ actionLabel }}
      </AppButton>
    </div>
  </PixelPanel>
</template>
