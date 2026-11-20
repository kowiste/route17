// The low-poly map of Spain: each comunidad's outline in one viewBox, the
// neighbouring countries for context, the Canarias inset and one stop per
// comunidad. Built once by `scripts/buildMap.ts`; loaded by `infra/`.

import type { EComunidadID } from '@/contracts/comunidad'

/** Drawn on the map but not on the route. */
export enum EAutonomousCity {
  Ceuta = 'ceuta',
  Melilla = 'melilla',
}

export type MapRegionID = EComunidadID | EAutonomousCity

export interface MapPoint {
  readonly x: number
  readonly y: number
}

export interface MapRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** A closed outline: its corners in order; the last one joins the first. */
export type MapRing = readonly MapPoint[]

export interface LowPolyMap {
  /** The viewBox is `0 0 width height`. */
  readonly width: number
  readonly height: number
  /** The box Canarias is drawn in, at the bottom left. */
  readonly inset: MapRect
  /** Each area's outlines (islands and holes too), filled with the even-odd rule. */
  readonly regions: Readonly<Record<MapRegionID, readonly MapRing[]>>
  /** The neighbouring countries, drawn for context. */
  readonly abroad: readonly MapRing[]
  /** Where each comunidad's stop is: a point inside its outline. */
  readonly anchors: Readonly<Record<EComunidadID, MapPoint>>
}

export function distanceBetween(a: MapPoint, b: MapPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Whether a point is inside a shape made of these rings (even-odd: a ring inside another is a hole). */
export function isInsideRings(point: MapPoint, rings: readonly MapRing[]): boolean {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i]
      const b = ring[j]
      if (a === undefined || b === undefined) continue
      if (a.y > point.y !== b.y > point.y) {
        const crossing = a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)
        if (point.x < crossing) inside = !inside
      }
    }
  }
  return inside
}

/** The comunidad (or Ceuta, Melilla) at a point; undefined over the sea or abroad. */
export function regionAt(map: LowPolyMap, point: MapPoint): MapRegionID | undefined {
  const regions = Object.entries(map.regions) as [MapRegionID, readonly MapRing[]][]
  return regions.find(([, rings]) => isInsideRings(point, rings))?.[0]
}

/** Over any land, Spanish or not. */
export function isOnLand(map: LowPolyMap, point: MapPoint): boolean {
  return regionAt(map, point) !== undefined || isInsideRings(point, map.abroad)
}
