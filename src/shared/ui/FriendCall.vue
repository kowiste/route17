<script setup lang="ts">
import { computed } from 'vue'
import AppButton from './AppButton.vue'
import PixelIcon from './PixelIcon.vue'
import PixelPanel from './PixelPanel.vue'
import { formatPercent, optionLetter } from './format'
import { EPixelIcon } from './icons'

// The "llamar a un amigo" lifeline as an old phone's screen: ringing while
// `calling`, then what the friend says, the option and how sure they are.

interface Props {
  /** Who she calls, as it reads after "Llamando a". */
  friendName?: string
  /** Still ringing: the answer is not shown yet. */
  calling?: boolean
  message?: string
  /** The option the friend names (0-based); null if none. */
  optionIndex?: number | null
  optionText?: string
  /** How sure the friend is, 0-100. */
  confidence?: number
}

const props = withDefaults(defineProps<Props>(), {
  friendName: 'tu amigo',
  calling: false,
  message: '',
  optionIndex: null,
  optionText: '',
  confidence: 0,
})

const emit = defineEmits<{
  hangUp: []
}>()

/** The signal bars that show how sure the friend is. */
const BARS = 5

const heading = computed(() => {
  if (props.calling) return `Llamando a ${props.friendName}…`
  const name = props.friendName.charAt(0).toUpperCase() + props.friendName.slice(1)
  return `${name} dice:`
})

const bars = computed(() => {
  const filled = Math.round((Math.max(0, Math.min(100, props.confidence)) / 100) * BARS)
  return Array.from({ length: BARS }, (_, i) => ({
    filled: i < filled,
    height: `calc(var(--pixel) * ${(i + 1) * 2})`,
  }))
})

const letter = computed(() => (props.optionIndex === null ? '' : optionLetter(props.optionIndex)))

function onHangUp(): void {
  emit('hangUp')
}
</script>

<template>
  <PixelPanel tone="lcd" padding="lg" role="group" aria-label="Llamada a un amigo">
    <div class="flex items-center gap-3 font-pixel">
      <PixelIcon
        :name="EPixelIcon.Phone"
        class="text-3xl"
        :class="calling ? 'motion-safe:animate-ring' : ''"
      />
      <p class="text-lg leading-tight md:text-xl">{{ heading }}</p>
    </div>
    <div aria-live="polite" class="mt-3">
      <p v-if="calling" class="font-pixel text-2xl motion-safe:animate-blink" aria-hidden="true">
        · · ·
      </p>
      <template v-else>
        <p class="text-base leading-relaxed md:text-lg">«{{ message }}»</p>
        <p v-if="optionIndex !== null" class="mt-3 font-pixel text-lg" data-friend-option>
          Su respuesta: <span class="font-semibold">{{ letter }}</span> · {{ optionText }}
        </p>
        <div class="mt-2 flex items-end gap-3 font-pixel text-base">
          <span>Seguridad</span>
          <span
            class="flex items-end gap-(--pixel)"
            role="img"
            :aria-label="`Seguridad: ${formatPercent(confidence)}`"
          >
            <span
              v-for="(bar, i) in bars"
              :key="i"
              class="w-[calc(var(--pixel)*2)]"
              :class="bar.filled ? 'bg-lcd-ink' : 'bg-lcd-ink/25'"
              :style="{ height: bar.height }"
            />
          </span>
          <span aria-hidden="true" class="hud-number">{{ formatPercent(confidence) }}</span>
        </div>
      </template>
    </div>
    <AppButton class="mt-4" variant="primary" size="sm" @click="onHangUp">Colgar</AppButton>
  </PixelPanel>
</template>
