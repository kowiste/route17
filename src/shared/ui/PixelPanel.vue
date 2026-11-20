<script setup lang="ts">
import type { PanelTone } from './types'

interface Props {
  tone?: PanelTone
  /** A heading at the top of the box, in the pixel font. */
  title?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** The hard shadow under the box. */
  shadow?: boolean
  tag?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer'
}

withDefaults(defineProps<Props>(), {
  tone: 'surface',
  padding: 'md',
  shadow: true,
  tag: 'div',
})

const TONE: Readonly<Record<PanelTone, string>> = {
  surface: 'bg-surface text-ink',
  alt: 'bg-surface-alt text-ink',
  sign: 'bg-sign text-sign-ink',
  accent: 'bg-accent text-accent-ink',
  lcd: 'bg-lcd text-lcd-ink',
}

const PADDING = {
  none: '',
  sm: 'p-2 md:p-3',
  md: 'p-3 md:p-4',
  lg: 'p-4 md:p-6',
} as const
</script>

<template>
  <component :is="tag" class="flex min-w-0 flex-col" :class="shadow ? 'pixel-shadow' : ''">
    <div class="pixel-corners flex flex-1 flex-col bg-frame p-(--pixel)">
      <div class="pixel-corners-inner min-w-0 flex-1" :class="[TONE[tone], PADDING[padding]]">
        <h2 v-if="title" class="mb-3 font-pixel text-xl leading-tight md:text-2xl">
          {{ title }}
        </h2>
        <slot />
      </div>
    </div>
  </component>
</template>
