<script setup lang="ts">
import { computed } from 'vue'
import { COMUNIDADES } from '@/contracts/comunidad'
import { ROUND_LENGTH } from '@/contracts/route'
import PixelIcon from './PixelIcon.vue'
import PixelPanel from './PixelPanel.vue'
import { formatPoints, stopLabel, rungState } from './format'
import { EPixelIcon } from './icons'
import { ELadderStatus, ERungState, type LadderRung } from './types'

// The 17 rungs of the route with their points. `full`: the whole list, top
// rung first (the laptop's side panel). `strip`: one slim row of cells and a
// caption (the phone). `auto`: the strip on a phone, the list from md up.

interface Props {
  rungs: readonly LadderRung[]
  /** The rung of the question she is on, or the last one she played (1-based). */
  current: number
  status?: ELadderStatus
  /** Her points now; null hides them. */
  points?: number | null
  /** The points she keeps if she fails; null hides them. */
  safePoints?: number | null
  layout?: 'auto' | 'full' | 'strip'
}

const props = withDefaults(defineProps<Props>(), {
  status: ELadderStatus.Playing,
  points: null,
  safePoints: null,
  layout: 'auto',
})

const ROW: Readonly<Record<ERungState, string>> = {
  [ERungState.Ahead]: 'text-ink',
  [ERungState.Current]: 'bg-accent text-accent-ink',
  [ERungState.Done]: 'text-muted',
  [ERungState.Failed]: 'bg-wrong text-wrong-ink',
}

const CELL: Readonly<Record<ERungState, string>> = {
  [ERungState.Ahead]: 'bg-surface-alt',
  [ERungState.Current]: 'bg-accent',
  [ERungState.Done]: 'bg-correct',
  [ERungState.Failed]: 'bg-wrong',
}

const rows = computed(() =>
  props.rungs.map((rung, i) => {
    const number = i + 1
    const state = rungState(number, props.current, props.status)
    const won = props.status === ELadderStatus.Won && number === props.rungs.length
    return {
      number,
      name: COMUNIDADES[rung.comunidad].shortName,
      points: formatPoints(rung.points),
      safe: rung.safe,
      state,
      top: number === ROUND_LENGTH,
      rowClass: won ? 'bg-correct text-correct-ink' : ROW[state],
    }
  })
)

const topDown = computed(() => [...rows.value].reverse())
const currentRow = computed(() => rows.value[props.current - 1] ?? null)

const stripLabel = computed(() => {
  const row = currentRow.value
  if (row === null) return 'Ruta'
  return `${stopLabel(row.number)}, ${row.name}, ${row.points} puntos`
})
</script>

<template>
  <div class="min-w-0">
    <div v-if="layout !== 'full'" data-layout="strip" :class="layout === 'auto' ? 'md:hidden' : ''">
      <div role="img" :aria-label="stripLabel" class="flex flex-col gap-1">
        <div class="flex gap-[2px] px-(--pixel)">
          <span
            v-for="row in rows"
            :key="row.number"
            class="flex h-[0.7rem] flex-1 justify-center text-[0.7rem] text-ink"
          >
            <PixelIcon v-if="row.safe" :name="EPixelIcon.Flag" />
            <PixelIcon v-else-if="row.top" :name="EPixelIcon.Star" />
          </span>
        </div>
        <div class="pixel-corners flex gap-[2px] bg-frame p-(--pixel)">
          <span
            v-for="row in rows"
            :key="row.number"
            class="h-[calc(var(--pixel)*3)] flex-1"
            :class="CELL[row.state]"
            :data-state="row.state"
          />
        </div>
      </div>
      <p class="mt-1 flex flex-wrap justify-between gap-x-3 font-pixel text-sm">
        <span v-if="currentRow !== null"
          ><span class="hud-number">{{ currentRow.number }}/{{ ROUND_LENGTH }}</span> ·
          {{ currentRow.name }} · <span class="hud-number">{{ currentRow.points }}</span></span
        >
        <span v-if="safePoints !== null" class="text-muted"
          >Asegurado: <span class="hud-number">{{ formatPoints(safePoints) }}</span></span
        >
      </p>
    </div>

    <div
      v-if="layout !== 'strip'"
      data-layout="full"
      :class="layout === 'auto' ? 'hidden md:block' : ''"
    >
      <PixelPanel padding="sm">
        <ol aria-label="Ruta y puntos" class="flex flex-col font-pixel">
          <li
            v-for="row in topDown"
            :key="row.number"
            class="flex items-center gap-2 px-2 py-0.5 text-base leading-snug"
            :class="row.rowClass"
            :aria-current="row.state === ERungState.Current ? 'step' : undefined"
            :data-state="row.state"
          >
            <span
              class="hud-number w-7 shrink-0 text-right"
              :class="row.safe ? 'pixel-corners-inner bg-safe pr-1 text-safe-ink' : ''"
              >{{ row.number }}</span
            >
            <span class="min-w-0 flex-1 truncate">{{ row.name }}</span>
            <PixelIcon v-if="row.safe" :name="EPixelIcon.Flag" label="Parada segura" />
            <PixelIcon v-if="row.top" :name="EPixelIcon.Star" label="¡Nacionalidad!" />
            <span class="hud-number">{{ row.points }}</span>
          </li>
        </ol>
        <div
          v-if="points !== null || safePoints !== null"
          class="mt-2 flex flex-wrap justify-between gap-x-3 border-t-2 border-line px-2 pt-2 font-pixel text-sm"
        >
          <span v-if="points !== null"
            >Puntos: <span class="hud-number">{{ formatPoints(points) }}</span></span
          >
          <span v-if="safePoints !== null" class="text-muted"
            >Asegurado: <span class="hud-number">{{ formatPoints(safePoints) }}</span></span
          >
        </div>
      </PixelPanel>
    </div>
  </div>
</template>
