import { describe, expect, it } from 'vitest'
import type { MapRegionID } from '../domain/lowPolyMap'
import { spainLowPoly } from '../infra/spainLowPoly'
import { REGION_COLORS } from './mapStyle'

const map = spainLowPoly()

/** Two areas are neighbours when their outlines share a border: at least two corners. */
function neighbours(): [MapRegionID, MapRegionID][] {
  const ids = Object.keys(map.regions) as MapRegionID[]
  const corners = new Map(
    ids.map((id) => [id, new Set(map.regions[id].flat().map((p) => `${p.x},${p.y}`))])
  )
  const pairs: [MapRegionID, MapRegionID][] = []
  ids.forEach((a, i) => {
    ids.slice(i + 1).forEach((b) => {
      const shared = [...(corners.get(a) ?? [])].filter((key) => corners.get(b)?.has(key))
      if (shared.length >= 2) pairs.push([a, b])
    })
  })
  return pairs
}

describe('the colours of the map', () => {
  it('finds the borders between comunidades', () => {
    expect(neighbours().length).toBeGreaterThan(20)
  })

  it('never gives two neighbours the same colour', () => {
    for (const [a, b] of neighbours()) {
      expect(REGION_COLORS[a], `${a} / ${b}`).not.toBe(REGION_COLORS[b])
    }
  })
})
