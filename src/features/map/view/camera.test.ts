import { describe, expect, it } from 'vitest'
import { cameraFor, FOLLOW_BELOW } from './camera'
import { SPRITE_PIXEL } from './mapStyle'

const map = { width: 1000, height: 800 }
const middle = { x: 500, y: 400 }

function devicePixelsPerSpritePixel(zoom: number, ratio: number): number {
  return zoom * SPRITE_PIXEL * ratio
}

describe('the camera', () => {
  it('shows the whole map before it knows its size', () => {
    const camera = cameraFor({ width: 0, height: 0, devicePixelRatio: 2 }, map, middle)
    expect(camera.viewBox).toEqual({ x: 0, y: 0, width: 1000, height: 800 })
    expect(camera.follows).toBe(false)
  })

  it.each([
    { width: 1000, height: 820, devicePixelRatio: 2 },
    { width: 900, height: 840, devicePixelRatio: 1 },
    { width: 1300, height: 760, devicePixelRatio: 1.25 },
    { width: 768, height: 640, devicePixelRatio: 2 },
  ])('shows the whole map on a laptop or a tablet ($width × $height)', (viewport) => {
    const camera = cameraFor(viewport, map, { x: 40, y: 760 })
    const { x, y, width, height } = camera.viewBox
    expect(camera.follows).toBe(false)
    expect(x).toBeLessThanOrEqual(0)
    expect(y).toBeLessThanOrEqual(0)
    expect(x + width).toBeGreaterThanOrEqual(map.width)
    expect(y + height).toBeGreaterThanOrEqual(map.height)
    // It keeps the viewport's shape, so nothing is stretched, and stays centred.
    expect(width / height).toBeCloseTo(viewport.width / viewport.height)
    expect(x + width / 2).toBeCloseTo(500)
    // It uses most of the room it has.
    expect(camera.zoom).toBeGreaterThan(
      0.85 * Math.min(viewport.width / 1000, viewport.height / 800)
    )
  })

  it('makes a sprite pixel a whole number of device pixels when that costs little', () => {
    const camera = cameraFor({ width: 1000, height: 820, devicePixelRatio: 2 }, map, middle)
    const pixels = devicePixelsPerSpritePixel(camera.zoom, 2)
    expect(pixels).toBeCloseTo(Math.round(pixels))
  })

  it('zooms in on a phone in portrait and keeps her in the middle', () => {
    const viewport = { width: 375, height: 520, devicePixelRatio: 3 }
    expect(375 / 1000).toBeLessThan(FOLLOW_BELOW)
    const camera = cameraFor(viewport, map, middle)
    const { x, y, width, height } = camera.viewBox
    expect(camera.follows).toBe(true)
    expect(width).toBeLessThan(map.width / 2)
    expect(x + width / 2).toBeCloseTo(500)
    expect(y + height / 2).toBeCloseTo(400)
    const pixels = devicePixelsPerSpritePixel(camera.zoom, 3)
    expect(pixels).toBeCloseTo(Math.round(pixels))
  })

  it('pans with her but never past the edge of the map', () => {
    const viewport = { width: 375, height: 520, devicePixelRatio: 2 }
    const corner = cameraFor(viewport, map, { x: 20, y: 790 }).viewBox
    expect(corner.x).toBe(0)
    expect(corner.y + corner.height).toBeCloseTo(map.height)
    const north = cameraFor(viewport, map, { x: 990, y: 5 }).viewBox
    expect(north.x + north.width).toBeCloseTo(map.width)
    expect(north.y).toBe(0)
    const a = cameraFor(viewport, map, { x: 400, y: 400 }).viewBox
    const b = cameraFor(viewport, map, { x: 420, y: 400 }).viewBox
    expect(b.x - a.x).toBeCloseTo(20)
  })

  it('follows in a short landscape phone too', () => {
    const camera = cameraFor({ width: 812, height: 300, devicePixelRatio: 3 }, map, middle)
    expect(camera.follows).toBe(true)
  })
})
