<script setup lang="ts">
// The app's frame: the current screen, or a friendly message when a screen
// breaks or can't be loaded (offline), never a blank page.

import { onErrorCaptured, shallowRef } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ErrorPanel from '@/screens/ErrorPanel.vue'
import { ERouteName } from '@/bootstrap/router'
import { logger } from '@/shared/logger/logger'

const failure = shallowRef<unknown>(null)

const router = useRouter()

function retry(): void {
  window.location.reload()
}

async function goHome(): Promise<void> {
  // Leave the broken screen first, or it would break again on the way out.
  await router.push({ name: ERouteName.Home })
  failure.value = null
}

router.onError((error) => {
  failure.value = error
  logger.error('a screen could not be loaded', { error: String(error) })
})

onErrorCaptured((error, _instance, info) => {
  failure.value = error
  logger.error('a screen failed', { error: String(error), info })
  // Shown and logged here: it goes no further.
  return false
})
</script>

<template>
  <div class="min-h-dvh bg-bg text-ink">
    <main v-if="failure !== null" class="mx-auto flex max-w-xl flex-col gap-4 p-4 pt-10">
      <ErrorPanel :error="failure" @retry="retry" @home="goHome" />
    </main>
    <RouterView v-else />
  </div>
</template>
