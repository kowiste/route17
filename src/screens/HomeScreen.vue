<script setup lang="ts">
// Home: the title, her character with a greeting, the two modes with her
// progress and record, and the way to Progreso and Ajustes.

import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EAvatarPose } from '@/contracts/avatar'
import { ERouteName, roundRoute } from '@/bootstrap/router'
import AvatarCanvas from '@/features/avatar/view/AvatarCanvas.vue'
import { useAvatarStore } from '@/features/avatar/view/avatarStore'
import type { ModeOverview } from '@/features/home/domain/modeOverview'
import { useHomeStore } from '@/features/home/view/homeStore'
import { greeting, MODE_TEXT } from '@/features/home/view/homeText'
import { useSettingsStore } from '@/features/settings/view/settingsStore'
import AppButton from '@/shared/ui/AppButton.vue'
import GameTitle from '@/shared/ui/GameTitle.vue'
import ModeCard from '@/shared/ui/ModeCard.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import ErrorPanel from './ErrorPanel.vue'

const router = useRouter()
const home = useHomeStore()
const avatar = useAvatarStore()
const settings = useSettingsStore()

const hello = computed(() => greeting(settings.settings.name))

function note(mode: ModeOverview): string {
  return mode.playable ? '' : 'Pendiente'
}

function subtitle(mode: ModeOverview): string {
  const text = MODE_TEXT[mode.mode].subtitle
  const title = mode.setTitle
  return title === null || title === MODE_TEXT[mode.mode].title ? text : `${text} (${title})`
}

function play(mode: ModeOverview): void {
  if (mode.playable) void router.push(roundRoute(mode.mode))
}

function open(name: ERouteName): void {
  void router.push({ name })
}

function reload(): void {
  void home.load()
}

onMounted(reload)
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-6 pb-10 md:gap-8 md:pt-10">
    <header class="flex flex-col items-center gap-4">
      <GameTitle tagline="Tu ruta hacia la nacionalidad" />
    </header>

    <PixelPanel tone="alt" padding="md">
      <div class="flex items-center gap-4">
        <AvatarCanvas
          :look="avatar.look"
          :pose="EAvatarPose.Idle"
          :scale="5"
          animate
          label="Tu personaje"
          class="shrink-0"
        />
        <div class="min-w-0">
          <p class="font-pixel text-2xl leading-tight md:text-3xl" data-greeting>{{ hello }}</p>
          <p class="mt-1 text-base text-muted md:text-lg">
            17 preguntas, 17 comunidades. ¿Llegas hoy a Madrid?
          </p>
        </div>
      </div>
    </PixelPanel>

    <ErrorPanel v-if="home.error !== null" :error="home.error" :home="false" @retry="reload" />
    <p
      v-else-if="home.loading && home.modes.length === 0"
      class="text-center font-pixel text-lg text-muted"
      aria-live="polite"
    >
      Cargando preguntas…
    </p>
    <section v-else class="grid gap-6 md:grid-cols-2" aria-label="Modos de juego">
      <ModeCard
        v-for="mode in home.modes"
        :key="mode.mode"
        :title="MODE_TEXT[mode.mode].title"
        :subtitle="subtitle(mode)"
        :progress="mode.progress"
        :best-rung="mode.best"
        :disabled="!mode.playable"
        :note="note(mode)"
        :data-mode="mode.mode"
        @start="play(mode)"
      />
    </section>

    <nav class="grid grid-cols-2 gap-4 md:mx-auto md:w-full md:max-w-md" aria-label="Más">
      <AppButton variant="sign" block data-action="progress" @click="open(ERouteName.Progress)">
        Progreso
      </AppButton>
      <AppButton
        variant="secondary"
        block
        data-action="settings"
        @click="open(ERouteName.Settings)"
      >
        Ajustes
      </AppButton>
    </nav>
  </main>
</template>
