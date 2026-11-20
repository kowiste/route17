import { describe, expect, it } from 'vitest'
import { EComunidadID } from '@/contracts/comunidad'
import {
  EAutonomousCity,
  isInsideRings,
  type MapRect,
  type MapRegionID,
  type MapRing,
} from '../domain/lowPolyMap'
import { spainLowPoly, spainLowPolySchema } from './spainLowPoly'
import data from './spainLowPoly.json'

const map = spainLowPoly()
const comunidades = Object.values(EComunidadID)
const regionIDs: MapRegionID[] = [...comunidades, ...Object.values(EAutonomousCity)]

function inRect(rect: MapRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

function corners(rings: readonly MapRing[]) {
  return rings.flat()
}

describe('the low-poly map of Spain', () => {
  it('parses: the committed file matches its schema', () => {
    expect(spainLowPolySchema.safeParse(data).success).toBe(true)
  })

  it('has exactly the comunidades of EComunidadID, plus Ceuta and Melilla', () => {
    expect(Object.keys(data.regions).sort()).toEqual([...regionIDs].sort())
    expect(Object.keys(data.anchors).sort()).toEqual([...comunidades].sort())
  })

  it('refuses a file with a comunidad or an anchor missing, or an unknown area', () => {
    const { madrid: _region, ...regions } = data.regions
    expect(spainLowPolySchema.safeParse({ ...data, regions }).success).toBe(false)
    const { madrid: _anchor, ...anchors } = data.anchors
    expect(spainLowPolySchema.safeParse({ ...data, anchors }).success).toBe(false)
    const extra = { ...data.regions, portugal: data.regions.galicia }
    expect(spainLowPolySchema.safeParse({ ...data, regions: extra }).success).toBe(false)
  })

  it('gives every area at least one polygon of three corners or more', () => {
    for (const id of regionIDs) {
      expect(map.regions[id].length, id).toBeGreaterThan(0)
      for (const ring of map.regions[id]) expect(ring.length, id).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps it low-poly: a handful of corners per comunidad', () => {
    for (const id of comunidades) {
      const count = corners(map.regions[id]).length
      expect(count, id).toBeGreaterThanOrEqual(6)
      expect(count, id).toBeLessThanOrEqual(45)
    }
  })

  it('puts every comunidad’s anchor inside its own outline, and in no other', () => {
    for (const id of comunidades) {
      const anchor = map.anchors[id]
      expect(isInsideRings(anchor, map.regions[id]), id).toBe(true)
      const others = regionIDs.filter((other) => other !== id)
      for (const other of others) {
        expect(isInsideRings(anchor, map.regions[other]), `${id} in ${other}`).toBe(false)
      }
    }
  })

  it('keeps Spain inside the viewBox, with integer coordinates', () => {
    for (const id of regionIDs) {
      for (const { x, y } of corners(map.regions[id])) {
        expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true)
        expect(inRect({ x: 0, y: 0, width: map.width, height: map.height }, x, y), id).toBe(true)
      }
    }
  })

  it('draws Canarias in the inset at the bottom left, and nothing else of Spain there', () => {
    const { inset } = map
    expect(inset.x).toBeLessThan(map.width / 4)
    expect(inset.y + inset.height).toBeGreaterThan(map.height * 0.9)
    for (const { x, y } of corners(map.regions[EComunidadID.Canarias])) {
      expect(inRect(inset, x, y)).toBe(true)
    }
    const mainland = regionIDs.filter((id) => id !== EComunidadID.Canarias)
    for (const id of mainland) {
      for (const { x, y } of corners(map.regions[id])) expect(inRect(inset, x, y), id).toBe(false)
    }
  })

  it('draws the islands as separate polygons: Baleares and Canarias have several', () => {
    expect(map.regions[EComunidadID.Baleares].length).toBeGreaterThanOrEqual(3)
    expect(map.regions[EComunidadID.Canarias].length).toBeGreaterThanOrEqual(7)
  })

  it('has neighbouring countries for context', () => {
    expect(map.abroad.length).toBeGreaterThan(0)
  })
})
