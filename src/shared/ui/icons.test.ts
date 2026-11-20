import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PixelIcon from './PixelIcon.vue'
import { EPixelIcon, iconShape, PIXEL_ICONS } from './icons'

describe('pixel icons', () => {
  it.each(Object.values(EPixelIcon))('%s is a well-formed grid', (icon) => {
    const rows = PIXEL_ICONS[icon]
    expect(rows.length).toBeGreaterThan(0)
    const width = rows[0]?.length ?? 0
    for (const row of rows) {
      expect(row).toHaveLength(width)
      expect(row).toMatch(/^[#.]+$/)
    }
    expect(rows.join('')).toContain('#')
  })

  it('turns each run of pixels into one rectangle', () => {
    const shape = iconShape(EPixelIcon.Cursor)
    expect(shape).toMatchObject({ width: 5, height: 7 })
    expect(shape.path.startsWith('M0 0h1v1h-1z')).toBe(true)
    expect(shape.path).toContain('M0 3h4v1h-4z')
  })
})

describe('PixelIcon', () => {
  it('is decoration without a label', () => {
    const svg = mount(PixelIcon, { props: { name: EPixelIcon.Check } }).get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('role')).toBeUndefined()
    expect(svg.attributes('viewBox')).toBe('0 0 8 8')
    expect(svg.get('path').attributes('d')).toBe(iconShape(EPixelIcon.Check).path)
  })

  it('is an image with its label', () => {
    const svg = mount(PixelIcon, { props: { name: EPixelIcon.Flag, label: 'Parada segura' } }).get(
      'svg'
    )
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Parada segura')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
  })
})
