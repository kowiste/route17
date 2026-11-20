<script setup lang="ts">
// Her character drawn on a canvas at a whole-number scale, optionally playing
// the pose's frames. Still when she prefers reduced motion or the tab is hidden.

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EAvatarPose, type AvatarLook } from '@/contracts/avatar'
import { drawSprite } from '@/shared/pixel/sprite'
import { AVATAR_HEIGHT, AVATAR_WIDTH, avatarFrameCount, avatarSprite } from '@/shared/pixel/sprites'

interface Props {
  look: AvatarLook
  pose?: EAvatarPose
  /** Screen pixels per sprite pixel; rounded to a whole number. */
  scale?: number
  /** Plays the pose's frames. */
  animate?: boolean
  /** What a screen reader says for the picture. */
  label: string
}

const props = withDefaults(defineProps<Props>(), {
  pose: EAvatarPose.Idle,
  scale: 4,
  animate: false,
})

/** How long each frame of a pose stays on screen, in ms. */
const FRAME_MS: Readonly<Record<EAvatarPose, number>> = {
  [EAvatarPose.Idle]: 520,
  [EAvatarPose.Walk]: 170,
  [EAvatarPose.Cheer]: 300,
  [EAvatarPose.Sad]: 700,
}

const canvas = ref<HTMLCanvasElement | null>(null)
const frame = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const pixelScale = computed(() => Math.max(1, Math.round(props.scale)))
const width = computed(() => AVATAR_WIDTH * pixelScale.value)
const height = computed(() => AVATAR_HEIGHT * pixelScale.value)

function draw(): void {
  const ctx = canvas.value?.getContext('2d') ?? null
  if (ctx === null) return
  ctx.clearRect(0, 0, width.value, height.value)
  drawSprite(ctx, avatarSprite(props.look, props.pose, frame.value), 0, 0, {
    scale: pixelScale.value,
  })
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function stopAnimation(): void {
  if (timer === undefined) return
  clearInterval(timer)
  timer = undefined
}

function startAnimation(): void {
  stopAnimation()
  frame.value = 0
  const moves = props.animate && avatarFrameCount(props.pose) > 1
  if (!moves || prefersReducedMotion() || document.hidden) return
  timer = setInterval(() => {
    frame.value += 1
  }, FRAME_MS[props.pose])
}

onMounted(() => {
  draw()
  startAnimation()
  document.addEventListener('visibilitychange', startAnimation)
})

onBeforeUnmount(() => {
  stopAnimation()
  document.removeEventListener('visibilitychange', startAnimation)
})

watch([() => props.animate, () => props.pose], startAnimation)
watch([() => props.look, () => props.pose, pixelScale, frame], draw, { flush: 'post' })
</script>

<template>
  <canvas
    ref="canvas"
    :width="width"
    :height="height"
    role="img"
    :aria-label="label"
    :data-frame="frame"
    class="block [image-rendering:pixelated]"
  />
</template>
