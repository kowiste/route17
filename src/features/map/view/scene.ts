// What the map shows at a moment, worked out from the props, where she stands
// and the travel animation: the route's marks, the stops, the landmarks, the
// checkpoint flags, her (on foot, in the boat or the plane) and the fireworks.
// Pure, so it is tested without a browser; RouteMap.vue only draws the result.

import { EAvatarPose, type AvatarLook } from '@/contracts/avatar'
import { COMUNIDADES, EComunidadID } from '@/contracts/comunidad'
import { ROUND_LENGTH, ROUTE, SAFE_RUNGS } from '@/contracts/route'
import type { Sprite } from '@/shared/pixel/sprite'
import {
  avatarFrameCount,
  avatarSprite,
  boatSprite,
  EStopState,
  fireworkFrames,
  flagSprite,
  landmarkSprite,
  planeSprite,
  stopSprite,
} from '@/shared/pixel/sprites'
import { type Leg, ETravelMode } from '../domain/legs'
import type { LowPolyMap, MapPoint, MapRect } from '../domain/lowPolyMap'
import type { LegMarks, PathMark } from '../domain/path'
import { EFacing, type TravelFrame } from '../domain/timeline'
import {
  centredOn,
  fireworkSpots,
  flagBox,
  floatingOn,
  LANDMARK_SIDES,
  landmarkBox,
  onBoxCorner,
  onBoxFloor,
  standingOn,
  stopBox,
} from './placement'

/** What the round is doing, as the screen tells the map. */
export type TravellerState = 'idle' | 'travelling' | 'lost' | 'won'

export const LAST_STOP = ROUTE.length - 1

/** Frame lengths of the little animations, in ms. */
const IDLE_FRAME_MS = 500
const WALK_FRAME_MS = 150
const FLAG_FRAME_MS = 400
const VEHICLE_FRAME_MS = 300
const FIREWORK_FRAME_MS = 160

export interface PlacedSprite {
  readonly key: string
  readonly sprite: Sprite
  /** Top-left corner, in map units. */
  readonly x: number
  readonly y: number
  readonly flip: boolean
}

export interface Travel {
  readonly leg: Leg
  readonly frame: TravelFrame
}

export interface SceneInput {
  readonly map: LowPolyMap
  readonly look: AvatarLook
  /** The stop she stands at, or sets off from while travelling. */
  readonly at: number
  readonly reached: number
  readonly best: number
  readonly state: TravellerState
  readonly travel: Travel | null
  /** Clock for the little animations (idle bob, flags, fireworks); 0 keeps them still. */
  readonly timeMs: number
}

export interface Scene {
  readonly stops: readonly PlacedSprite[]
  readonly landmarks: readonly PlacedSprite[]
  readonly flags: readonly PlacedSprite[]
  /** The box around her best stop ever; null before she has one. */
  readonly record: MapRect | null
  readonly traveller: PlacedSprite
  readonly fireworks: readonly PlacedSprite[]
  /** Where she is: the camera follows it. */
  readonly focus: MapPoint
}

export function clampStop(stop: number): number {
  if (!Number.isFinite(stop)) return 0
  return Math.min(LAST_STOP, Math.max(0, Math.round(stop)))
}

function frameAt(timeMs: number, frameMs: number, count: number): number {
  return Math.floor(Math.max(0, timeMs) / frameMs) % Math.max(1, count)
}

/** How a stop's marker looks: where she is, where she has been, or ahead. */
export function stopState(index: number, input: SceneInput): EStopState {
  const at = clampStop(input.at)
  if (input.travel !== null) {
    if (index === input.travel.leg.index + 1) return EStopState.Ahead
    if (index <= at) return EStopState.Done
  }
  if (index === at) return EStopState.Current
  return index < at || index <= input.reached ? EStopState.Done : EStopState.Ahead
}

/** Her pose when she is not on the move. */
export function poseFor(state: TravellerState): EAvatarPose {
  if (state === 'won') return EAvatarPose.Cheer
  if (state === 'lost') return EAvatarPose.Sad
  if (state === 'travelling') return EAvatarPose.Walk
  return EAvatarPose.Idle
}

function travellerSprite(input: SceneInput): PlacedSprite {
  const { look, travel, timeMs } = input
  if (travel !== null) {
    const { frame } = travel
    const flip = frame.facing === EFacing.Left
    if (frame.vehicle === ETravelMode.Plane) {
      const sprite = planeSprite(frameAt(timeMs, VEHICLE_FRAME_MS, 2))
      return { key: 'plane', sprite, ...centredOn(sprite, frame.point), flip }
    }
    if (frame.vehicle === ETravelMode.Boat) {
      const sprite = boatSprite(look, frameAt(timeMs, VEHICLE_FRAME_MS, 2))
      return { key: 'boat', sprite, ...floatingOn(sprite, frame.point), flip }
    }
    const walk = frameAt(timeMs, WALK_FRAME_MS, avatarFrameCount(EAvatarPose.Walk))
    const sprite = avatarSprite(look, EAvatarPose.Walk, walk)
    return { key: 'avatar', sprite, ...standingOn(sprite, frame.point), flip }
  }
  const pose = poseFor(input.state)
  const frameMs = pose === EAvatarPose.Walk ? WALK_FRAME_MS : IDLE_FRAME_MS
  const sprite = avatarSprite(look, pose, frameAt(timeMs, frameMs, avatarFrameCount(pose)))
  const anchor = input.map.anchors[ROUTE[clampStop(input.at)] ?? EComunidadID.Canarias]
  return { key: 'avatar', sprite, ...standingOn(sprite, anchor), flip: false }
}

/** Everything the map draws on top of the land at this moment. */
export function buildScene(input: SceneInput): Scene {
  const { map, timeMs } = input
  const stops = ROUTE.map((comunidad, index) => {
    const sprite = stopSprite(stopState(index, input))
    return {
      key: `stop-${comunidad}`,
      sprite,
      ...centredOn(sprite, map.anchors[comunidad]),
      flip: false,
    }
  })
  const landmarks = ROUTE.map((comunidad) => {
    const sprite = landmarkSprite(comunidad)
    const box = landmarkBox(map.anchors[comunidad], LANDMARK_SIDES[comunidad])
    return { key: `landmark-${comunidad}`, sprite, ...onBoxFloor(sprite, box), flip: false }
  })
  const flag = flagSprite(frameAt(timeMs, FLAG_FRAME_MS, 2))
  const flags = SAFE_RUNGS.map((rung) => ROUTE[rung - 1])
    .filter((comunidad) => comunidad !== undefined)
    .map((comunidad) => ({
      key: `flag-${comunidad}`,
      sprite: flag,
      ...onBoxCorner(flag, flagBox(map.anchors[comunidad])),
      flip: false,
    }))
  const bestComunidad = input.best >= 0 ? ROUTE[clampStop(input.best)] : undefined
  const record = bestComunidad === undefined ? null : stopBox(map.anchors[bestComunidad])
  const traveller = travellerSprite(input)
  const madrid = map.anchors[EComunidadID.Madrid]
  const frames = fireworkFrames()
  const fireworks =
    input.state === 'won' && input.travel === null && clampStop(input.at) === LAST_STOP
      ? fireworkSpots(madrid).flatMap((spot, i) => {
          const sprite =
            frames[(frameAt(timeMs, FIREWORK_FRAME_MS, frames.length) + i * 2) % frames.length]
          return sprite === undefined
            ? []
            : [{ key: `firework-${i}`, sprite, ...centredOn(sprite, spot), flip: false }]
        })
      : []
  const focus =
    input.travel?.frame.point ?? map.anchors[ROUTE[clampStop(input.at)] ?? EComunidadID.Canarias]
  return { stops, landmarks, flags, record, traveller, fireworks, focus }
}

// --- The route's marks ---------------------------------------------------------

export interface RouteDot {
  readonly key: string
  readonly point: MapPoint
  readonly visited: boolean
}

export interface RouteDash {
  readonly key: string
  readonly points: readonly MapPoint[]
  readonly visited: boolean
}

/** The legs she has already travelled: before the stop she is at, and before `reached`. */
function legVisited(leg: number, input: Pick<SceneInput, 'at' | 'reached' | 'travel'>): boolean {
  if (input.travel !== null && leg >= input.travel.leg.index) return false
  return leg < clampStop(input.at) || leg < input.reached
}

/** A dashed stretch cut where she is: the part behind her and the part ahead. */
function splitStretch(stretch: readonly PathMark[], at: number): [MapPoint[], MapPoint[]] {
  const behind: MapPoint[] = []
  const ahead: MapPoint[] = []
  stretch.forEach((mark, i) => {
    const previous = stretch[i - 1]
    if (previous !== undefined && previous.at < at && mark.at > at) {
      const t = (at - previous.at) / (mark.at - previous.at)
      const cut = {
        x: previous.point.x + (mark.point.x - previous.point.x) * t,
        y: previous.point.y + (mark.point.y - previous.point.y) * t,
      }
      behind.push(cut)
      ahead.push(cut)
    }
    if (mark.at <= at) behind.push(mark.point)
    else ahead.push(mark.point)
  })
  return [behind, ahead]
}

/** Every leg's dots and dashes, coloured up to where she has been. */
export function routeView(
  marks: readonly LegMarks[],
  input: Pick<SceneInput, 'at' | 'reached' | 'travel'>
): { dots: RouteDot[]; dashes: RouteDash[] } {
  const dots: RouteDot[] = []
  const dashes: RouteDash[] = []
  marks.forEach((leg, index) => {
    const travelled =
      input.travel?.leg.index === index
        ? input.travel.frame.travelled
        : legVisited(index, input)
          ? Infinity
          : -1
    leg.dots.forEach((dot, i) => {
      dots.push({ key: `${index}-${i}`, point: dot.point, visited: dot.at <= travelled })
    })
    leg.dashes.forEach((stretch, i) => {
      const [behind, ahead] = splitStretch(stretch, travelled)
      if (behind.length > 1) dashes.push({ key: `${index}-${i}-v`, points: behind, visited: true })
      if (ahead.length > 1) dashes.push({ key: `${index}-${i}-a`, points: ahead, visited: false })
    })
  })
  return { dots, dashes }
}

// --- What a screen reader hears ------------------------------------------------

/** "Estás en Andalucía, parada 2 de 17", and the like for travelling, winning and losing. */
export function mapLabel(stop: number, state: TravellerState, travellingTo?: number): string {
  if (travellingTo !== undefined) {
    const to = clampStop(travellingTo)
    const name = COMUNIDADES[ROUTE[to] ?? EComunidadID.Madrid].shortName
    return `Viajando a ${name}, parada ${to + 1} de ${ROUND_LENGTH}`
  }
  const at = clampStop(stop)
  const name = COMUNIDADES[ROUTE[at] ?? EComunidadID.Canarias].shortName
  const position = `parada ${at + 1} de ${ROUND_LENGTH}`
  if (state === 'won') return `¡Has llegado a ${name}! Fin de la ruta, ${position}`
  if (state === 'lost') return `Te has quedado en ${name}, ${position}`
  return `Estás en ${name}, ${position}`
}
