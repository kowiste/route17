// The path of each leg on the map, and the marks that show it: dots every few
// steps over land, a dashed line over the sea (and for the whole flight).

import { type Leg, ETravelMode } from './legs'
import { distanceBetween, isOnLand, type LowPolyMap, type MapPoint } from './lowPolyMap'

/** A polyline from the leg's first stop to its last. */
export type LegPath = readonly MapPoint[]

/** Space between two dots of the route, in map units. */
export const DOT_SPACING = 14
/** No mark this close to a stop: the stop's marker covers it. */
export const STOP_CLEARANCE = 12
/** How finely the path is checked for land and sea. */
const SAMPLE_STEP = 2
/** How many straight pieces the flight's arc is made of. */
const ARC_SEGMENTS = 24
/** How far the flight's arc bulges, as a share of the distance flown. */
const ARC_BULGE = 0.3

export interface PathMark {
  /** Distance from the start of the leg. */
  readonly at: number
  readonly point: MapPoint
}

export interface LegMarks {
  /** Dots over land, in order along the leg. */
  readonly dots: readonly PathMark[]
  /** Dashed stretches (over the sea, or the whole flight): each one a polyline, in order. */
  readonly dashes: readonly (readonly PathMark[])[]
}

/** Where she is after `distance` along the path, and which way she is heading (a unit vector). */
export interface PathPosition {
  readonly point: MapPoint
  readonly heading: MapPoint
}

/**
 * The path of a leg between its two stops: a straight line on foot and by boat,
 * an arc for the flight (bulging to the right of the way she flies: from
 * Canarias the plane sets off east, out of the inset, and turns north).
 */
export function legPath(map: LowPolyMap, leg: Leg): LegPath {
  const from = map.anchors[leg.from]
  const to = map.anchors[leg.to]
  if (leg.mode !== ETravelMode.Plane) return [from, to]
  // The control point sits off the middle, to the right of the way she flies.
  const control: MapPoint = {
    x: (from.x + to.x) / 2 - (to.y - from.y) * ARC_BULGE,
    y: (from.y + to.y) / 2 + (to.x - from.x) * ARC_BULGE,
  }
  return Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
    const t = i / ARC_SEGMENTS
    const u = 1 - t
    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    }
  })
}

export function pathLength(path: LegPath): number {
  let length = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    if (a !== undefined && b !== undefined) length += distanceBetween(a, b)
  }
  return length
}

/** The point `distance` along the path, clamped to its ends. */
export function positionAlong(path: LegPath, distance: number): PathPosition {
  const first = path[0] ?? { x: 0, y: 0 }
  let walked = 0
  let heading: MapPoint = { x: 1, y: 0 }
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    if (a === undefined || b === undefined) continue
    const piece = distanceBetween(a, b)
    if (piece === 0) continue
    heading = { x: (b.x - a.x) / piece, y: (b.y - a.y) / piece }
    if (walked + piece >= distance) {
      const t = Math.max(0, (distance - walked) / piece)
      return { point: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, heading }
    }
    walked += piece
  }
  return { point: path.at(-1) ?? first, heading }
}

/** The corners of the path strictly between two distances, with their distances. */
function cornersBetween(path: LegPath, from: number, to: number): PathMark[] {
  const corners: PathMark[] = []
  let walked = 0
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1]
    const b = path[i]
    if (a === undefined || b === undefined) continue
    walked += distanceBetween(a, b)
    if (walked > from && walked < to) corners.push({ at: walked, point: b })
  }
  return corners
}

function stretch(path: LegPath, from: number, to: number): PathMark[] {
  return [
    { at: from, point: positionAlong(path, from).point },
    ...cornersBetween(path, from, to),
    { at: to, point: positionAlong(path, to).point },
  ]
}

/** Whether she goes over the sea at this distance along the leg (a flight is always "over the sea"). */
export function isOverSea(map: LowPolyMap, leg: Leg, path: LegPath, distance: number): boolean {
  return leg.mode === ETravelMode.Plane || !isOnLand(map, positionAlong(path, distance).point)
}

/** The marks that draw a leg: dots over land, dashes over the sea and for the flight. */
export function legMarks(map: LowPolyMap, leg: Leg, path: LegPath): LegMarks {
  const length = pathLength(path)
  const start = STOP_CLEARANCE
  const end = length - STOP_CLEARANCE
  if (end <= start) return { dots: [], dashes: [] }

  const dashes: PathMark[][] = []
  let seaFrom: number | undefined
  for (let at = start; ; at = Math.min(end, at + SAMPLE_STEP)) {
    const sea = isOverSea(map, leg, path, at)
    if (sea && seaFrom === undefined) seaFrom = at
    if ((!sea || at >= end) && seaFrom !== undefined) {
      const to = sea ? at : at - SAMPLE_STEP
      if (to > seaFrom) dashes.push(stretch(path, seaFrom, to))
      seaFrom = undefined
    }
    if (at >= end) break
  }

  const dots: PathMark[] = []
  for (let at = DOT_SPACING; at <= end; at += DOT_SPACING) {
    if (at >= start && !isOverSea(map, leg, path, at)) {
      dots.push({ at, point: positionAlong(path, at).point })
    }
  }
  return { dots, dashes }
}
