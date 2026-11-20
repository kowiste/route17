// The travel timeline: where she is along a leg at a moment of its animation,
// what she travels in there and which way she faces.

import { type Leg, ETravelMode } from './legs'
import type { LowPolyMap, MapPoint } from './lowPolyMap'
import { isOverSea, type LegPath, pathLength, positionAlong } from './path'

/** How long a leg takes, whatever its length. */
export const LEG_DURATION_MS = 1500

export enum EFacing {
  Left = 'left',
  Right = 'right',
}

export interface TravelFrame {
  readonly point: MapPoint
  /** Distance travelled along the leg so far. */
  readonly travelled: number
  /** 0 at the start of the leg, 1 at its end. */
  readonly progress: number
  readonly finished: boolean
  /** What she is in right now: on foot, in the boat or in the plane. */
  readonly vehicle: ETravelMode
  readonly facing: EFacing
}

/** Starts and ends gently, like a sprite setting off and slowing down at a stop. */
export function easeInOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * On foot over land, in the boat over the sea on a boat leg (she walks to and
 * from the harbour), in the plane for the whole flight.
 */
export function vehicleFor(mode: ETravelMode, overSea: boolean): ETravelMode {
  if (mode === ETravelMode.Plane) return ETravelMode.Plane
  return mode === ETravelMode.Boat && overSea ? ETravelMode.Boat : ETravelMode.Walk
}

/** Where she is `elapsedMs` after setting off on a leg. */
export function travelFrame(
  map: LowPolyMap,
  leg: Leg,
  path: LegPath,
  elapsedMs: number,
  durationMs: number = LEG_DURATION_MS
): TravelFrame {
  const time = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / durationMs))
  const progress = easeInOut(time)
  const travelled = pathLength(path) * progress
  const { point, heading } = positionAlong(path, travelled)
  return {
    point,
    travelled,
    progress,
    finished: time >= 1,
    vehicle: vehicleFor(leg.mode, isOverSea(map, leg, path, travelled)),
    facing: heading.x < 0 ? EFacing.Left : EFacing.Right,
  }
}
