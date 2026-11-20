<script setup lang="ts">
import { computed } from 'vue'
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'
import PixelIcon from './PixelIcon.vue'
import { optionLetter } from './format'
import { EPixelIcon } from './icons'

// Behind the ⓘ: whether she got it right, the right answer and why. A sheet
// at the bottom on the phone, a centred box on the laptop.

interface Props {
  open: boolean
  explanation: string
  /** Her answer was right (true), wrong (false), or no verdict (null, e.g. reviewing). */
  correct?: boolean | null
  /** The right option (0-based) and its text; shown when given. */
  answerIndex?: number | null
  answerText?: string
  /** The question, as a reminder. */
  question?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  correct: null,
  answerIndex: null,
  answerText: '',
  question: '',
  title: 'Explicación',
})

const emit = defineEmits<{
  close: []
}>()

const answerLetter = computed(() =>
  props.answerIndex === null ? '' : `${optionLetter(props.answerIndex)} · `
)

function onClose(): void {
  emit('close')
}
</script>

<template>
  <AppModal :open="open" :title="title" placement="sheet" @close="onClose">
    <div class="flex flex-col gap-4">
      <p
        v-if="correct !== null"
        class="pixel-corners-inner flex items-center gap-2 self-start px-3 py-1 font-pixel text-lg"
        :class="correct ? 'bg-correct text-correct-ink' : 'bg-wrong text-wrong-ink'"
        data-verdict
      >
        <PixelIcon :name="correct ? EPixelIcon.Check : EPixelIcon.Cross" />
        {{ correct ? '¡Correcto!' : 'Esta vez no' }}
      </p>
      <p v-if="question" class="text-base leading-snug text-muted">{{ question }}</p>
      <p
        v-if="answerText"
        class="flex flex-wrap items-baseline gap-x-2 text-base md:text-lg"
        data-answer
      >
        <span class="font-pixel">Respuesta correcta:</span>
        <span class="font-semibold">{{ answerLetter }}{{ answerText }}</span>
      </p>
      <p class="text-base leading-relaxed md:text-lg" data-explanation>{{ explanation }}</p>
    </div>
    <template #footer>
      <AppButton @click="onClose">Entendido</AppButton>
    </template>
  </AppModal>
</template>
