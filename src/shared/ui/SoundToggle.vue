<script setup lang="ts">
import AppButton from './AppButton.vue'
import PixelIcon from './PixelIcon.vue'
import { EPixelIcon } from './icons'

// The mute switch: `v-model:muted`.

interface Props {
  muted: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:muted': [muted: boolean]
}>()

function onToggle(): void {
  emit('update:muted', !props.muted)
}
</script>

<template>
  <AppButton variant="secondary" size="sm" :aria-pressed="!muted" @click="onToggle">
    <PixelIcon :name="muted ? EPixelIcon.SoundOff : EPixelIcon.SoundOn" class="text-xl" />
    <span>{{ muted ? 'Sonido: no' : 'Sonido: sí' }}</span>
  </AppButton>
</template>
