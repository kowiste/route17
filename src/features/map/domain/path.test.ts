import { describe, expect, it } from 'vitest'
import { spainLowPoly } from '../infra/spainLowPoly'
import { ETravelMode, LEGS } from './legs'
import { distanceBetween, isOnLand, regionAt } from './lowPolyMap'
import {
  DOT_SPACING,
  isOverSea,
  legMarks,
  legPath,
  pathLength,
  positionAlong,
  STOP_CLEARANCE,
} from './path'

const map = spainLowPoly()

function samples(length: number, step = 2): number[] {
  return Array.from({ length: Math.floor(length / step) + 1 }, (_, i) => i * step)
}

describe('the path of each leg', () => {
  it.each(LEGS)('starts at $from and ends at $to', (leg) => {
    const path = legPath(map, leg)
    expect(path[0]).toEqual(map.anchors[leg.from])
    expect(path.at(-1)).toEqual(map.anchors[leg.to])
  })

  it('walks only over land, through comunidades', () => {
    for (const leg of LEGS.filter((l) => l.mode === ETravelMode.Walk)) {
      const path = legPath(map, leg)
      for (const at of samples(pathLength(path))) {
        const { point } = positionAlong(path, at)
        expect(regionAt(map, point), `${leg.from} → ${leg.to} at ${at}`).toBeDefined()
      }
    }
  })

  it('crosses the sea on the boat legs, starting and ending on land', () => {
    for (const leg of LEGS.filter((l) => l.mode === ETravelMode.Boat)) {
      const path = legPath(map, leg)
      const length = pathLength(path)
      const sea = samples(length).filter((at) => isOverSea(map, leg, path, at))
      expect(sea.length, leg.to).toBeGreaterThan(0)
      expect(isOverSea(map, leg, path, 0)).toBe(false)
      expect(isOverSea(map, leg, path, length)).toBe(false)
    }
  })

  it('flies an arc, longer than the straight line, that leaves the Canarias inset', () => {
    const flight = LEGS.find((leg) => leg.mode === ETravelMode.Plane)
    expect(flight).toBeDefined()
    if (flight === undefined) return
    const path = legPath(map, flight)
    const straight = distanceBetween(map.anchors[flight.from], map.anchors[flight.to])
    expect(path.length).toBeGreaterThan(2)
    expect(pathLength(path)).toBeGreaterThan(straight)
    const { inset } = map
    const outside = path.filter(
      (p) => p.x > inset.x + inset.width || p.y < inset.y || p.x < inset.x
    )
    expect(outside.length).toBeGreaterThan(0)
  })
})

describe('moving along a path', () => {
  const path = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 20 },
  ]

  it('measures it', () => {
    expect(pathLength(path)).toBe(30)
  })

  it('finds the point and heading at a distance, clamped to the ends', () => {
    expect(positionAlong(path, 5)).toEqual({ point: { x: 5, y: 0 }, heading: { x: 1, y: 0 } })
    expect(positionAlong(path, 20)).toEqual({ point: { x: 10, y: 10 }, heading: { x: 0, y: 1 } })
    expect(positionAlong(path, -4).point).toEqual({ x: 0, y: 0 })
    expect(positionAlong(path, 99).point).toEqual({ x: 10, y: 20 })
  })
})

describe('the marks that draw each leg', () => {
  it.each(LEGS)('puts $from → $to dots over land and dashes over the sea', (leg) => {
    const path = legPath(map, leg)
    const length = pathLength(path)
    const { dots, dashes } = legMarks(map, leg, path)
    for (const dot of dots) {
      expect(isOnLand(map, dot.point)).toBe(true)
      expect(dot.at).toBeGreaterThanOrEqual(STOP_CLEARANCE)
      expect(dot.at).toBeLessThanOrEqual(length - STOP_CLEARANCE)
    }
    dots.slice(1).forEach((dot, i) => {
      expect(dot.at - (dots[i]?.at ?? 0)).toBeGreaterThanOrEqual(DOT_SPACING)
    })
    for (const stretch of dashes) {
      expect(stretch.length).toBeGreaterThanOrEqual(2)
      const middle = stretch[Math.floor(stretch.length / 2)]
      if (leg.mode !== ETravelMode.Plane && stretch.length > 2 && middle !== undefined) {
        expect(isOnLand(map, middle.point)).toBe(false)
      }
    }
  })

  it('draws walking legs as dots only, the flight as dashes only, boats as both', () => {
    for (const leg of LEGS) {
      const { dots, dashes } = legMarks(map, leg, legPath(map, leg))
      if (leg.mode === ETravelMode.Walk) {
        expect(dashes, leg.to).toHaveLength(0)
        expect(dots.length, leg.to).toBeGreaterThan(0)
      }
      if (leg.mode === ETravelMode.Plane) {
        expect(dots).toHaveLength(0)
        expect(dashes).toHaveLength(1)
      }
      if (leg.mode === ETravelMode.Boat) {
        expect(dashes.length, leg.to).toBeGreaterThan(0)
        expect(dots.length, leg.to).toBeGreaterThan(0)
      }
    }
  })
})
