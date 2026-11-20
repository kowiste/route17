import { describe, expect, it } from 'vitest'
import { spainLowPoly } from '../infra/spainLowPoly'
import { ETravelMode, LEGS } from './legs'
import { legPath, pathLength } from './path'
import { easeInOut, EFacing, LEG_DURATION_MS, travelFrame, vehicleFor } from './timeline'

const map = spainLowPoly()

function legTo(mode: ETravelMode) {
  const leg = LEGS.find((l) => l.mode === mode)
  if (leg === undefined) throw new Error(`no ${mode} leg`)
  return leg
}

describe('the travel timeline', () => {
  it('takes about a second and a half per leg', () => {
    expect(LEG_DURATION_MS).toBeGreaterThanOrEqual(1200)
    expect(LEG_DURATION_MS).toBeLessThanOrEqual(1800)
  })

  it('eases in and out between 0 and 1', () => {
    expect(easeInOut(-1)).toBe(0)
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(0.5)).toBe(0.5)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(2)).toBe(1)
    expect(easeInOut(0.1)).toBeLessThan(0.1)
  })

  it.each(LEGS)('starts $from → $to at the first stop and ends at the second', (leg) => {
    const path = legPath(map, leg)
    const start = travelFrame(map, leg, path, 0)
    expect(start.point).toEqual(map.anchors[leg.from])
    expect(start.progress).toBe(0)
    expect(start.finished).toBe(false)
    const end = travelFrame(map, leg, path, LEG_DURATION_MS)
    expect(end.point).toEqual(map.anchors[leg.to])
    expect(end.finished).toBe(true)
    expect(end.travelled).toBeCloseTo(pathLength(path))
    expect(travelFrame(map, leg, path, LEG_DURATION_MS * 3).point).toEqual(map.anchors[leg.to])
  })

  it('only moves forward', () => {
    const leg = legTo(ETravelMode.Walk)
    const path = legPath(map, leg)
    let last = -1
    for (let ms = 0; ms <= LEG_DURATION_MS; ms += 50) {
      const { travelled } = travelFrame(map, leg, path, ms)
      expect(travelled).toBeGreaterThanOrEqual(last)
      last = travelled
    }
  })

  it('takes the plane for the whole flight', () => {
    const leg = legTo(ETravelMode.Plane)
    const path = legPath(map, leg)
    for (let ms = 0; ms <= LEG_DURATION_MS; ms += 100) {
      expect(travelFrame(map, leg, path, ms).vehicle).toBe(ETravelMode.Plane)
    }
  })

  it('walks to the harbour, sails across and walks off the boat', () => {
    const leg = legTo(ETravelMode.Boat)
    const path = legPath(map, leg)
    const vehicles = Array.from({ length: 31 }, (_, i) =>
      travelFrame(map, leg, path, (i / 30) * LEG_DURATION_MS)
    ).map((frame) => frame.vehicle)
    expect(vehicles[0]).toBe(ETravelMode.Walk)
    expect(vehicles).toContain(ETravelMode.Boat)
    expect(vehicles.at(-1)).toBe(ETravelMode.Walk)
  })

  it('walks the walking legs', () => {
    expect(vehicleFor(ETravelMode.Walk, true)).toBe(ETravelMode.Walk)
    expect(vehicleFor(ETravelMode.Boat, false)).toBe(ETravelMode.Walk)
    expect(vehicleFor(ETravelMode.Boat, true)).toBe(ETravelMode.Boat)
    expect(vehicleFor(ETravelMode.Plane, false)).toBe(ETravelMode.Plane)
  })

  it('faces the way she goes', () => {
    const east = LEGS[0]
    const west = LEGS.find((l) => map.anchors[l.to].x < map.anchors[l.from].x)
    if (east === undefined || west === undefined) throw new Error('missing legs')
    expect(travelFrame(map, east, legPath(map, east), 500).facing).toBe(EFacing.Right)
    expect(travelFrame(map, west, legPath(map, west), 500).facing).toBe(EFacing.Left)
  })

  it('arrives at once with no duration', () => {
    const leg = legTo(ETravelMode.Walk)
    const frame = travelFrame(map, leg, legPath(map, leg), 0, 0)
    expect(frame.finished).toBe(true)
    expect(frame.point).toEqual(map.anchors[leg.to])
  })
})
