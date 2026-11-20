<script setup lang="ts">
// A pixel-art sprite inside an SVG: one <rect> per run of a colour, crisp edges.
import { computed } from 'vue'
import { PIXEL_PALETTE } from '@/shared/pixel/palette'
import type { Sprite } from '@/shared/pixel/sprite'
import { spriteRects } from './spriteRects'

interface Props {
  sprite: Sprite
  /** Top-left corner, in the SVG's units. */
  x: number
  y: number
  /** Size of one sprite pixel, in the SVG's units. */
  pixel?: number
  /** Mirrored left to right (walking left). */
  flip?: boolean
}

const props = withDefaults(defineProps<Props>(), { pixel: 1, flip: false })

const rects = computed(() => spriteRects(props.sprite, props.flip))
const transform = computed(() => `translate(${props.x} ${props.y}) scale(${props.pixel})`)
</script>

<template>
  <g :transform="transform" shape-rendering="crispEdges">
    <rect
      v-for="(rect, i) in rects"
      :key="i"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      height="1"
      :fill="PIXEL_PALETTE[rect.color]"
    />
  </g>
</template>
