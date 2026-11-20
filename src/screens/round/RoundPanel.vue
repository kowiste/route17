<script setup lang="ts">
// The question side of the round: the question with its options, the verdict
// with the ⓘ, the lifelines, and the action bar that is always there:
// "Plantarse" on the left and, on the right, one main button that is "Confirmar"
// (disabled until she picks; she can change her pick until she presses it),
// then "Continuar" (or "Ver resultado" when the round is over). Game moves go
// to the round store; the modals and the navigation are the round screen's,
// through the events.

import { computed, nextTick, ref, watch } from 'vue'
import { COMUNIDADES } from '@/contracts/comunidad'
import { ELifeline, LIFELINES } from '@/contracts/lifeline'
import { ROUTE } from '@/contracts/route'
import { useRoundStore } from '@/features/round/view/roundStore'
import { ERoundPhase } from '@/features/round/view/roundView'
import AnswerOption from '@/shared/ui/AnswerOption.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import InfoButton from '@/shared/ui/InfoButton.vue'
import InfoSheet from '@/shared/ui/InfoSheet.vue'
import LifelineBar from '@/shared/ui/LifelineBar.vue'
import PixelIcon from '@/shared/ui/PixelIcon.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import QuestionCard from '@/shared/ui/QuestionCard.vue'
import { EPixelIcon } from '@/shared/ui/icons'
import ErrorPanel from '../ErrorPanel.vue'
import { friendlyError } from '../errorMessage'

const emit = defineEmits<{
  /** She pressed "Plantarse": the screen asks first. */
  stop: []
  /** "Ver resultado". */
  result: []
  /** She used a lifeline (`fresh`) or wants to see its answer again. */
  help: [lifeline: ELifeline, fresh: boolean]
  retry: []
  home: []
}>()

/** What the main button of the action bar does now. */
interface MainAction {
  readonly action: 'confirm' | 'continue' | 'result'
  readonly label: string
  readonly disabled: boolean
}

const infoOpen = ref(false)
const infoSeen = ref(false)
const actionBar = ref<HTMLElement | null>(null)

const round = useRoundStore()

const question = computed(() => round.question)
const lifelines = computed(() => round.state?.lifelines ?? null)
const used = computed(() => LIFELINES.filter((lifeline) => lifelines.value?.[lifeline].used))
const unavailable = computed(() =>
  LIFELINES.filter((lifeline) => {
    const status = lifelines.value?.[lifeline]
    return status !== undefined && !status.used && !status.available
  })
)
const asking = computed(() => round.phase === ERoundPhase.Asking)
const selected = computed(() => round.state?.selected ?? null)
const answerText = computed(() => {
  const q = question.value
  if (q === null || q.answer === null) return ''
  return q.options.find((option) => option.index === q.answer)?.text ?? ''
})
const nextStopName = computed(() => {
  const comunidad = ROUTE[round.mapStop]
  return comunidad === undefined ? '' : COMUNIDADES[comunidad].shortName
})
const actionError = computed(() =>
  round.error !== null && round.phase !== ERoundPhase.Failed ? friendlyError(round.error) : ''
)
const mainAction = computed<MainAction>(() => {
  if (asking.value) {
    return {
      action: 'confirm',
      label: 'Confirmar',
      disabled: selected.value === null || round.busy,
    }
  }
  if (round.over) return { action: 'result', label: 'Ver resultado', disabled: false }
  return {
    action: 'continue',
    label: 'Continuar',
    disabled: round.phase !== ERoundPhase.Revealed,
  }
})
const canStop = computed(() => asking.value && !round.busy)

function openInfo(): void {
  infoOpen.value = true
  infoSeen.value = true
}

function closeInfo(): void {
  infoOpen.value = false
}

function useLifeline(lifeline: ELifeline): void {
  if (round.useLifeline(lifeline)) emit('help', lifeline, true)
}

function runMainAction(): void {
  const { action, disabled } = mainAction.value
  if (disabled) return
  if (action === 'confirm') void round.confirm()
  else if (action === 'continue') round.travel()
  else emit('result')
}

/** After the verdict, the main button has the focus: Intro goes on. */
function focusNextStep(): void {
  actionBar.value?.querySelector<HTMLButtonElement>('button[data-main-action]')?.focus()
}

watch(
  () => round.phase,
  (phase) => {
    if (phase === ERoundPhase.Revealed) {
      infoSeen.value = false
      void nextTick(focusNextStep)
    }
    if (phase !== ERoundPhase.Revealed && phase !== ERoundPhase.Travelling) infoOpen.value = false
  }
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <PixelPanel v-if="round.phase === ERoundPhase.Loading" padding="lg" aria-live="polite">
      <p class="font-pixel text-xl motion-safe:animate-blink">Preparando tu ruta…</p>
    </PixelPanel>

    <ErrorPanel
      v-else-if="round.phase === ERoundPhase.Failed"
      :error="round.error"
      @retry="emit('retry')"
      @home="emit('home')"
    />

    <template v-else-if="question !== null">
      <QuestionCard
        :topic="question.topic"
        :rung="question.rung"
        :comunidad="question.comunidadID"
        :question="question.text"
      >
        <AnswerOption
          v-for="option in question.options"
          :key="option.index"
          :index="option.index"
          :text="option.text"
          :state="option.state"
          :locked="question.locked || round.busy"
          @choose="round.choose"
        />
        <template #footer>
          <p v-if="asking && selected === null" class="font-pixel text-base text-muted" data-hint>
            Elige una respuesta<span class="hidden md:inline"> (A, B, C o 1, 2, 3)</span>.
          </p>
          <p v-else-if="asking" class="font-pixel text-base text-muted" data-hint>
            Puedes cambiarla antes de confirmar<span class="hidden md:inline"> (Intro)</span>.
          </p>
          <div v-else class="flex flex-wrap items-center gap-3" data-reveal>
            <p
              role="status"
              class="pixel-corners-inner flex items-center gap-2 px-3 py-1 font-pixel text-lg"
              :class="question.correct ? 'bg-correct text-correct-ink' : 'bg-wrong text-wrong-ink'"
              data-verdict
            >
              <PixelIcon :name="question.correct ? EPixelIcon.Check : EPixelIcon.Cross" />
              {{ question.correct ? '¡Correcto!' : 'Incorrecto' }}
            </p>
            <p
              v-if="round.phase === ERoundPhase.Travelling"
              class="font-pixel text-base motion-safe:animate-blink"
              aria-live="polite"
              data-travelling
            >
              Rumbo a {{ nextStopName }}…
            </p>
            <InfoButton class="ml-auto" :attention="!infoSeen" @open="openInfo" />
          </div>
        </template>
      </QuestionCard>

      <p v-if="actionError" class="font-pixel text-base text-wrong" role="alert">
        {{ actionError }}
      </p>

      <div v-if="asking" class="flex flex-col gap-3" data-tools>
        <LifelineBar
          :used="used"
          :unavailable="unavailable"
          :disabled="round.busy"
          @use="useLifeline"
        />
        <div
          v-if="round.state?.audience || round.state?.friend"
          class="flex flex-wrap items-center gap-3"
        >
          <AppButton
            v-if="round.state?.audience"
            variant="secondary"
            size="sm"
            data-action="show-audience"
            @click="emit('help', ELifeline.Audience, false)"
          >
            Ver el voto del público
          </AppButton>
          <AppButton
            v-if="round.state?.friend"
            variant="secondary"
            size="sm"
            data-action="show-friend"
            @click="emit('help', ELifeline.Friend, false)"
          >
            Ver la llamada
          </AppButton>
        </div>
      </div>

      <div
        ref="actionBar"
        class="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-3 bg-bg px-1 py-2"
        data-action-bar
      >
        <AppButton variant="accent" :disabled="!canStop" data-action="stop" @click="emit('stop')">
          Plantarse
        </AppButton>
        <AppButton
          :disabled="mainAction.disabled"
          :data-action="mainAction.action"
          data-main-action
          @click="runMainAction"
        >
          {{ mainAction.label }}
        </AppButton>
      </div>

      <InfoSheet
        :open="infoOpen && question.explanation !== null"
        :explanation="question.explanation ?? ''"
        :correct="question.correct"
        :answer-index="question.answer"
        :answer-text="answerText"
        :question="question.text"
        @close="closeInfo"
      />
    </template>
  </div>
</template>
