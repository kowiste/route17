<script setup lang="ts">
// Ajustes: her name, her character, sound and the colour theme.

import { ref, useId } from 'vue'
import type { AvatarLook } from '@/contracts/avatar'
import AvatarEditor from '@/features/avatar/view/AvatarEditor.vue'
import { useAvatarStore } from '@/features/avatar/view/avatarStore'
import { useSettingsStore } from '@/features/settings/view/settingsStore'
import { NAME_MAX_LENGTH, THEME_LABELS, THEMES, type ETheme } from '@/features/settings/view/theme'
import { EErrorCode, isAppError } from '@/shared/errors/appError'
import AppButton from '@/shared/ui/AppButton.vue'
import PixelPanel from '@/shared/ui/PixelPanel.vue'
import SoundToggle from '@/shared/ui/SoundToggle.vue'
import { friendlyError, nameError } from './errorMessage'
import ScreenHeader from './ScreenHeader.vue'

const nameSaved = ref(false)
const nameProblem = ref('')
const lookSaved = ref(false)
const lookProblem = ref('')
const nameID = useId()
const themeName = useId()

const settings = useSettingsStore()
const avatar = useAvatarStore()

const name = ref(settings.settings.name)

function saveName(): void {
  try {
    settings.rename(name.value)
    name.value = settings.settings.name
    nameProblem.value = ''
    nameSaved.value = true
  } catch (error) {
    nameSaved.value = false
    nameProblem.value =
      isAppError(error) && error.code === EErrorCode.InvalidInput
        ? nameError(NAME_MAX_LENGTH)
        : friendlyError(error)
  }
}

function onNameInput(): void {
  nameSaved.value = false
}

function saveLook(look: AvatarLook): void {
  try {
    avatar.save(look)
    lookProblem.value = ''
    lookSaved.value = true
  } catch (error) {
    lookSaved.value = false
    lookProblem.value = friendlyError(error)
  }
}

function onLookChange(): void {
  lookSaved.value = false
}

function setMuted(muted: boolean): void {
  settings.setSound(!muted)
}

function setTheme(theme: ETheme): void {
  settings.setTheme(theme)
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-10 md:pt-10">
    <ScreenHeader title="Ajustes" />

    <PixelPanel tag="section" padding="lg">
      <form class="flex flex-col gap-3" novalidate @submit.prevent="saveName">
        <label :for="nameID" class="font-pixel text-2xl">Tu nombre</label>
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            :id="nameID"
            v-model="name"
            type="text"
            name="name"
            autocomplete="given-name"
            :maxlength="NAME_MAX_LENGTH"
            :aria-invalid="nameProblem !== ''"
            class="min-h-12 w-full min-w-0 flex-1 border-4 border-frame bg-surface px-3 py-2 text-lg text-ink"
            @input="onNameInput"
          />
          <AppButton type="submit" data-action="save-name">Guardar</AppButton>
        </div>
        <p v-if="nameProblem" class="font-pixel text-base text-wrong" role="alert">
          {{ nameProblem }}
        </p>
        <p v-else-if="nameSaved" class="font-pixel text-base" role="status" data-name-saved>
          ¡Guardado!
        </p>
      </form>
    </PixelPanel>

    <PixelPanel tag="section" padding="lg">
      <AvatarEditor :look="avatar.look" @save="saveLook" @change="onLookChange" />
      <p v-if="lookProblem" class="mt-3 font-pixel text-base text-wrong" role="alert">
        {{ lookProblem }}
      </p>
      <p v-else-if="lookSaved" class="mt-3 font-pixel text-base" role="status" data-look-saved>
        ¡Personaje guardado!
      </p>
    </PixelPanel>

    <PixelPanel tag="section" padding="lg" title="Sonido" data-sound>
      <SoundToggle :muted="!settings.settings.sound" @update:muted="setMuted" />
    </PixelPanel>

    <PixelPanel tag="section" padding="lg">
      <fieldset>
        <legend class="mb-3 font-pixel text-xl leading-tight md:text-2xl">Tema</legend>
        <div class="grid grid-cols-3 gap-3" data-themes>
          <label
            v-for="theme in THEMES"
            :key="theme"
            class="flex min-h-11 cursor-pointer items-center justify-center gap-2 border-4 px-3 py-2 font-pixel text-lg has-focus-visible:outline-3 has-focus-visible:outline-focus"
            :class="
              settings.settings.theme === theme
                ? 'border-frame bg-selected text-selected-ink'
                : 'border-line bg-surface text-ink hover:border-frame'
            "
          >
            <input
              type="radio"
              class="sr-only"
              :name="themeName"
              :value="theme"
              :checked="settings.settings.theme === theme"
              :data-theme-option="theme"
              @change="setTheme(theme)"
            />
            {{ THEME_LABELS[theme] }}
          </label>
        </div>
      </fieldset>
    </PixelPanel>
  </main>
</template>
