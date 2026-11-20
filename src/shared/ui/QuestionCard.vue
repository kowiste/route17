<script setup lang="ts">
import { computed, useId } from 'vue'
import { COMUNIDADES, type EComunidadID } from '@/contracts/comunidad'
import type { ETopic } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import PixelPanel from './PixelPanel.vue'
import { topicLabel } from './format'

// The question box: where she is, the tarea, the question; the options go in
// the default slot (AnswerOption), the confirm bar or the ⓘ in `footer`.

interface Props {
  topic: ETopic
  /** 1-17. */
  rung: number
  comunidad: EComunidadID
  question: string
}

const props = defineProps<Props>()

const questionID = useId()

const topic = computed(() => topicLabel(props.topic))
const comunidadName = computed(() => COMUNIDADES[props.comunidad].shortName)
</script>

<template>
  <PixelPanel tag="section" padding="lg" :aria-labelledby="questionID">
    <header class="mb-3 flex flex-wrap items-center justify-between gap-2 font-pixel">
      <p class="flex flex-wrap items-baseline gap-x-2 text-base md:text-lg" data-stop>
        <span class="text-muted">Parada</span>
        <span class="hud-number"
          >{{ rung }}<span class="text-muted">/{{ ROUND_LENGTH }}</span></span
        >
        <span class="text-muted" aria-hidden="true">·</span>
        <span>{{ comunidadName }}</span>
      </p>
      <p
        class="pixel-corners-inner bg-sign px-2 py-0.5 text-sm text-sign-ink md:text-base"
        :title="topic.title"
      >
        Tarea <span class="hud-number">{{ topic.number }}</span> · {{ topic.short }}
      </p>
    </header>
    <p :id="questionID" class="mb-4 text-lg leading-snug font-medium md:mb-5 md:text-xl">
      {{ question }}
    </p>
    <div role="group" :aria-labelledby="questionID" class="flex flex-col gap-3">
      <slot />
    </div>
    <div v-if="$slots.footer" class="mt-4 md:mt-5">
      <slot name="footer" />
    </div>
  </PixelPanel>
</template>
