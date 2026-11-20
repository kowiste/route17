// Builds a sprite out of layers: her character is a body, a face and a
// hairstyle painted on top of each other; the boat carries her upper half.

import type { PixelColor } from '../palette'
import { TRANSPARENT, type Sprite } from '../sprite'

export interface Layer {
  readonly rows: readonly string[]
  /** Column of the layer's left edge in the result. Default 0. */
  readonly x?: number
  /** Row of the layer's top edge in the result. Default 0. */
  readonly y?: number
}

/**
 * Paints the layers in order on a width × height grid: a later layer covers an
 * earlier one, its '.' pixels leave what is below, and whatever falls outside
 * the grid is cut off.
 */
export function compose(
  width: number,
  height: number,
  layers: readonly Layer[],
  legend: Readonly<Record<string, PixelColor>>
): Sprite {
  const grid = Array.from({ length: height }, () => Array<string>(width).fill(TRANSPARENT))
  for (const layer of layers) {
    const left = layer.x ?? 0
    const top = layer.y ?? 0
    layer.rows.forEach((row, dy) => {
      const line = grid[top + dy]
      if (line === undefined) return
      ;[...row].forEach((char, dx) => {
        const x = left + dx
        if (char !== TRANSPARENT && x >= 0 && x < width) line[x] = char
      })
    })
  }
  return { rows: grid.map((line) => line.join('')), legend }
}

/** Which frame of a loop of `count` frames `frame` is: wraps both ways; not a whole number → rounded down. */
export function loopFrame(frame: number, count: number): number {
  const whole = Number.isFinite(frame) ? Math.floor(frame) : 0
  return ((whole % count) + count) % count
}

/**
 * Sprites built once and handed out again: `drawSprite` caches its canvas per
 * sprite object, so the same look and frame must give the same object.
 */
export class SpriteCache {
  private readonly sprites = new Map<string, Sprite>()

  get(key: string, build: () => Sprite): Sprite {
    const cached = this.sprites.get(key)
    if (cached !== undefined) return cached
    const sprite = build()
    this.sprites.set(key, sprite)
    return sprite
  }
}
