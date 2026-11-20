// The sea's slow shimmer: little glints on open water that come and go.

import { isOnLand, type LowPolyMap, type MapPoint, type MapRect } from '../domain/lowPolyMap'

/** Space between the spots a glint can appear at, in map units. */
const SPACING = 36
/** A glint keeps this far from any coast. */
const OFFSHORE = 14
/** How long a pattern of glints lasts. */
export const SPARKLE_MS = 700
/** About one spot in this many glints at a time. */
const ONE_IN = 5

export interface Sparkle {
  readonly key: string
  readonly point: MapPoint
}

const spotsByMap = new WeakMap<LowPolyMap, readonly MapPoint[]>()

/** A small integer hash: the same spot and step always give the same answer. */
function hash(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  return h >>> 0
}

function insideGrown(point: MapPoint, box: MapRect, margin: number): boolean {
  return (
    point.x > box.x - margin &&
    point.x < box.x + box.width + margin &&
    point.y > box.y - margin &&
    point.y < box.y + box.height + margin
  )
}

/** Close to the line around the Canarias inset. */
function nearFrame(point: MapPoint, box: MapRect): boolean {
  return insideGrown(point, box, OFFSHORE) && !insideGrown(point, box, -OFFSHORE)
}

/** The open-water spots of the map, a little jittered so they don't look like a grid. */
export function sparkleSpots(map: LowPolyMap): readonly MapPoint[] {
  const cached = spotsByMap.get(map)
  if (cached !== undefined) return cached
  const spots: MapPoint[] = []
  for (let row = 0; row * SPACING < map.height; row++) {
    for (let column = 0; column * SPACING < map.width; column++) {
      const jitter = hash(column, row)
      const point = {
        x: column * SPACING + (jitter % SPACING),
        y: row * SPACING + ((jitter >>> 8) % SPACING),
      }
      const offshore = [
        point,
        { x: point.x - OFFSHORE, y: point.y },
        { x: point.x + OFFSHORE, y: point.y },
        { x: point.x, y: point.y - OFFSHORE },
        { x: point.x, y: point.y + OFFSHORE },
      ].every((p) => !isOnLand(map, p))
      if (offshore && !nearFrame(point, map.inset)) spots.push(point)
    }
  }
  spotsByMap.set(map, spots)
  return spots
}

/** The glints showing at a moment; at time 0 (reduced motion) a still pattern. */
export function seaSparkles(map: LowPolyMap, timeMs: number): Sparkle[] {
  const step = Math.floor(Math.max(0, timeMs) / SPARKLE_MS)
  return sparkleSpots(map)
    .map((point, i) => ({ key: `${i}`, point, show: hash(i, step) % ONE_IN === 0 }))
    .filter((spot) => spot.show)
    .map(({ key, point }) => ({ key, point }))
}
