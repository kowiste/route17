<script setup lang="ts">
// The first time she opens the game: her name, then her character, then Home.

import { computed, nextTick, onMounted, ref, shallowRef, useId } from 'vue'
import { useRouter } from 'vue-router'
import type { AvatarLook } from '@/contracts/avatar'
import { ERouteName } from '@/bootstrap/router'
import AvatarEditor from '@/features/avatar/view/AvatarEditor.vue'
import { useAvatarStore } from '@/features/avatar/view/avatarStore'
import { greeting } from '@/features/home/view/homeText'
import { useSettingsStore } from '@/features/settings/view/settingsStore'
import { NAME_MAX_LENGTH } from '@/features/settings/view/theme'
import { EErrorCode, isAppError } from '@/shared/errors/appError'
import AppButton from '@/shared/ui/AppButton.vue'
import GameTitle from '@/shared/ui/GameTitle.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import { friendlyError, nameError } from './errorMessage'

type WelcomeStep = 'name' | 'character'

const step = ref<WelcomeStep>('name')
const nameInput = ref<HTMLInputElement | null>(null)
const nameProblem = ref('')
const problem = ref('')
const inputID = useId()
const hintID = useId()

const router = useRouter()
const settings = useSettingsStore()
const avatar = useAvatarStore()

const name = ref(settings.settings.name)
const draft = shallowRef<AvatarLook>(avatar.look)

const hello = computed(() => greeting(settings.settings.name))

function submitName(): void {
  try {
    settings.rename(name.value)
    nameProblem.value = ''
    step.value = 'character'
  } catch (error) {
    nameProblem.value =
      isAppError(error) && error.code === EErrorCode.InvalidInput
        ? nameError(NAME_MAX_LENGTH)
        : friendlyError(error)
  }
}

function onLookChange(look: AvatarLook): void {
  draft.value = look
}

function onLookCancel(): void {
  draft.value = avatar.look
}

function back(): void {
  step.value = 'name'
  void nextTick(() => nameInput.value?.focus())
}

function finish(look: AvatarLook = draft.value): void {
  try {
    avatar.save(look)
    settings.finishWelcome()
    void router.push({ name: ERouteName.Home })
  } catch (error) {
    problem.value = friendlyError(error)
  }
}

onMounted(() => nameInput.value?.focus())
</script>

<template>
  <main class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-10 md:pt-10">
    <header class="flex justify-center">
      <GameTitle size="md" tagline="Prepara la prueba CCSE jugando" />
    </header>

    <PixelPanel v-if="step === 'name'" tag="section" padding="lg" data-step="name">
      <form class="flex flex-col gap-4" novalidate @submit.prevent="submitName">
        <label :for="inputID" class="font-pixel text-2xl leading-tight md:text-3xl">
          ¿Cómo te llamas?
        </label>
        <p :id="hintID" class="text-base text-muted">
          Así te saludaremos en el juego. Puedes cambiarlo luego en Ajustes.
        </p>
        <input
          :id="inputID"
          ref="nameInput"
          v-model="name"
          type="text"
          name="name"
          autocomplete="given-name"
          :maxlength="NAME_MAX_LENGTH"
          :aria-describedby="hintID"
          :aria-invalid="nameProblem !== ''"
          class="min-h-12 w-full border-4 border-frame bg-surface px-3 py-2 text-lg text-ink"
        />
        <p v-if="nameProblem" class="font-pixel text-base text-wrong" role="alert">
          {{ nameProblem }}
        </p>
        <div class="flex justify-end">
          <AppButton type="submit" size="lg" data-action="next">Siguiente</AppButton>
        </div>
      </form>
    </PixelPanel>

    <section v-else class="flex flex-col gap-4" data-step="character">
      <PixelPanel tone="alt" padding="md">
        <p class="font-pixel text-2xl leading-tight md:text-3xl">{{ hello }}</p>
        <p class="mt-1 text-base md:text-lg">
          Así vas a viajar por el mapa de España. Elige tu personaje:
        </p>
      </PixelPanel>
      <PixelPanel padding="lg">
        <AvatarEditor
          :look="avatar.look"
          @change="onLookChange"
          @save="finish"
          @cancel="onLookCancel"
        />
      </PixelPanel>
      <p v-if="problem" class="font-pixel text-base text-wrong" role="alert">{{ problem }}</p>
      <div class="flex flex-wrap justify-between gap-3">
        <AppButton variant="secondary" data-action="back" @click="back">Atrás</AppButton>
        <AppButton size="lg" data-action="finish" @click="finish()">¡A jugar!</AppButton>
      </div>
    </section>
  </main>
</template>
