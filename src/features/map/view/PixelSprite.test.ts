import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { PIXEL_PALETTE } from '@/shared/pixel/palette'
import type { Sprite } from '@/shared/pixel/sprite'
import PixelSprite from './PixelSprite.vue'

const sprite: Sprite = { rows: ['aab', '.b.'], legend: { a: 'red', b: 'blue' } }

function mountIn(props: InstanceType<typeof PixelSprite>['$props']) {
  return mount(PixelSprite, {
    props,
    attachTo: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
  })
}

describe('PixelSprite', () => {
  it('draws one crisp rect per run of a colour, at its place and size', () => {
    const wrapper = mountIn({ sprite, x: 10, y: 20, pixel: 2.5 })
    const group = wrapper.find('g')
    expect(group.attributes('transform')).toBe('translate(10 20) scale(2.5)')
    expect(group.attributes('shape-rendering')).toBe('crispEdges')
    const rects = wrapper.findAll('rect')
    expect(rects.map((rect) => [rect.attributes('x'), rect.attributes('width')])).toEqual([
      ['0', '2'],
      ['2', '1'],
      ['1', '1'],
    ])
    expect(rects[0]?.attributes('fill')).toBe(PIXEL_PALETTE.red)
  })

  it('mirrors when flipped', () => {
    const wrapper = mountIn({ sprite, x: 0, y: 0, flip: true })
    expect(wrapper.findAll('rect').map((rect) => rect.attributes('x'))).toEqual(['1', '0', '1'])
  })
})
