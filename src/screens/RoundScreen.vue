<script setup lang="ts">
// A round: the map of her route with the question panel. Phone in portrait:
// the map in its own area on top (a steady size, so its camera doesn't jump),
// the question as a scrolling sheet below it, never over it. Laptop: the map
// large on the left, the ladder and the question on the right.

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ELifeline } from '@/contracts/lifeline'
import { ERouteName, modeParam } from '@/bootstrap/router'
import { useAvatarStore } from '@/features/avatar/view/avatarStore'
import RouteMap from '@/features/map/view/RouteMap.vue'
import { useRoundStore } from '@/features/round/view/roundStore'
import { ERoundPhase, LADDER_RUNGS } from '@/features/round/view/roundView'
import AppButton from '@/shared/ui/AppButton.vue'
import AppModal from '@/shared/ui/AppModal.vue'
import PrizeLadder from '@/shared/ui/PrizeLadder.vue'
import { formatPoints } from '@/shared/ui/format'
import { useAnswerKeys } from '@/shared/ui/useAnswerKeys'
import LifelineSheet from './round/LifelineSheet.vue'
import RoundPanel from './round/RoundPanel.vue'

interface Props {
  /** The route's `:mode`: `official` or `game`. */
  mode: string
}

const props = defineProps<Props>()

/** If the map never says she arrived (a hidden tab), the next question comes anyway. */
const ARRIVAL_FALLBACK_MS = 4000

const help = ref<ELifeline | null>(null)
const helpFresh = ref(false)
const stopOpen = ref(false)
const exitOpen = ref(false)
let arrivalTimer: ReturnType<typeof setTimeout> | undefined

const router = useRouter()
const round = useRoundStore()
const avatar = useAvatarStore()

const modalOpen = computed(() => help.value !== null || stopOpen.value || exitOpen.value)
const points = computed(() => formatPoints(round.ladder.points))
const playing = computed(
  () => round.state !== null && !round.over && round.phase !== ERoundPhase.Failed
)

function start(): void {
  const mode = modeParam(props.mode)
  if (mode === null) {
    void router.replace({ name: ERouteName.Home })
    return
  }
  help.value = null
  void round.start(mode)
}

function showHelp(lifeline: ELifeline, fresh: boolean): void {
  help.value = lifeline
  helpFresh.value = fresh
}

function closeHelp(): void {
  help.value = null
  helpFresh.value = false
}

async function confirmStop(): Promise<void> {
  stopOpen.value = false
  if (await round.stop()) void router.push({ name: ERouteName.Result })
}

function requestExit(): void {
  if (playing.value) exitOpen.value = true
  else goHome()
}

function goHome(): void {
  exitOpen.value = false
  void router.push({ name: ERouteName.Home })
}

function showResult(): void {
  void router.push({ name: ERouteName.Result })
}

function clearArrivalTimer(): void {
  if (arrivalTimer !== undefined) clearTimeout(arrivalTimer)
  arrivalTimer = undefined
}

useAnswerKeys({
  optionCount: () => round.state?.question?.options.length ?? 0,
  selected: () => round.state?.selected ?? null,
  enabled: () => round.phase === ERoundPhase.Asking && !round.busy && !modalOpen.value,
  canChoose: (index) => round.state?.question?.options[index]?.removed === false,
  choose: (index) => round.choose(index),
  confirm: () => void round.confirm(),
  cancel: () => round.cancel(),
})

onMounted(start)
onBeforeUnmount(clearArrivalTimer)

watch(
  () => round.phase,
  (phase) => {
    clearArrivalTimer()
    if (phase !== ERoundPhase.Travelling) return
    arrivalTimer = setTimeout(() => {
      arrivalTimer = undefined
      round.arrived(round.mapStop)
    }, ARRIVAL_FALLBACK_MS)
  }
)
watch(() => props.mode, start)
</script>

<template>
  <div
    class="flex h-dvh flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,27rem)] lg:grid-rows-1 lg:gap-4 lg:p-4 xl:grid-cols-[minmax(0,1fr)_17rem_minmax(22rem,27rem)]"
  >
    <section
      class="relative h-[36dvh] shrink-0 border-b-4 border-frame lg:h-auto lg:min-h-0 lg:border-4"
      aria-label="Mapa de la ruta"
    >
      <div class="absolute inset-0">
        <RouteMap
          :look="avatar.look"
          :stop="round.mapStop"
          :reached="round.mapStop"
          :best="round.best"
          :state="round.traveller"
          @arrived="round.arrived"
        />
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2"
      >
        <AppButton
          class="pointer-events-auto"
          variant="secondary"
          size="sm"
          data-action="exit"
          @click="requestExit"
        >
          Salir
        </AppButton>
        <p
          class="pixel-corners-inner bg-surface px-2 py-1 font-pixel text-base text-ink xl:hidden"
          data-points
        >
          Puntos: <span class="hud-number">{{ points }}</span>
        </p>
      </div>
    </section>

    <aside class="hidden xl:block xl:min-h-0 xl:overflow-y-auto" aria-label="Escalera de premios">
      <PrizeLadder
        layout="full"
        :rungs="LADDER_RUNGS"
        :current="round.ladder.current"
        :status="round.ladder.status"
        :points="round.ladder.points"
        :safe-points="round.ladder.safePoints"
      />
    </aside>

    <section
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:p-1"
      aria-label="Pregunta"
    >
      <PrizeLadder
        class="xl:hidden"
        layout="strip"
        :rungs="LADDER_RUNGS"
        :current="round.ladder.current"
        :status="round.ladder.status"
        :points="round.ladder.points"
        :safe-points="round.ladder.safePoints"
      />
      <RoundPanel
        @stop="stopOpen = true"
        @result="showResult"
        @help="showHelp"
        @retry="start"
        @home="goHome"
      />
    </section>

    <LifelineSheet :lifeline="help" :fresh="helpFresh" @close="closeHelp" />

    <AppModal :open="stopOpen" title="¿Te plantas?" @close="stopOpen = false">
      <p class="text-base leading-relaxed md:text-lg" data-stop-text>
        <template v-if="round.ladder.points > 0">
          Te llevas <strong class="hud-number">{{ points }}</strong> puntos y el viaje termina aquí.
        </template>
        <template v-else>Aún no tienes puntos: si te plantas ahora, te vas sin nada.</template>
      </p>
      <template #footer>
        <AppButton variant="secondary" data-action="keep-playing" @click="stopOpen = false">
          Seguir jugando
        </AppButton>
        <AppButton data-action="confirm-stop" @click="confirmStop">Plantarme</AppButton>
      </template>
    </AppModal>

    <AppModal :open="exitOpen" title="¿Salir de la ronda?" @close="exitOpen = false">
      <p class="text-base leading-relaxed md:text-lg">
        Esta ronda no contará. Las preguntas que te quedaban saldrán primero la próxima vez.
      </p>
      <template #footer>
        <AppButton variant="secondary" data-action="keep-playing" @click="exitOpen = false">
          Seguir jugando
        </AppButton>
        <AppButton data-action="confirm-exit" @click="goHome">Salir</AppButton>
      </template>
    </AppModal>
  </div>
</template>
