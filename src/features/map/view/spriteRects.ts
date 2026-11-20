// A sprite as SVG rectangles: each row's runs of one colour merged into one
// rectangle, so a 16 × 16 sprite is a few dozen <rect>s, not 256.

import type { PixelColor } from '@/shared/pixel/palette'
import { TRANSPARENT, type Sprite, spriteSize } from '@/shared/pixel/sprite'

export interface SpriteRect {
  /** In sprite pixels, from the sprite's top-left corner. */
  readonly x: number
  readonly y: number
  readonly width: number
  readonly color: PixelColor
}

const cache = new WeakMap<Sprite, { normal?: SpriteRect[]; flipped?: SpriteRect[] }>()

function colorOf(sprite: Sprite, char: string): PixelColor | undefined {
  if (char === TRANSPARENT) return undefined
  const color = sprite.legend[char]
  return color === 'transparent' ? undefined : color
}

function build(sprite: Sprite, flip: boolean): SpriteRect[] {
  const { width } = spriteSize(sprite)
  const rects: SpriteRect[] = []
  sprite.rows.forEach((row, y) => {
    const chars = [...row]
    let x = 0
    while (x < chars.length) {
      const color = colorOf(sprite, chars[x] ?? TRANSPARENT)
      let end = x + 1
      while (end < chars.length && colorOf(sprite, chars[end] ?? TRANSPARENT) === color) end++
      if (color !== undefined) {
        rects.push({ x: flip ? width - end : x, y, width: end - x, color })
      }
      x = end
    }
  })
  return rects
}

/** The sprite's rectangles, mirrored left to right when `flip`. Cached per sprite. */
export function spriteRects(sprite: Sprite, flip = false): readonly SpriteRect[] {
  const entry = cache.get(sprite) ?? {}
  cache.set(sprite, entry)
  if (flip) {
    entry.flipped ??= build(sprite, true)
    return entry.flipped
  }
  entry.normal ??= build(sprite, false)
  return entry.normal
}
