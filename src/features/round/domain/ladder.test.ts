import { describe, expect, it } from 'vitest'
import { EComunidadID } from '@/contracts/comunidad'
import { ROUND_LENGTH, ROUTE, SAFE_RUNGS } from '@/contracts/route'
import { EErrorCode } from '@/shared/errors/appError'
import {
  comunidadAt,
  isSafeRung,
  LADDER,
  LADDER_POINTS,
  NATIONALITY_RUNG,
  pointsAt,
  safePointsAt,
  stopOf,
} from './ladder'

describe('the prize ladder', () => {
  it('has one rung per comunidad with the planned points', () => {
    expect(LADDER_POINTS).toEqual([
      100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000,
      75000, 100000,
    ])
    expect(LADDER).toHaveLength(ROUND_LENGTH)
    expect(LADDER.map((r) => r.comunidadID)).toEqual(ROUTE)
    expect(LADDER.map((r) => r.rung)).toEqual(Array.from({ length: ROUND_LENGTH }, (_, i) => i + 1))
    expect(LADDER.map((r) => r.points)).toEqual(LADDER_POINTS)
  })

  it('climbs: every rung is worth more than the one before', () => {
    LADDER_POINTS.slice(1).forEach((points, i) => {
      expect(points).toBeGreaterThan(LADDER_POINTS[i] ?? Infinity)
    })
  })

  it('marks rungs 5 and 10 safe, worth 1.000 and 7.500', () => {
    expect(SAFE_RUNGS).toEqual([5, 10])
    expect(LADDER.filter((r) => r.safe).map((r) => [r.rung, r.points])).toEqual([
      [5, 1000],
      [10, 7500],
    ])
    expect(isSafeRung(5)).toBe(true)
    expect(isSafeRung(6)).toBe(false)
  })

  it('wins the nationality on rung 17 only, in Madrid', () => {
    expect(NATIONALITY_RUNG).toBe(17)
    expect(LADDER.filter((r) => r.nationality).map((r) => r.comunidadID)).toEqual([
      EComunidadID.Madrid,
    ])
  })

  it('gives 0 points before the first rung and the rung points after', () => {
    expect(pointsAt(0)).toBe(0)
    expect(pointsAt(1)).toBe(100)
    expect(pointsAt(5)).toBe(1000)
    expect(pointsAt(17)).toBe(100000)
  })

  it('keeps the last safe rung reached after a wrong answer', () => {
    const expected = [
      ...Array<number>(5).fill(0), // 0–4
      ...Array<number>(5).fill(1000), // 5–9
      ...Array<number>(8).fill(7500), // 10–17
    ]
    expect(Array.from({ length: ROUND_LENGTH + 1 }, (_, reached) => safePointsAt(reached))).toEqual(
      expected
    )
  })

  it('places rung n in ROUTE[n - 1]: Canarias first, Madrid last', () => {
    expect(comunidadAt(1)).toBe(EComunidadID.Canarias)
    expect(comunidadAt(2)).toBe(EComunidadID.Andalucia)
    expect(comunidadAt(17)).toBe(EComunidadID.Madrid)
  })

  it('stands her on the stop of her next question, and in Madrid once she has won', () => {
    expect(stopOf(0)).toBe(0)
    expect(stopOf(3)).toBe(3)
    expect(stopOf(16)).toBe(16)
    expect(stopOf(17)).toBe(16)
  })

  it.each([
    ['pointsAt', () => pointsAt(18)],
    ['pointsAt', () => pointsAt(-1)],
    ['pointsAt', () => pointsAt(1.5)],
    ['safePointsAt', () => safePointsAt(18)],
    ['comunidadAt', () => comunidadAt(0)],
    ['comunidadAt', () => comunidadAt(18)],
    ['stopOf', () => stopOf(-1)],
  ])('%s refuses a rung off the ladder', (_name, call) => {
    expect(call).toThrow(expect.objectContaining({ code: EErrorCode.InvalidInput }))
  })
})
