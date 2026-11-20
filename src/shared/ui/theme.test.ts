// The UI theme stays on the pixel-art palette, and light and dark define the
// same tokens, every one mapped to a Tailwind name.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PIXEL_PALETTE } from '@/shared/pixel/palette'

const STYLES = resolve(import.meta.dirname, '../../styles')
const theme = readFileSync(resolve(STYLES, 'theme.css'), 'utf8')
const main = readFileSync(resolve(STYLES, 'main.css'), 'utf8')

/** The custom properties set in a block of CSS, name → value. */
function tokens(css: string): Map<string, string> {
  return new Map([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1] ?? '', m[2] ?? '']))
}

/** The body of the first rule block that starts with `selector`. */
function block(selector: string): string {
  const start = theme.indexOf(`${selector} {`)
  expect(start, `${selector} in theme.css`).toBeGreaterThanOrEqual(0)
  const open = theme.indexOf('{', start)
  const close = theme.indexOf('}', open)
  return theme.slice(open + 1, close)
}

const light = tokens(block(':root'))
const darkBySystem = tokens(block(":root:not([data-theme='light'])"))
const darkByHand = tokens(block(":root[data-theme='dark']"))

describe('theme.css', () => {
  it('uses only colours of the pixel palette', () => {
    const palette = new Set(Object.values(PIXEL_PALETTE).map((c) => c.toLowerCase()))
    const hexes = [...theme.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase())
    expect(hexes.length).toBeGreaterThan(20)
    expect(hexes.filter((hex) => !palette.has(hex))).toEqual([])
  })

  it('gives the dark theme the same tokens, by system setting or by hand', () => {
    const fixed = new Set(['--shade', '--road'])
    const lightNames = [...light.keys()].filter((name) => !fixed.has(name)).sort()
    expect([...darkBySystem.keys()].sort()).toEqual(lightNames)
    expect(darkByHand).toEqual(darkBySystem)
  })

  it('maps every colour token to a Tailwind name', () => {
    const mapped = new Set(
      [...main.matchAll(/--color-[\w-]+:\s*var\((--[\w-]+)\)/g)].map((m) => m[1])
    )
    const colours = [...light.keys()].filter((name) => name !== '--road')
    expect(colours.filter((name) => !mapped.has(name))).toEqual([])
  })
})
