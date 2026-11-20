<script setup lang="ts">
// The low-poly map of Spain with her route: flat comunidades in SVG, the
// stops, landmarks, flags and her character in pixel art on top. When `stop`
// goes up by one she travels that leg (on foot, by boat or by plane) and
// `arrived` fires at the end; any other change moves her there at once.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { AvatarLook } from '@/contracts/avatar'
import { PIXEL_PALETTE } from '@/shared/pixel/palette'
import { EComunidadID } from '@/contracts/comunidad'
import { type Leg, legInto, LEGS } from '../domain/legs'
import type { MapPoint, MapRegionID, MapRing } from '../domain/lowPolyMap'
import { type LegPath, legMarks, legPath } from '../domain/path'
import { LEG_DURATION_MS, travelFrame } from '../domain/timeline'
import { spainLowPoly } from '../infra/spainLowPoly'
import { cameraFor } from './camera'
import { MAP_COLORS, REGION_COLORS, SPRITE_PIXEL } from './mapStyle'
import PixelSprite from './PixelSprite.vue'
import { buildScene, clampStop, mapLabel, routeView, type TravellerState } from './scene'
import { seaSparkles } from './sparkles'
import { useMapClock } from './useMapClock'

interface Props {
  look: AvatarLook
  /** Where she is: 0–16, an index in ROUTE. */
  stop: number
  /** The furthest stop this round. */
  reached: number
  /** Her furthest stop ever (marked with a gold frame); -1 for none. */
  best: number
  state: TravellerState
}

const props = defineProps<Props>()

const emit = defineEmits<{ arrived: [stop: number] }>()

interface Trip {
  readonly leg: Leg
  readonly path: LegPath
  readonly startedAt: number
}

const root = ref<HTMLElement | null>(null)
const size = ref({ width: 0, height: 0, devicePixelRatio: 1 })
const shownStop = ref(clampStop(props.stop))
const trip = shallowRef<Trip | null>(null)
const map = spainLowPoly()
const paths: readonly LegPath[] = LEGS.map((leg) => legPath(map, leg))
const marks = LEGS.map((leg, i) => legMarks(map, leg, paths[i] ?? []))
let observer: ResizeObserver | undefined

const BIG = 4000
const regionShapes = (Object.entries(map.regions) as [MapRegionID, readonly MapRing[]][]).map(
  ([id, rings]) => ({ id, d: pathData(rings), fill: PIXEL_PALETTE[REGION_COLORS[id]] })
)
const mainland = regionShapes.filter((shape) => shape.id !== EComunidadID.Canarias)
const canarias = regionShapes.filter((shape) => shape.id === EComunidadID.Canarias)
const abroad = pathData(map.abroad)
const colors = Object.fromEntries(
  Object.entries(MAP_COLORS).map(([name, color]) => [name, PIXEL_PALETTE[color]])
) as Record<keyof typeof MAP_COLORS, string>

const clock = useMapClock({
  isMoving: () => trip.value !== null,
  ambientMs: () => (props.state === 'won' ? 120 : 250),
  onFrame: finishTripIfDone,
})

const animationTime = computed(() => (clock.reducedMotion.value ? 0 : clock.now.value))
const travel = computed(() => {
  const current = trip.value
  if (current === null) return null
  const frame = travelFrame(map, current.leg, current.path, clock.now.value - current.startedAt)
  return { leg: current.leg, frame }
})
const sceneInput = computed(() => ({
  map,
  look: props.look,
  at: shownStop.value,
  reached: props.reached,
  best: props.best,
  state: props.state,
  travel: travel.value,
  timeMs: animationTime.value,
}))
const scene = computed(() => buildScene(sceneInput.value))
const route = computed(() => routeView(marks, sceneInput.value))
const sparkles = computed(() => seaSparkles(map, animationTime.value))
const camera = computed(() => cameraFor(size.value, map, scene.value.focus))
const viewBox = computed(() => {
  const { x, y, width, height } = camera.value.viewBox
  return [x, y, width, height].map((value) => Math.round(value * 100) / 100).join(' ')
})
const label = computed(() =>
  mapLabel(shownStop.value, props.state, trip.value === null ? undefined : trip.value.leg.index + 1)
)
const record = computed(() => {
  const box = scene.value.record
  if (box === null) return null
  const pad = SPRITE_PIXEL
  return {
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + 2 * pad,
    height: box.height + 2 * pad,
  }
})

function pathData(rings: readonly MapRing[]): string {
  return rings.map((ring) => `M${ring.map((p) => `${p.x} ${p.y}`).join('L')}Z`).join('')
}

function points(list: readonly MapPoint[]): string {
  return list.map((p) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`).join(' ')
}

function finishTripIfDone(now: number): void {
  const current = trip.value
  if (current === null || now - current.startedAt < LEG_DURATION_MS) return
  trip.value = null
  shownStop.value = current.leg.index + 1
  emit('arrived', shownStop.value)
}

function moveTo(stop: number): void {
  const current = trip.value
  if (current !== null) {
    // A new move before the last one ended: she lands where that one was going.
    trip.value = null
    shownStop.value = current.leg.index + 1
  }
  const next = clampStop(stop)
  if (next === shownStop.value) return
  const leg = legInto(next)
  const path = leg === undefined ? undefined : paths[leg.index]
  if (
    next === shownStop.value + 1 &&
    leg !== undefined &&
    path !== undefined &&
    !clock.reducedMotion.value
  ) {
    const startedAt = performance.now()
    clock.now.value = startedAt
    trip.value = { leg, path, startedAt }
    clock.wake()
    return
  }
  shownStop.value = next
  emit('arrived', next)
}

function measure(): void {
  const element = root.value
  if (element === null) return
  size.value = {
    width: element.clientWidth,
    height: element.clientHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  }
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'function' && root.value !== null) {
    observer = new ResizeObserver(measure)
    observer.observe(root.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

watch(() => props.stop, moveTo)
watch(
  () => props.state,
  () => clock.wake()
)
</script>

<template>
  <div ref="root" class="relative h-full w-full overflow-hidden" data-testid="route-map">
    <svg
      class="block h-full w-full"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="label"
    >
      <rect :x="-BIG" :y="-BIG" :width="3 * BIG" :height="3 * BIG" :fill="colors.sea" />
      <path
        :d="abroad"
        :fill="colors.abroad"
        :stroke="colors.abroadBorder"
        stroke-width="1.5"
        stroke-linejoin="round"
        fill-rule="evenodd"
      />
      <path
        v-for="shape in mainland"
        :key="shape.id"
        :d="shape.d"
        :fill="shape.fill"
        :stroke="colors.border"
        stroke-width="2"
        stroke-linejoin="round"
        fill-rule="evenodd"
        :data-region="shape.id"
      />
      <rect
        :x="map.inset.x"
        :y="map.inset.y"
        :width="map.inset.width"
        :height="map.inset.height"
        :fill="colors.sea"
        :stroke="colors.insetFrame"
        stroke-width="3"
      />
      <path
        v-for="shape in canarias"
        :key="shape.id"
        :d="shape.d"
        :fill="shape.fill"
        :stroke="colors.border"
        stroke-width="2"
        stroke-linejoin="round"
        fill-rule="evenodd"
        :data-region="shape.id"
      />
      <g shape-rendering="crispEdges">
        <rect
          v-for="sparkle in sparkles"
          :key="sparkle.key"
          :x="sparkle.point.x - 4"
          :y="sparkle.point.y"
          width="8"
          height="2.5"
          :fill="colors.sparkle"
        />
      </g>
      <g fill="none" stroke-linecap="butt" stroke-linejoin="round">
        <template v-for="dash in route.dashes" :key="dash.key">
          <polyline
            :points="points(dash.points)"
            :stroke="colors.dotOutline"
            stroke-width="5"
            stroke-dasharray="8 6"
          />
          <polyline
            :points="points(dash.points)"
            :stroke="dash.visited ? colors.dotVisited : colors.dot"
            stroke-width="2.5"
            stroke-dasharray="8 6"
          />
        </template>
      </g>
      <g shape-rendering="crispEdges">
        <rect
          v-for="dot in route.dots"
          :key="dot.key"
          :x="dot.point.x - 3"
          :y="dot.point.y - 3"
          width="6"
          height="6"
          :fill="dot.visited ? colors.dotVisited : colors.dot"
          :stroke="colors.dotOutline"
          stroke-width="1.5"
        />
      </g>
      <PixelSprite
        v-for="item in scene.landmarks"
        :key="item.key"
        :sprite="item.sprite"
        :x="item.x"
        :y="item.y"
        :pixel="SPRITE_PIXEL"
      />
      <rect
        v-if="record !== null"
        :x="record.x"
        :y="record.y"
        :width="record.width"
        :height="record.height"
        fill="none"
        :stroke="colors.record"
        stroke-width="2.5"
        shape-rendering="crispEdges"
        data-testid="record"
      />
      <PixelSprite
        v-for="item in [...scene.stops, ...scene.flags]"
        :key="item.key"
        :sprite="item.sprite"
        :x="item.x"
        :y="item.y"
        :pixel="SPRITE_PIXEL"
      />
      <PixelSprite
        :sprite="scene.traveller.sprite"
        :x="scene.traveller.x"
        :y="scene.traveller.y"
        :pixel="SPRITE_PIXEL"
        :flip="scene.traveller.flip"
        :data-traveller="scene.traveller.key"
      />
      <PixelSprite
        v-for="item in scene.fireworks"
        :key="item.key"
        :sprite="item.sprite"
        :x="item.x"
        :y="item.y"
        :pixel="SPRITE_PIXEL"
        data-testid="firework"
      />
    </svg>
  </div>
</template>
