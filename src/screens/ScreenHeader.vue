<script setup lang="ts">
// The top of a secondary screen: back to Home and the screen's title.

import { useRouter } from 'vue-router'
import { ERouteName } from '@/bootstrap/router'
import AppButton from '@/shared/ui/AppButton.vue'

interface Props {
  title: string
}

defineProps<Props>()

const router = useRouter()

function goHome(): void {
  void router.push({ name: ERouteName.Home })
}
</script>

<template>
  <header class="flex items-center gap-3">
    <AppButton variant="secondary" size="sm" data-action="back" @click="goHome">
      <span aria-hidden="true">‹</span> Inicio
    </AppButton>
    <h1 class="font-pixel text-3xl leading-tight md:text-4xl">{{ title }}</h1>
  </header>
</template>
