<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import AppButton from '@/shared/ui/AppButton.vue'
import BasicsSection from './sections/BasicsSection.vue'
import LadderSection from './sections/LadderSection.vue'
import LifelinesSection from './sections/LifelinesSection.vue'
import ModesSection from './sections/ModesSection.vue'
import QuestionSection from './sections/QuestionSection.vue'
import SoundSection from './sections/SoundSection.vue'

// Every component of the UI kit with example data (development builds only,
// at /#/dev). The theme buttons force light or dark on the whole page.

type Theme = 'system' | 'light' | 'dark'

const THEMES: readonly { theme: Theme; label: string }[] = [
  { theme: 'system', label: 'Sistema' },
  { theme: 'light', label: 'Claro' },
  { theme: 'dark', label: 'Oscuro' },
]

const theme = ref<Theme>('system')

function setTheme(next: Theme): void {
  theme.value = next
  if (next === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = next
}

function restoreTheme(): void {
  delete document.documentElement.dataset.theme
}

onBeforeUnmount(restoreTheme)
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 md:px-8">
    <header class="flex flex-col gap-3">
      <h1 class="font-pixel text-3xl md:text-4xl">Galería de componentes</h1>
      <p class="text-muted">Cada componente del kit, en sus estados, con datos de ejemplo.</p>
      <div class="flex flex-wrap items-center gap-3" role="group" aria-label="Tema">
        <span class="font-pixel">Tema:</span>
        <AppButton
          v-for="option in THEMES"
          :key="option.theme"
          size="sm"
          :variant="theme === option.theme ? 'accent' : 'secondary'"
          :aria-pressed="theme === option.theme"
          @click="setTheme(option.theme)"
        >
          {{ option.label }}
        </AppButton>
      </div>
    </header>
    <BasicsSection />
    <ModesSection />
    <QuestionSection />
    <LifelinesSection />
    <LadderSection />
    <SoundSection />
  </main>
</template>
