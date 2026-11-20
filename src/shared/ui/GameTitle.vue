<script setup lang="ts">
// The "Route 17" logo: big pixel lettering, the number on a road sign, and a
// strip of road underneath. Our own design. The "17" is drawn as blocky pixel
// digits (signNumber.ts), scaled by whole pixels so it stays crisp.

import { SIGN_NUMBER_HEIGHT, SIGN_NUMBER_WIDTH, SIGN_RUNS } from './signNumber'

interface Props {
  size?: 'md' | 'lg'
  /** A line under the logo. */
  tagline?: string
}

withDefaults(defineProps<Props>(), {
  size: 'lg',
})
</script>

<template>
  <div class="inline-flex flex-col items-stretch gap-3">
    <div
      role="img"
      aria-label="Route 17"
      class="flex items-center justify-center gap-3 font-pixel leading-none md:gap-4"
    >
      <span
        aria-hidden="true"
        class="pixel-text-outline font-semibold tracking-wide text-primary"
        :class="size === 'lg' ? 'text-6xl md:text-8xl' : 'text-4xl md:text-5xl'"
        >ROUTE</span
      >
      <span aria-hidden="true" class="pixel-shadow block">
        <span class="pixel-corners block bg-frame p-(--pixel)">
          <span class="pixel-corners-inner block bg-sign-ink p-(--pixel)">
            <span
              class="pixel-corners-inner block bg-sign text-sign-ink"
              :class="size === 'lg' ? 'px-3 py-3 md:px-4 md:py-4' : 'px-2 py-2'"
            >
              <svg
                :viewBox="`0 0 ${SIGN_NUMBER_WIDTH} ${SIGN_NUMBER_HEIGHT}`"
                class="block"
                :class="
                  size === 'lg'
                    ? 'h-[36px] w-[56px] md:h-[54px] md:w-[84px]'
                    : 'h-[27px] w-[42px] md:h-[36px] md:w-[56px]'
                "
                shape-rendering="crispEdges"
                fill="currentColor"
                data-sign-number
              >
                <rect
                  v-for="run in SIGN_RUNS"
                  :key="`${run.x}-${run.y}`"
                  :x="run.x"
                  :y="run.y"
                  :width="run.width"
                  height="1"
                />
              </svg>
            </span>
          </span>
        </span>
      </span>
    </div>
    <span aria-hidden="true" class="pixel-road block h-[calc(var(--pixel)*3)]" />
    <p v-if="tagline" class="text-center font-pixel text-lg text-muted md:text-xl">
      {{ tagline }}
    </p>
  </div>
</template>
