import { describe, expect, it } from 'vitest'
import type { Sprite } from '@/shared/pixel/sprite'
import { spriteRects } from './spriteRects'

const sprite: Sprite = {
  rows: ['aab.', '.ccb'],
  legend: { a: 'red', b: 'blue', c: 'red' },
}

describe('a sprite as rectangles', () => {
  it('merges each row’s runs of one colour and skips transparent pixels', () => {
    expect(spriteRects(sprite)).toEqual([
      { x: 0, y: 0, width: 2, color: 'red' },
      { x: 2, y: 0, width: 1, color: 'blue' },
      { x: 1, y: 1, width: 2, color: 'red' },
      { x: 3, y: 1, width: 1, color: 'blue' },
    ])
  })

  it('mirrors left to right', () => {
    expect(spriteRects(sprite, true)).toEqual([
      { x: 2, y: 0, width: 2, color: 'red' },
      { x: 1, y: 0, width: 1, color: 'blue' },
      { x: 1, y: 1, width: 2, color: 'red' },
      { x: 0, y: 1, width: 1, color: 'blue' },
    ])
  })

  it('treats a legend entry of "transparent" as a hole', () => {
    expect(spriteRects({ rows: ['ab'], legend: { a: 'transparent', b: 'red' } })).toEqual([
      { x: 1, y: 0, width: 1, color: 'red' },
    ])
  })

  it('computes a sprite once', () => {
    expect(spriteRects(sprite)).toBe(spriteRects(sprite))
  })
})
