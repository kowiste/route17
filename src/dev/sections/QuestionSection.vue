<script setup lang="ts">
import { ref } from 'vue'
import { EComunidadID } from '@/contracts/comunidad'
import { ESound } from '@/shared/sound/sounds'
import { sound } from '@/shared/sound/soundPlayer'
import AnswerOption from '@/shared/ui/AnswerOption.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import ConfirmBar from '@/shared/ui/ConfirmBar.vue'
import InfoButton from '@/shared/ui/InfoButton.vue'
import InfoSheet from '@/shared/ui/InfoSheet.vue'
import QuestionCard from '@/shared/ui/QuestionCard.vue'
import { EAnswerState } from '@/shared/ui/types'
import { useAnswerKeys } from '@/shared/ui/useAnswerKeys'
import GallerySection from '../GallerySection.vue'
import { CORTES, HEAD_OF_STATE, SAMPLE_QUESTIONS } from '../galleryData'

const demo = HEAD_OF_STATE
const trueFalse = SAMPLE_QUESTIONS[3] ?? HEAD_OF_STATE

const selected = ref<number | null>(null)
const confirmed = ref(false)
const infoOpen = ref(false)

function stateOf(index: number): EAnswerState {
  if (!confirmed.value) return index === selected.value ? EAnswerState.Selected : EAnswerState.Idle
  if (index === demo.answer) return EAnswerState.Correct
  if (index === selected.value) return EAnswerState.Wrong
  return EAnswerState.Idle
}

function choose(index: number): void {
  if (confirmed.value) return
  selected.value = index
  sound.play(ESound.Select)
}

function confirm(): void {
  if (selected.value === null) return
  confirmed.value = true
  sound.play(selected.value === demo.answer ? ESound.Correct : ESound.Wrong)
}

function cancel(): void {
  selected.value = null
}

function reset(): void {
  selected.value = null
  confirmed.value = false
  infoOpen.value = false
}

useAnswerKeys({
  optionCount: () => demo.options.length,
  selected: () => selected.value,
  enabled: () => !confirmed.value,
  choose,
  confirm,
  cancel,
})
</script>

<template>
  <GallerySection
    title="Preguntas"
    description="QuestionCard con AnswerOption en cada estado, ConfirmBar e InfoButton. La primera responde a A/B/C, 1/2/3, Intro y Esc."
  >
    <div class="grid gap-6 lg:grid-cols-2">
      <QuestionCard
        :topic="demo.topic"
        :rung="2"
        :comunidad="EComunidadID.Andalucia"
        :question="demo.question"
      >
        <AnswerOption
          v-for="(text, i) in demo.options"
          :key="i"
          :index="i"
          :text="text"
          :state="stateOf(i)"
          :locked="confirmed"
          @choose="choose"
        />
        <template #footer>
          <ConfirmBar v-if="selected !== null && !confirmed" @confirm="confirm" @cancel="cancel" />
          <div v-else-if="confirmed" class="flex flex-wrap gap-3">
            <InfoButton attention @open="infoOpen = true" />
            <AppButton variant="secondary" size="sm" @click="reset">Otra vez</AppButton>
          </div>
        </template>
      </QuestionCard>

      <QuestionCard
        :topic="CORTES.topic"
        :rung="6"
        :comunidad="EComunidadID.Cataluna"
        :question="CORTES.question"
      >
        <AnswerOption :index="0" :text="CORTES.options[0] ?? ''" />
        <AnswerOption :index="1" :text="CORTES.options[1] ?? ''" :state="EAnswerState.Selected" />
        <AnswerOption :index="2" :text="CORTES.options[2] ?? ''" />
        <template #footer>
          <ConfirmBar />
        </template>
      </QuestionCard>

      <QuestionCard
        :topic="CORTES.topic"
        :rung="9"
        :comunidad="EComunidadID.Rioja"
        :question="CORTES.question"
      >
        <AnswerOption :index="0" :text="CORTES.options[0] ?? ''" :state="EAnswerState.Wrong" />
        <AnswerOption :index="1" :text="CORTES.options[1] ?? ''" :state="EAnswerState.Correct" />
        <AnswerOption :index="2" :text="CORTES.options[2] ?? ''" locked />
        <template #footer>
          <InfoButton @open="infoOpen = true" />
        </template>
      </QuestionCard>

      <QuestionCard
        :topic="CORTES.topic"
        :rung="12"
        :comunidad="EComunidadID.Asturias"
        :question="CORTES.question"
      >
        <AnswerOption :index="0" :text="CORTES.options[0] ?? ''" :state="EAnswerState.Removed" />
        <AnswerOption :index="1" :text="CORTES.options[1] ?? ''" />
        <AnswerOption :index="2" :text="CORTES.options[2] ?? ''" :state="EAnswerState.Selected" />
        <template #footer>
          <InfoButton disabled />
        </template>
      </QuestionCard>

      <QuestionCard
        :topic="trueFalse.topic"
        :rung="17"
        :comunidad="EComunidadID.Madrid"
        :question="trueFalse.question"
      >
        <AnswerOption
          v-for="(text, i) in trueFalse.options"
          :key="i"
          :index="i"
          :text="text"
          :state="i === trueFalse.answer ? EAnswerState.Correct : EAnswerState.Idle"
          locked
        />
      </QuestionCard>
    </div>

    <InfoSheet
      :open="infoOpen"
      :explanation="demo.explanation"
      :correct="confirmed ? selected === demo.answer : true"
      :answer-index="demo.answer"
      :answer-text="demo.options[demo.answer] ?? ''"
      :question="demo.question"
      @close="infoOpen = false"
    />
  </GallerySection>
</template>
