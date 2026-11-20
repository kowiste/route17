<script setup lang="ts">
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import PrizeLadder from '@/shared/ui/PrizeLadder.vue'
import { ELadderStatus } from '@/shared/ui/types'
import GallerySection from '../GallerySection.vue'
import { LADDER } from '../galleryData'
</script>

<template>
  <GallerySection
    title="Escalera"
    description="PrizeLadder: la lista entera (portátil) y la tira (móvil), en cada estado. La primera cambia sola con el ancho."
  >
    <div class="grid gap-6 md:grid-cols-2">
      <div class="flex flex-col gap-2">
        <h3 class="font-pixel text-lg">Automática · jugando, parada 6</h3>
        <PrizeLadder :rungs="LADDER" :current="6" :points="1000" :safe-points="1000" />
      </div>
      <div class="flex flex-col gap-2">
        <h3 class="font-pixel text-lg">Lista · perdida en la parada 8</h3>
        <PrizeLadder
          :rungs="LADDER"
          :current="8"
          :status="ELadderStatus.Lost"
          :points="1000"
          layout="full"
        />
      </div>
      <div class="flex flex-col gap-2">
        <h3 class="font-pixel text-lg">Lista · ¡ganada!</h3>
        <PrizeLadder
          :rungs="LADDER"
          :current="17"
          :status="ELadderStatus.Won"
          :points="100000"
          layout="full"
        />
      </div>
      <div class="flex flex-col gap-4">
        <h3 class="font-pixel text-lg">Tira · en cada estado</h3>
        <PixelPanel padding="sm">
          <PrizeLadder :rungs="LADDER" :current="1" :safe-points="0" layout="strip" />
        </PixelPanel>
        <PixelPanel padding="sm">
          <PrizeLadder :rungs="LADDER" :current="11" :safe-points="7500" layout="strip" />
        </PixelPanel>
        <PixelPanel padding="sm">
          <PrizeLadder
            :rungs="LADDER"
            :current="8"
            :status="ELadderStatus.Lost"
            :safe-points="1000"
            layout="strip"
          />
        </PixelPanel>
        <PixelPanel padding="sm">
          <PrizeLadder
            :rungs="LADDER"
            :current="12"
            :status="ELadderStatus.Stopped"
            layout="strip"
          />
        </PixelPanel>
        <PixelPanel padding="sm">
          <PrizeLadder :rungs="LADDER" :current="17" :status="ELadderStatus.Won" layout="strip" />
        </PixelPanel>
      </div>
    </div>
  </GallerySection>
</template>
