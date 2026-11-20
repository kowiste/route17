import { describe, expect, it } from 'vitest'
import { isOnLand } from '../domain/lowPolyMap'
import { spainLowPoly } from '../infra/spainLowPoly'
import { seaSparkles, SPARKLE_MS, sparkleSpots } from './sparkles'

const map = spainLowPoly()

describe('the sea’s shimmer', () => {
  it('only glints over open water, off the line around the Canarias inset', () => {
    const spots = sparkleSpots(map)
    expect(spots.length).toBeGreaterThan(20)
    const { x, y, width, height } = map.inset
    for (const point of spots) {
      expect(isOnLand(map, point)).toBe(false)
      const toFrame = Math.min(
        Math.abs(point.x - x),
        Math.abs(point.x - x - width),
        Math.abs(point.y - y),
        Math.abs(point.y - y - height)
      )
      const inBand =
        point.x > x - 14 &&
        point.x < x + width + 14 &&
        point.y > y - 14 &&
        point.y < y + height + 14
      if (inBand) expect(toFrame).toBeGreaterThanOrEqual(14)
    }
  })

  it('shows the same glints at the same moment, and others a moment later', () => {
    const now = seaSparkles(map, 5 * SPARKLE_MS)
    expect(now).toEqual(seaSparkles(map, 5 * SPARKLE_MS + 10))
    expect(now.length).toBeGreaterThan(0)
    expect(now).not.toEqual(seaSparkles(map, 6 * SPARKLE_MS))
  })

  it('keeps a still pattern at time 0 (reduced motion)', () => {
    expect(seaSparkles(map, 0)).toEqual(seaSparkles(map, 0))
  })
})
