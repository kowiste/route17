<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <section class="flex flex-col gap-4 border-t-4 border-dashed border-line pt-6">
    <header>
      <h2 class="font-pixel text-2xl md:text-3xl">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-muted">{{ description }}</p>
    </header>
    <slot />
  </section>
</template>
