<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent, optionLetter } from './format'

// What the audience voted: one pixel bar per option, growing in steps.

interface Props {
  /** One percentage per option, in option order. */
  percentages: readonly number[]
  /** Options taken away by the 50:50: shown with a dash. */
  removed?: readonly number[]
  caption?: string
}

const props = withDefaults(defineProps<Props>(), {
  removed: () => [],
  caption: 'Lo que vota el público',
})

/** The tallest bar, in pixel units. */
const BAR_UNITS = 30

const bars = computed(() =>
  props.percentages.map((percent, index) => {
    const removed = props.removed.includes(index)
    const units = removed ? 0 : Math.round((Math.max(0, Math.min(100, percent)) / 100) * BAR_UNITS)
    return {
      index,
      letter: optionLetter(index),
      removed,
      text: removed ? '—' : formatPercent(percent),
      height: `calc(var(--pixel) * ${units})`,
    }
  })
)

const summary = computed(
  () =>
    `${props.caption}: ${bars.value
      .map((bar) => `${bar.letter}, ${bar.removed ? 'descartada' : bar.text}`)
      .join('; ')}`
)
</script>

<template>
  <figure class="flex flex-col gap-3">
    <figcaption class="font-pixel text-lg">{{ caption }}</figcaption>
    <div role="img" :aria-label="summary" class="flex flex-col gap-1">
      <div class="flex h-[calc(var(--pixel)*38)] items-end justify-around gap-3 px-2">
        <div
          v-for="bar in bars"
          :key="bar.index"
          class="flex h-full max-w-20 flex-1 flex-col items-center justify-end gap-1"
          :data-bar="bar.letter"
        >
          <span class="hud-number text-base md:text-lg">{{ bar.text }}</span>
          <span
            v-if="!bar.removed"
            class="w-full origin-bottom bg-frame px-(--pixel) pt-(--pixel) motion-safe:animate-rise"
            :style="{ height: bar.height }"
          >
            <span class="block h-full bg-sign" />
          </span>
        </div>
      </div>
      <div class="h-(--pixel) bg-frame" />
      <div class="flex justify-around gap-3 px-2">
        <span
          v-for="bar in bars"
          :key="bar.index"
          class="max-w-20 flex-1 text-center font-pixel text-lg"
          :class="bar.removed ? 'text-muted' : ''"
          >{{ bar.letter }}</span
        >
      </div>
    </div>
  </figure>
</template>
