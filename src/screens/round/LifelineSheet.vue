<script setup lang="ts">
// What a lifeline says, in a box over the round: the audience's vote, or the
// call to a friend (ringing for a moment the first time, unless she prefers
// reduced motion).

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ELifeline } from '@/contracts/lifeline'
import { useRoundStore } from '@/features/round/view/roundStore'
import AppButton from '@/shared/ui/AppButton.vue'
import AppModal from '@/shared/ui/AppModal.vue'
import AudienceChart from '@/shared/ui/AudienceChart.vue'
import FriendCall from '@/shared/ui/FriendCall.vue'

interface Props {
  /** The lifeline to show; null closes the box. */
  lifeline: ELifeline | null
  /** Just used: the phone rings before the friend answers. */
  fresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fresh: false,
})

const emit = defineEmits<{
  close: []
}>()

/** How long the phone rings before the friend answers, in ms. */
const RING_MS = 1600

const calling = ref(false)
let ringTimer: ReturnType<typeof setTimeout> | undefined

const round = useRoundStore()

const question = computed(() => round.state?.question ?? null)
const removed = computed(
  () => question.value?.options.filter((o) => o.removed).map((o) => o.index) ?? []
)
const audience = computed(() =>
  props.lifeline === ELifeline.Audience ? (round.state?.audience ?? null) : null
)
const friend = computed(() =>
  props.lifeline === ELifeline.Friend ? (round.state?.friend ?? null) : null
)
const friendOptionText = computed(() => {
  const option = friend.value?.option
  return question.value?.options.find((o) => o.index === option)?.text ?? ''
})
const title = computed(() =>
  props.lifeline === ELifeline.Friend ? 'Llamar a un amigo' : 'El público'
)

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function stopRinging(): void {
  if (ringTimer !== undefined) clearTimeout(ringTimer)
  ringTimer = undefined
  calling.value = false
}

function close(): void {
  stopRinging()
  emit('close')
}

onBeforeUnmount(stopRinging)

watch(
  () => [props.lifeline, props.fresh] as const,
  ([lifeline, fresh]) => {
    stopRinging()
    if (lifeline !== ELifeline.Friend || !fresh || prefersReducedMotion()) return
    calling.value = true
    ringTimer = setTimeout(() => {
      ringTimer = undefined
      calling.value = false
    }, RING_MS)
  },
  { immediate: true }
)
</script>

<template>
  <AppModal :open="audience !== null || friend !== null" :title="title" @close="close">
    <AudienceChart
      v-if="audience !== null"
      :percentages="audience.percentages"
      :removed="removed"
    />
    <FriendCall
      v-else-if="friend !== null"
      :calling="calling"
      :message="friend.message"
      :option-index="friend.option"
      :option-text="friendOptionText"
      :confidence="friend.certainty"
      @hang-up="close"
    />
    <template v-if="audience !== null" #footer>
      <AppButton data-action="back-to-question" @click="close">Volver a la pregunta</AppButton>
    </template>
  </AppModal>
</template>
