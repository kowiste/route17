<script setup lang="ts">
import { computed } from 'vue'

// A chunky bar that fills in blocks: the main part (mastered) in green, an
// optional second part (seen, which includes the main one) in yellow.

interface Props {
  value: number
  /** A lighter part that includes `value`, drawn behind it. */
  secondary?: number
  max: number
  /** What the bar says, read out by screen readers. */
  label: string
}

const props = defineProps<Props>()

const mainWidth = computed(() => `${percent(props.value)}%`)
const secondaryWidth = computed(() => `${percent(Math.max(props.secondary ?? 0, props.value))}%`)

function percent(amount: number): number {
  if (props.max <= 0) return 0
  return Math.min(100, Math.max(0, (amount / props.max) * 100))
}
</script>

<template>
  <div
    role="progressbar"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
    :aria-valuetext="label"
    class="pixel-corners bg-frame p-(--pixel)"
  >
    <div class="pixel-corners-inner relative h-[calc(var(--pixel)*4)] bg-surface-alt">
      <div
        v-if="secondary !== undefined"
        data-part="secondary"
        class="absolute inset-y-0 left-0 bg-accent"
        :style="{ width: secondaryWidth }"
      />
      <div
        data-part="main"
        class="absolute inset-y-0 left-0 bg-correct"
        :style="{ width: mainWidth }"
      />
      <div class="pixel-ticks absolute inset-0" />
    </div>
  </div>
</template>
