<script setup lang="ts">
import { ref } from 'vue'
import { ESound } from '@/shared/sound/sounds'
import { sound } from '@/shared/sound/soundPlayer'
import AppButton from '@/shared/ui/AppButton.vue'
import AudienceChart from '@/shared/ui/AudienceChart.vue'
import FriendCall from '@/shared/ui/FriendCall.vue'
import LifelineBar from '@/shared/ui/LifelineBar.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import { ELifeline } from '@/shared/ui/types'
import GallerySection from '../GallerySection.vue'
import { HEAD_OF_STATE } from '../galleryData'

const used = ref<ELifeline[]>([])
const calling = ref(true)
const hungUp = ref(0)

function spendLifeline(lifeline: ELifeline): void {
  used.value = [...used.value, lifeline]
  sound.play(ESound.Lifeline)
}

function resetLifelines(): void {
  used.value = []
}
</script>

<template>
  <GallerySection
    title="Comodines"
    description="LifelineBar, AudienceChart y FriendCall. La primera barra se puede gastar."
  >
    <div class="grid max-w-xl gap-4">
      <LifelineBar :used="used" @use="spendLifeline" />
      <AppButton variant="secondary" size="sm" class="self-start" @click="resetLifelines">
        Recuperar comodines
      </AppButton>
      <LifelineBar :used="[ELifeline.Friend]" :unavailable="[ELifeline.FiftyFifty]" />
      <LifelineBar disabled />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <PixelPanel>
        <AudienceChart :percentages="[18, 64, 18]" />
      </PixelPanel>
      <PixelPanel>
        <AudienceChart :percentages="[71, 0, 29]" :removed="[1]" caption="Tras el 50:50" />
      </PixelPanel>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <FriendCall
        friend-name="Lola"
        :calling="calling"
        message="Uf, esta la sé: lo dice la Constitución, es el rey. Ve a por la B."
        :option-index="HEAD_OF_STATE.answer"
        :option-text="HEAD_OF_STATE.options[HEAD_OF_STATE.answer] ?? ''"
        :confidence="90"
        @hang-up="hungUp += 1"
      />
      <FriendCall
        message="No lo tengo nada claro… diría la A, pero no me hagas mucho caso."
        :option-index="0"
        :option-text="HEAD_OF_STATE.options[0] ?? ''"
        :confidence="30"
        @hang-up="hungUp += 1"
      />
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <AppButton variant="secondary" size="sm" @click="calling = !calling">
        {{ calling ? 'Que conteste' : 'Volver a llamar' }}
      </AppButton>
      <span class="font-pixel text-muted">Colgadas: {{ hungUp }}</span>
    </div>
  </GallerySection>
</template>
