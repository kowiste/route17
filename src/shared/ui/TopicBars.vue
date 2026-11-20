<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressCount } from '@/contracts/deck'
import { TOPICS, type ETopic } from '@/contracts/question'
import ProgressMeter from './ProgressMeter.vue'
import { topicLabel } from './format'

// Her progress per tarea: mastered (green) and seen (yellow) out of the total.

interface Props {
  perTopic: Readonly<Record<ETopic, ProgressCount>>
}

const props = defineProps<Props>()

const rows = computed(() =>
  TOPICS.map(({ topic }) => {
    const count = props.perTopic[topic]
    const label = topicLabel(topic)
    return {
      topic,
      number: label.number,
      title: label.title,
      ...count,
      text: `${count.mastered} dominadas · ${count.seen} vistas · ${count.total} en total`,
    }
  })
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="flex flex-wrap gap-x-4 gap-y-1 font-pixel text-sm" aria-hidden="true">
      <span class="flex items-center gap-2"
        ><span class="inline-block size-3 bg-correct" />Dominadas</span
      >
      <span class="flex items-center gap-2"
        ><span class="inline-block size-3 bg-accent" />Vistas</span
      >
    </p>
    <section
      v-for="row in rows"
      :key="row.topic"
      class="flex flex-col gap-1"
      :data-topic="row.topic"
    >
      <div class="flex items-baseline justify-between gap-3">
        <h3 class="min-w-0 leading-snug">
          <span class="font-pixel text-base"
            >Tarea <span class="hud-number">{{ row.number }}</span></span
          >
          <span class="block text-sm text-muted">{{ row.title }}</span>
        </h3>
        <span class="hud-number shrink-0 text-base">{{ row.mastered }}/{{ row.total }}</span>
      </div>
      <ProgressMeter
        :value="row.mastered"
        :secondary="row.seen"
        :max="row.total"
        :label="`Tarea ${row.number}: ${row.text}`"
      />
      <p class="text-sm text-muted">{{ row.text }}</p>
    </section>
  </div>
</template>
