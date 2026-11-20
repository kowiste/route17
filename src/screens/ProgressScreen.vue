<script setup lang="ts">
// Her progress per mode: seen and mastered overall and per tarea, rounds
// played, the cycle she is on; and starting a mode's questions over.

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { EMode } from '@/contracts/question'
import { ERouteName } from '@/bootstrap/router'
import { MODE_TEXT } from '@/features/home/view/homeText'
import { useProgressStore, type ModeProgress } from '@/features/progress/view/progressStore'
import AppButton from '@/shared/ui/AppButton.vue'
import AppModal from '@/shared/ui/AppModal.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import ProgressMeter from '@/shared/ui/ProgressMeter.vue'
import TopicBars from '@/shared/ui/TopicBars.vue'
import ErrorPanel from './ErrorPanel.vue'
import ScreenHeader from './ScreenHeader.vue'

/** The mode she asked to start over, waiting for her confirm. */
const resetMode = ref<EMode | null>(null)
const resetting = ref(false)

const router = useRouter()
const progress = useProgressStore()

const resetTitle = computed(() =>
  resetMode.value === null ? '' : MODE_TEXT[resetMode.value].title
)

function overall(entry: ModeProgress): string {
  const summary = entry.summary
  if (summary === null) return ''
  return `${summary.mastered} de ${summary.total} dominadas · ${summary.seen} vistas`
}

function askReset(mode: EMode): void {
  resetMode.value = mode
}

function cancelReset(): void {
  resetMode.value = null
}

async function confirmReset(): Promise<void> {
  const mode = resetMode.value
  if (mode === null) return
  resetting.value = true
  await progress.reset(mode)
  resetting.value = false
  resetMode.value = null
}

function reload(): void {
  void progress.load()
}

function goHome(): void {
  void router.push({ name: ERouteName.Home })
}

onMounted(reload)
</script>

<template>
  <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-10 md:pt-10">
    <ScreenHeader title="Progreso" />

    <ErrorPanel
      v-if="progress.error !== null"
      :error="progress.error"
      @retry="reload"
      @home="goHome"
    />
    <p
      v-else-if="progress.loading && progress.modes.length === 0"
      class="font-pixel text-lg text-muted"
      aria-live="polite"
    >
      Cargando tu progreso…
    </p>

    <PixelPanel
      v-for="entry in progress.modes"
      :key="entry.mode"
      tag="section"
      padding="lg"
      :title="MODE_TEXT[entry.mode].title"
      :data-mode="entry.mode"
    >
      <p v-if="entry.set === null || entry.summary === null" class="text-base" data-pending>
        <span class="font-pixel">Pendiente:</span> todavía no hay preguntas de este modo.
      </p>
      <div v-else class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <p class="text-sm text-muted">{{ entry.set.title }}</p>
          <ProgressMeter
            :value="entry.summary.mastered"
            :secondary="entry.summary.seen"
            :max="entry.summary.total"
            :label="overall(entry)"
          />
          <p class="text-base" data-overall>{{ overall(entry) }}</p>
        </div>
        <dl class="grid grid-cols-2 gap-3 font-pixel">
          <div>
            <dt class="text-sm text-muted">Rondas jugadas</dt>
            <dd class="hud-number text-2xl" data-rounds>{{ entry.summary.roundsPlayed }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">Vuelta al temario</dt>
            <dd class="hud-number text-2xl" data-cycle>{{ entry.summary.cycle }}</dd>
          </div>
        </dl>
        <TopicBars :per-topic="entry.summary.perTopic" />
        <div>
          <AppButton
            variant="secondary"
            size="sm"
            data-action="reset"
            @click="askReset(entry.mode)"
          >
            Empezar de cero
          </AppButton>
        </div>
      </div>
    </PixelPanel>

    <AppModal :open="resetMode !== null" title="¿Empezar de cero?" @close="cancelReset">
      <p class="text-base leading-relaxed md:text-lg">
        Se borrará lo que has visto y dominado en el {{ resetTitle }}: volverás a ver todas sus
        preguntas desde el principio. Tu récord se mantiene.
      </p>
      <template #footer>
        <AppButton variant="secondary" data-action="cancel-reset" @click="cancelReset">
          Cancelar
        </AppButton>
        <AppButton :disabled="resetting" data-action="confirm-reset" @click="confirmReset">
          Sí, empezar de cero
        </AppButton>
      </template>
    </AppModal>
  </main>
</template>
