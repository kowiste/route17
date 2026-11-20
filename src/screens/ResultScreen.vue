<script setup lang="ts">
// The end of a round: her points, how far she got ("¡Nacionalidad!" in
// Madrid), each question with right or wrong and its ⓘ, and what next.

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { EAvatarPose } from '@/contracts/avatar'
import { COMUNIDADES } from '@/contracts/comunidad'
import { ROUND_LENGTH } from '@/contracts/route'
import { ERouteName, roundRoute } from '@/bootstrap/router'
import AvatarCanvas from '@/features/avatar/view/AvatarCanvas.vue'
import { useAvatarStore } from '@/features/avatar/view/avatarStore'
import { MODE_TEXT } from '@/features/home/view/homeText'
import { useRoundStore } from '@/features/round/view/roundStore'
import { ERoundStatus } from '@/features/round/view/roundView'
import AppButton from '@/shared/ui/AppButton.vue'
import InfoButton from '@/shared/ui/InfoButton.vue'
import InfoSheet from '@/shared/ui/InfoSheet.vue'
import PixelIcon from '@/shared/ui/PixelIcon.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import { formatPoints, optionLetter } from '@/shared/ui/format'
import { EPixelIcon } from '@/shared/ui/icons'

/** The answer whose ⓘ is open: its index in the round's answers. */
const infoIndex = ref<number | null>(null)

const router = useRouter()
const round = useRoundStore()
const avatar = useAvatarStore()

const state = computed(() => {
  const current = round.state
  return current !== null && current.status !== ERoundStatus.Playing ? current : null
})
const won = computed(() => state.value?.status === ERoundStatus.Won)
const pose = computed(() => {
  if (state.value?.status === ERoundStatus.Won) return EAvatarPose.Cheer
  if (state.value?.status === ERoundStatus.Lost) return EAvatarPose.Sad
  return EAvatarPose.Idle
})
const headline = computed(() => {
  if (state.value?.status === ERoundStatus.Won) return '¡Nacionalidad!'
  if (state.value?.status === ERoundStatus.Stopped) return 'Te has plantado'
  return 'Fin del viaje'
})
const where = computed(() => {
  const current = state.value
  if (current === null) return ''
  const place = `${COMUNIDADES[current.comunidadID].shortName}, parada ${current.rung} de ${ROUND_LENGTH}`
  if (current.status === ERoundStatus.Won) return '¡Has llegado a Madrid! Has acertado las 17.'
  if (current.status === ERoundStatus.Stopped) return `Te has plantado en ${place}.`
  return `Te has quedado en ${place}.`
})
const pointsNote = computed(() => {
  const current = state.value
  if (current === null || current.status !== ERoundStatus.Lost) return ''
  return current.points > 0
    ? 'Te llevas lo asegurado en la última parada segura.'
    : 'Esta vez no te llevas puntos. ¡A la próxima!'
})
const modeTitle = computed(() => (state.value === null ? '' : MODE_TEXT[state.value.mode].title))
const infoAnswer = computed(() =>
  infoIndex.value === null ? null : (state.value?.answers[infoIndex.value] ?? null)
)

function optionText(options: readonly { index: number; text: string }[], index: number): string {
  return `${optionLetter(index)} · ${options.find((o) => o.index === index)?.text ?? ''}`
}

function playAgain(): void {
  const current = state.value
  if (current !== null) void router.push(roundRoute(current.mode))
}

function goHome(): void {
  void router.push({ name: ERouteName.Home })
}

function openInfo(index: number): void {
  infoIndex.value = index
}

function closeInfo(): void {
  infoIndex.value = null
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-10 md:pt-10">
    <PixelPanel v-if="state === null" padding="lg" data-empty>
      <h1 class="font-pixel text-3xl">Resultado</h1>
      <p class="mt-2 text-base md:text-lg">Todavía no has terminado ninguna ronda.</p>
      <AppButton class="mt-4" data-action="home" @click="goHome">Inicio</AppButton>
    </PixelPanel>

    <template v-else>
      <PixelPanel padding="lg" tag="section">
        <div class="flex items-center gap-4">
          <AvatarCanvas
            :look="avatar.look"
            :pose="pose"
            :scale="5"
            animate
            label="Tu personaje"
            class="shrink-0"
          />
          <div class="min-w-0">
            <p class="font-pixel text-base text-muted">{{ modeTitle }}</p>
            <h1
              class="font-pixel text-3xl leading-tight md:text-5xl"
              :class="won ? 'text-primary' : ''"
              data-headline
            >
              {{ headline }}
            </h1>
            <p class="mt-1 text-base md:text-lg" data-where>{{ where }}</p>
          </div>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-3 font-pixel">
          <div>
            <dt class="text-base text-muted">Puntos</dt>
            <dd class="hud-number text-3xl md:text-4xl" data-points>
              {{ formatPoints(state.points) }}
            </dd>
          </div>
          <div>
            <dt class="text-base text-muted">Aciertos</dt>
            <dd class="text-3xl md:text-4xl" data-right>
              <span class="hud-number">{{ state.reached }}</span>
              <span class="text-xl text-muted"> de <span class="hud-number">17</span></span>
            </dd>
          </div>
        </dl>
        <p v-if="pointsNote" class="mt-2 text-base">{{ pointsNote }}</p>
        <p
          v-if="state.newRecord"
          class="pixel-corners-inner mt-3 inline-flex items-center gap-2 bg-safe px-3 py-1 font-pixel text-lg text-safe-ink"
          data-record
        >
          <PixelIcon :name="EPixelIcon.Star" /> ¡Nuevo récord!
        </p>
      </PixelPanel>

      <div class="grid grid-cols-2 gap-4">
        <AppButton size="lg" block data-action="again" @click="playAgain">Jugar otra vez</AppButton>
        <AppButton size="lg" variant="secondary" block data-action="home" @click="goHome">
          Inicio
        </AppButton>
      </div>

      <PixelPanel title="Tus respuestas" padding="lg" tag="section">
        <p v-if="state.answers.length === 0" class="text-base text-muted">
          No has contestado ninguna pregunta en esta ronda.
        </p>
        <ol v-else class="flex flex-col gap-3">
          <li
            v-for="(answer, i) in state.answers"
            :key="answer.questionID"
            class="flex flex-col gap-2 border-b-2 border-line pb-3 last:border-b-0 last:pb-0"
            :data-answer="answer.correct ? 'right' : 'wrong'"
          >
            <div class="flex items-center gap-2 font-pixel text-base">
              <span
                class="pixel-corners-inner grid size-7 shrink-0 place-items-center"
                :class="answer.correct ? 'bg-correct text-correct-ink' : 'bg-wrong text-wrong-ink'"
              >
                <PixelIcon
                  :name="answer.correct ? EPixelIcon.Check : EPixelIcon.Cross"
                  :label="answer.correct ? 'Correcta' : 'Incorrecta'"
                />
              </span>
              <span class="text-muted"
                >Parada <span class="hud-number">{{ answer.rung }}</span> ·
                {{ COMUNIDADES[answer.comunidadID].shortName }}</span
              >
            </div>
            <p class="text-base leading-snug">{{ answer.text }}</p>
            <p v-if="!answer.correct" class="text-sm text-muted">
              Tu respuesta: {{ optionText(answer.options, answer.chosen) }}
            </p>
            <p class="text-sm">
              <span class="font-pixel">Correcta:</span>
              {{ optionText(answer.options, answer.answer) }}
            </p>
            <div>
              <InfoButton @open="openInfo(i)" />
            </div>
          </li>
        </ol>
      </PixelPanel>

      <InfoSheet
        :open="infoAnswer !== null"
        :explanation="infoAnswer?.explanation ?? ''"
        :correct="infoAnswer?.correct ?? null"
        :answer-index="infoAnswer?.answer ?? null"
        :answer-text="infoAnswer?.options.find((o) => o.index === infoAnswer?.answer)?.text ?? ''"
        :question="infoAnswer?.text ?? ''"
        @close="closeInfo"
      />
    </template>
  </main>
</template>
