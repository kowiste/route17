import { describe, expect, it } from 'vitest'
import { SeededRandom } from './random'

describe('SeededRandom', () => {
  it('gives the same sequence for the same seed', () => {
    const a = new SeededRandom(42)
    const b = new SeededRandom(42)
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('gives different sequences for different seeds', () => {
    const a = new SeededRandom(1)
    const b = new SeededRandom(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('keeps next() in [0, 1) and int() in range', () => {
    const r = new SeededRandom(7)
    for (let i = 0; i < 1000; i++) {
      const n = r.next()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
      const k = r.int(3)
      expect([0, 1, 2]).toContain(k)
    }
  })

  it('refuses a non-positive range', () => {
    const r = new SeededRandom(7)
    expect(() => r.int(0)).toThrow(RangeError)
    expect(() => r.int(1.5)).toThrow(RangeError)
  })

  it('shuffles without losing or duplicating items, and leaves the input alone', () => {
    const r = new SeededRandom(3)
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const out = r.shuffle(input)
    expect([...out].sort((x, y) => x - y)).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('picks an item of the list and refuses an empty one', () => {
    const r = new SeededRandom(5)
    expect(['a', 'b']).toContain(r.pick(['a', 'b']))
    expect(() => r.pick([])).toThrow(RangeError)
  })
})
