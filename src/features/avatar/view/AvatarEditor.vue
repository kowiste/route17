<script setup lang="ts">
// Her character's editor: skin, hairstyle, hair colour, facial hair, cheeks and
// outfit, with a live preview. Every part is a free choice of features; there
// is no gender choice. It edits a draft; "Guardar" hands the look to the parent
// to save.

import { computed, ref, useId, watch } from 'vue'
import { EAvatarPose, type AvatarLook } from '@/contracts/avatar'
import { PIXEL_PALETTE, type PixelColor } from '@/shared/pixel/palette'
import { HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS } from '@/shared/pixel/sprites'
import { AVATAR_CHOICES, changeLook, defaultLook, sameLook } from '../domain/avatarLook'
import AvatarCanvas from './AvatarCanvas.vue'
import {
  blushLabel,
  FACIAL_HAIR_LABELS,
  HAIR_COLOR_LABELS,
  HAIR_STYLE_LABELS,
  OUTFIT_LABELS,
  SKIN_LABELS,
} from './avatarLabels'

interface Props {
  /** Her saved look: the editor starts from it. */
  look: AvatarLook
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Every pick, with the whole new look (for a live preview elsewhere). */
  change: [look: AvatarLook]
  /** "Guardar": the look to save. */
  save: [look: AvatarLook]
  /** "Cancelar": the draft is back to the saved look. */
  cancel: []
}>()

const titleID = useId()
const draft = ref<AvatarLook>(props.look)

const changed = computed(() => !sameLook(draft.value, props.look))
const isDefault = computed(() => sameLook(draft.value, defaultLook()))

function pick(change: Partial<AvatarLook>): void {
  draft.value = changeLook(draft.value, change)
  emit('change', draft.value)
}

function swatch(color: PixelColor): { backgroundColor: string } {
  return { backgroundColor: PIXEL_PALETTE[color] }
}

function optionClass(selected: boolean): string {
  return selected
    ? 'border-frame bg-selected text-selected-ink'
    : 'border-line bg-surface text-ink hover:border-frame hover:bg-surface-alt'
}

function onDefault(): void {
  pick(defaultLook())
}

function onCancel(): void {
  draft.value = props.look
  emit('cancel')
}

function onSave(): void {
  emit('save', draft.value)
}

watch(
  () => props.look,
  (look) => {
    draft.value = look
  }
)
</script>

<template>
  <section class="text-ink" :aria-labelledby="titleID">
    <h2 :id="titleID" class="font-pixel text-2xl">Tu personaje</h2>

    <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        class="flex shrink-0 items-center justify-center self-center border-4 border-frame bg-surface-alt p-4 sm:self-start"
      >
        <AvatarCanvas :look="draft" :scale="8" animate label="Vista previa de tu personaje" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <fieldset>
          <legend class="font-pixel text-lg">Piel</legend>
          <div class="mt-1 flex flex-wrap gap-2">
            <button
              v-for="tone in AVATAR_CHOICES.skin"
              :key="tone"
              type="button"
              class="size-11 touch-manipulation border-4 p-1"
              :class="optionClass(draft.skin === tone)"
              :aria-pressed="draft.skin === tone"
              :aria-label="SKIN_LABELS[tone]"
              :title="SKIN_LABELS[tone]"
              :data-test="`skin-${tone}`"
              @click="pick({ skin: tone })"
            >
              <span
                class="block size-full border-2 border-frame"
                :style="swatch(SKIN_COLORS[tone].base)"
              />
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-pixel text-lg">Peinado</legend>
          <div class="mt-1 flex flex-wrap gap-2">
            <button
              v-for="style in AVATAR_CHOICES.hairStyle"
              :key="style"
              type="button"
              class="flex min-w-16 touch-manipulation flex-col items-center gap-1 border-4 px-2 py-1"
              :class="optionClass(draft.hairStyle === style)"
              :aria-pressed="draft.hairStyle === style"
              :data-test="`hair-style-${style}`"
              @click="pick({ hairStyle: style })"
            >
              <AvatarCanvas
                :look="{ ...draft, hairStyle: style }"
                :pose="EAvatarPose.Idle"
                :scale="2"
                :label="HAIR_STYLE_LABELS[style]"
              />
              <span class="font-pixel text-sm">{{ HAIR_STYLE_LABELS[style] }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-pixel text-lg">Color de pelo</legend>
          <div class="mt-1 flex flex-wrap gap-2">
            <button
              v-for="color in AVATAR_CHOICES.hairColor"
              :key="color"
              type="button"
              class="size-11 touch-manipulation border-4 p-1"
              :class="optionClass(draft.hairColor === color)"
              :aria-pressed="draft.hairColor === color"
              :aria-label="HAIR_COLOR_LABELS[color]"
              :title="HAIR_COLOR_LABELS[color]"
              :data-test="`hair-color-${color}`"
              @click="pick({ hairColor: color })"
            >
              <span
                class="block size-full border-2 border-frame"
                :style="swatch(HAIR_COLORS[color].base)"
              />
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-pixel text-lg">Barba y bigote</legend>
          <div class="mt-1 flex flex-wrap gap-2">
            <button
              v-for="facialHair in AVATAR_CHOICES.facialHair"
              :key="facialHair"
              type="button"
              class="flex min-w-16 touch-manipulation flex-col items-center gap-1 border-4 px-2 py-1"
              :class="optionClass(draft.facialHair === facialHair)"
              :aria-pressed="draft.facialHair === facialHair"
              :data-test="`facial-hair-${facialHair}`"
              @click="pick({ facialHair })"
            >
              <AvatarCanvas
                :look="{ ...draft, facialHair }"
                :pose="EAvatarPose.Idle"
                :scale="2"
                :label="FACIAL_HAIR_LABELS[facialHair]"
              />
              <span class="font-pixel text-sm">{{ FACIAL_HAIR_LABELS[facialHair] }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-pixel text-lg">Colorete</legend>
          <div class="mt-1 flex flex-wrap gap-2">
            <button
              v-for="blush in AVATAR_CHOICES.blush"
              :key="String(blush)"
              type="button"
              class="flex min-w-16 touch-manipulation flex-col items-center gap-1 border-4 px-2 py-1"
              :class="optionClass(draft.blush === blush)"
              :aria-pressed="draft.blush === blush"
              :data-test="`blush-${blush ? 'on' : 'off'}`"
              @click="pick({ blush })"
            >
              <AvatarCanvas
                :look="{ ...draft, blush }"
                :pose="EAvatarPose.Idle"
                :scale="2"
                :label="blushLabel(blush)"
              />
              <span class="font-pixel text-sm">{{ blush ? 'Sí' : 'No' }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-pixel text-lg">Ropa</legend>
          <div class="mt-1 flex flex-wrap gap-2">
            <button
              v-for="outfit in AVATAR_CHOICES.outfit"
              :key="outfit"
              type="button"
              class="size-11 touch-manipulation border-4 p-1"
              :class="optionClass(draft.outfit === outfit)"
              :aria-pressed="draft.outfit === outfit"
              :aria-label="OUTFIT_LABELS[outfit]"
              :title="OUTFIT_LABELS[outfit]"
              :data-test="`outfit-${outfit}`"
              @click="pick({ outfit })"
            >
              <span
                class="block size-full border-2 border-frame"
                :style="swatch(OUTFIT_COLORS[outfit].base)"
              />
            </button>
          </div>
        </fieldset>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap justify-end gap-2">
      <button
        type="button"
        class="min-h-11 touch-manipulation border-4 border-frame bg-surface px-4 py-2 font-pixel text-lg text-ink hover:bg-surface-alt disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
        :disabled="isDefault"
        data-test="default"
        @click="onDefault"
      >
        Por defecto
      </button>
      <button
        type="button"
        class="min-h-11 touch-manipulation border-4 border-frame bg-surface px-4 py-2 font-pixel text-lg text-ink hover:bg-surface-alt"
        data-test="cancel"
        @click="onCancel"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="min-h-11 touch-manipulation border-4 border-frame bg-primary px-4 py-2 font-pixel text-lg text-primary-ink hover:brightness-110 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-alt disabled:text-muted"
        :disabled="!changed"
        data-test="save"
        @click="onSave"
      >
        Guardar
      </button>
    </div>
  </section>
</template>
