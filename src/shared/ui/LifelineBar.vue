<script setup lang="ts">
import AppButton from './AppButton.vue'
import PixelIcon from './PixelIcon.vue'
import { EPixelIcon } from './icons'
import { ELifeline, LIFELINES } from './types'

// The three comodines. A used one is crossed out; an unavailable one (the
// 50:50 on a true/false question, or after confirming) is greyed out.

interface Props {
  used?: readonly ELifeline[]
  unavailable?: readonly ELifeline[]
  /** Greys out the whole bar. */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  used: () => [],
  unavailable: () => [],
  disabled: false,
})

const emit = defineEmits<{
  use: [lifeline: ELifeline]
}>()

const INFO: Readonly<Record<ELifeline, { label: string; name: string; icon: EPixelIcon }>> = {
  [ELifeline.FiftyFifty]: { label: '50:50', name: 'Comodín del 50:50', icon: EPixelIcon.Half },
  [ELifeline.Audience]: {
    label: 'Público',
    name: 'Comodín del público',
    icon: EPixelIcon.Audience,
  },
  [ELifeline.Friend]: {
    label: 'Amigo',
    name: 'Comodín: llamar a un amigo',
    icon: EPixelIcon.Phone,
  },
}

function isUsed(lifeline: ELifeline): boolean {
  return props.used.includes(lifeline)
}

function isOff(lifeline: ELifeline): boolean {
  return props.disabled || isUsed(lifeline) || props.unavailable.includes(lifeline)
}

function accessibleName(lifeline: ELifeline): string {
  const name = INFO[lifeline].name
  if (isUsed(lifeline)) return `${name} (usado)`
  if (props.unavailable.includes(lifeline)) return `${name} (no disponible)`
  return name
}

function onUse(lifeline: ELifeline): void {
  if (!isOff(lifeline)) emit('use', lifeline)
}
</script>

<template>
  <div role="group" aria-label="Comodines" class="grid grid-cols-3 gap-3">
    <AppButton
      v-for="lifeline in LIFELINES"
      :key="lifeline"
      variant="sign"
      size="sm"
      block
      :disabled="isOff(lifeline)"
      :aria-label="accessibleName(lifeline)"
      :data-lifeline="lifeline"
      @click="onUse(lifeline)"
    >
      <PixelIcon v-if="isUsed(lifeline)" :name="EPixelIcon.Cross" class="text-wrong" />
      <PixelIcon v-else :name="INFO[lifeline].icon" />
      <span
        :class="[
          isUsed(lifeline) ? 'line-through' : '',
          lifeline === ELifeline.FiftyFifty ? 'hud-number' : '',
        ]"
        >{{ INFO[lifeline].label }}</span
      >
    </AppButton>
  </div>
</template>
