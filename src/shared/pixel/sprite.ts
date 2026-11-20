// A tiny pixel-art engine. A sprite is rows of characters; each character is a
// key of its legend (a palette colour), '.' is a transparent pixel. Sprites are
// drawn on a canvas at an integer scale with no smoothing, so pixels stay sharp.

import { PIXEL_PALETTE, type PixelColor } from './palette'

export const TRANSPARENT = '.'

export interface Sprite {
  /** Every row has the same length. */
  readonly rows: readonly string[]
  /** Character → palette colour. Every character in `rows` except '.' must be here. */
  readonly legend: Readonly<Record<string, PixelColor>>
}

export interface SpriteSize {
  readonly width: number
  readonly height: number
}

export function spriteSize(sprite: Sprite): SpriteSize {
  return { width: sprite.rows[0]?.length ?? 0, height: sprite.rows.length }
}

/** The problems of a sprite: uneven rows, characters missing from the legend. Empty when fine. */
export function spriteProblems(sprite: Sprite): string[] {
  const problems: string[] = []
  const { width } = spriteSize(sprite)
  if (sprite.rows.length === 0 || width === 0) problems.push('the sprite is empty')
  sprite.rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`row ${y} is ${row.length} wide, not ${width}`)
    for (const char of row) {
      if (char !== TRANSPARENT && !(char in sprite.legend)) {
        problems.push(`row ${y} uses "${char}", which is not in the legend`)
      }
    }
  })
  return problems
}

/** The same sprite with some legend entries swapped: for skin, hair and outfit colours. */
export function recolor(sprite: Sprite, changes: Readonly<Record<string, PixelColor>>): Sprite {
  return { rows: sprite.rows, legend: { ...sprite.legend, ...changes } }
}

/** The same sprite mirrored left to right. */
export function flipX(sprite: Sprite): Sprite {
  return { rows: sprite.rows.map((row) => [...row].reverse().join('')), legend: sprite.legend }
}

export interface DrawOptions {
  /** Pixels per sprite pixel; an integer. Default 1. */
  scale?: number
}

const rendered = new WeakMap<Sprite, HTMLCanvasElement>()

/** The sprite painted once on its own small canvas, cached per sprite object. */
function spriteCanvas(sprite: Sprite): HTMLCanvasElement {
  const cached = rendered.get(sprite)
  if (cached !== undefined) return cached
  const { width, height } = spriteSize(sprite)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx !== null) {
    sprite.rows.forEach((row, y) => {
      ;[...row].forEach((char, x) => {
        const color = sprite.legend[char]
        if (char === TRANSPARENT || color === undefined || color === 'transparent') return
        ctx.fillStyle = PIXEL_PALETTE[color]
        ctx.fillRect(x, y, 1, 1)
      })
    })
  }
  rendered.set(sprite, canvas)
  return canvas
}

/** Draws a sprite with its top-left corner at (x, y), in canvas pixels. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  options: DrawOptions = {}
): void {
  const scale = Math.max(1, Math.round(options.scale ?? 1))
  const { width, height } = spriteSize(sprite)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(spriteCanvas(sprite), Math.round(x), Math.round(y), width * scale, height * scale)
}
