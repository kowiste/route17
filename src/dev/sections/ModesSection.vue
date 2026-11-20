<script setup lang="ts">
import { ref } from 'vue'
import ModeCard from '@/shared/ui/ModeCard.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import TopicBars from '@/shared/ui/TopicBars.vue'
import GallerySection from '../GallerySection.vue'
import { SUMMARY } from '../galleryData'

const started = ref('')
</script>

<template>
  <GallerySection title="Modos y progreso" description="ModeCard en sus estados y TopicBars.">
    <div class="grid gap-4 md:grid-cols-3">
      <ModeCard
        title="Modo juego"
        subtitle="Nuestras preguntas, con más chispa."
        :progress="SUMMARY"
        :best-rung="9"
        @start="started = 'Modo juego'"
      />
      <ModeCard
        title="Modo oficial"
        subtitle="Las preguntas del manual del Instituto Cervantes."
        :progress="{ seen: 0, mastered: 0, total: 300 }"
        @start="started = 'Modo oficial'"
      />
      <ModeCard
        title="Modo oficial"
        subtitle="Las preguntas del manual del Instituto Cervantes."
        disabled
        note="Pendiente: aún no hay preguntas oficiales."
      />
    </div>
    <p class="font-pixel text-muted">Último start: {{ started || '—' }}</p>
    <PixelPanel title="Por tareas" class="max-w-2xl">
      <TopicBars :per-topic="SUMMARY.perTopic" />
    </PixelPanel>
  </GallerySection>
</template>
