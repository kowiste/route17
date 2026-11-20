<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppModal from '@/shared/ui/AppModal.vue'
import GameTitle from '@/shared/ui/GameTitle.vue'
import PixelIcon from '@/shared/ui/PixelIcon.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import ProgressMeter from '@/shared/ui/ProgressMeter.vue'
import { EPixelIcon } from '@/shared/ui/icons'
import type { ButtonVariant, PanelTone } from '@/shared/ui/types'
import GallerySection from '../GallerySection.vue'

const modalOpen = ref(false)
const sheetOpen = ref(false)
const clicks = ref(0)

const VARIANTS: readonly ButtonVariant[] = ['primary', 'secondary', 'accent', 'sign']
const TONES: readonly PanelTone[] = ['surface', 'alt', 'sign', 'accent', 'lcd']
const ICONS = Object.values(EPixelIcon)

function countClick(): void {
  clicks.value += 1
}
</script>

<template>
  <GallerySection title="Básicos" description="Título, botones, paneles, iconos, barra y modal.">
    <div class="flex flex-wrap items-end gap-8">
      <GameTitle tagline="Prepara el CCSE jugando" />
      <GameTitle size="md" />
    </div>

    <div class="flex flex-col gap-3">
      <div v-for="variant in VARIANTS" :key="variant" class="flex flex-wrap items-center gap-3">
        <AppButton :variant="variant" size="sm" @click="countClick">Pequeño</AppButton>
        <AppButton :variant="variant" @click="countClick">Jugar</AppButton>
        <AppButton :variant="variant" size="lg" @click="countClick">Modo juego</AppButton>
        <AppButton :variant="variant" disabled>Desactivado</AppButton>
      </div>
      <AppButton block @click="countClick">Ancho completo · {{ clicks }} clics</AppButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PixelPanel v-for="tone in TONES" :key="tone" :tone="tone" :title="`Panel ${tone}`">
        <p>Un cuadro de diálogo con bordes de píxel y esquinas escalonadas.</p>
      </PixelPanel>
      <PixelPanel :shadow="false" padding="sm">
        <p>Sin sombra, con poco relleno.</p>
      </PixelPanel>
    </div>

    <div class="flex flex-wrap items-center gap-4 text-3xl">
      <PixelIcon v-for="icon in ICONS" :key="icon" :name="icon" :label="icon" />
    </div>

    <div class="grid max-w-md gap-3">
      <ProgressMeter :value="0" :secondary="0" :max="100" label="Vacía" />
      <ProgressMeter :value="35" :secondary="60" :max="100" label="35 dominadas, 60 vistas" />
      <ProgressMeter :value="100" :max="100" label="Completa" />
    </div>

    <div class="flex flex-wrap gap-3">
      <AppButton variant="secondary" @click="modalOpen = true">Abrir modal</AppButton>
      <AppButton variant="secondary" @click="sheetOpen = true">Abrir hoja</AppButton>
    </div>
    <AppModal :open="modalOpen" title="Un modal" @close="modalOpen = false">
      <p>Se cierra con Esc, con la X, o tocando fuera.</p>
      <template #footer>
        <AppButton variant="secondary" @click="modalOpen = false">Cancelar</AppButton>
        <AppButton @click="modalOpen = false">Aceptar</AppButton>
      </template>
    </AppModal>
    <AppModal :open="sheetOpen" title="Una hoja" placement="sheet" @close="sheetOpen = false">
      <p>En el móvil sale desde abajo; en el portátil, en el centro.</p>
    </AppModal>
  </GallerySection>
</template>
