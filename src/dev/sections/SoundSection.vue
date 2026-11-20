<script setup lang="ts">
import { ref } from 'vue'
import { ESound } from '@/shared/sound/sounds'
import { sound } from '@/shared/sound/soundPlayer'
import AppButton from '@/shared/ui/AppButton.vue'
import SoundToggle from '@/shared/ui/SoundToggle.vue'
import GallerySection from '../GallerySection.vue'

const muted = ref(sound.muted)

const NAMES: Readonly<Record<ESound, string>> = {
  [ESound.Select]: 'Elegir',
  [ESound.Confirm]: 'Confirmar',
  [ESound.Correct]: 'Acierto',
  [ESound.Wrong]: 'Fallo',
  [ESound.Step]: 'Paso',
  [ESound.Lifeline]: 'Comodín',
  [ESound.Win]: 'Victoria',
}

function setMuted(value: boolean): void {
  muted.value = value
  sound.setMuted(value)
}

function play(effect: ESound): void {
  sound.play(effect)
}
</script>

<template>
  <GallerySection title="Sonido" description="Sonidos chiptune con Web Audio y el interruptor.">
    <SoundToggle :muted="muted" class="self-start" @update:muted="setMuted" />
    <div class="flex flex-wrap gap-3">
      <AppButton
        v-for="effect in Object.values(ESound)"
        :key="effect"
        variant="sign"
        size="sm"
        @click="play(effect)"
      >
        {{ NAMES[effect] }}
      </AppButton>
    </div>
  </GallerySection>
</template>
