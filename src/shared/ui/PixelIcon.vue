<script setup lang="ts">
import { computed } from 'vue'
import { iconShape, type EPixelIcon } from './icons'

interface Props {
  name: EPixelIcon
  /** Read out by screen readers; without it the icon is decoration. */
  label?: string
}

const props = defineProps<Props>()

const shape = computed(() => iconShape(props.name))
const width = computed(
  () => `${(shape.value.width / Math.max(shape.value.height, 1)).toFixed(3)}em`
)
</script>

<template>
  <svg
    :viewBox="`0 0 ${shape.width} ${shape.height}`"
    :width="width"
    height="1em"
    class="inline-block shrink-0 fill-current"
    shape-rendering="crispEdges"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path :d="shape.path" />
  </svg>
</template>
