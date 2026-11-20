import { describe, expect, it } from 'vitest'
import { EComunidadID } from '@/contracts/comunidad'
import { ROUTE } from '@/contracts/route'
import { ETravelMode, legInto, LEGS, travelModeBetween } from './legs'

describe('the legs of the route', () => {
  it('joins every stop to the next: 16 legs for 17 stops', () => {
    expect(LEGS).toHaveLength(ROUTE.length - 1)
    LEGS.forEach((leg, i) => {
      expect(leg.index).toBe(i)
      expect(leg.from).toBe(ROUTE[i])
      expect(leg.to).toBe(ROUTE[i + 1])
    })
  })

  it('flies from Canarias to Andalucía', () => {
    expect(travelModeBetween(EComunidadID.Canarias, EComunidadID.Andalucia)).toBe(ETravelMode.Plane)
  })

  it('sails from the Comunitat Valenciana to Baleares and from Baleares to Cataluña', () => {
    expect(travelModeBetween(EComunidadID.Valenciana, EComunidadID.Baleares)).toBe(ETravelMode.Boat)
    expect(travelModeBetween(EComunidadID.Baleares, EComunidadID.Cataluna)).toBe(ETravelMode.Boat)
    expect(travelModeBetween(EComunidadID.Cataluna, EComunidadID.Baleares)).toBe(ETravelMode.Boat)
  })

  it('walks every other leg', () => {
    const modes = LEGS.map((leg) => leg.mode)
    expect(modes.filter((mode) => mode === ETravelMode.Plane)).toHaveLength(1)
    expect(modes.filter((mode) => mode === ETravelMode.Boat)).toHaveLength(2)
    expect(modes.filter((mode) => mode === ETravelMode.Walk)).toHaveLength(13)
    expect(travelModeBetween(EComunidadID.CastillaLaMancha, EComunidadID.Madrid)).toBe(
      ETravelMode.Walk
    )
  })

  it('finds the leg into a stop, none into the first', () => {
    expect(legInto(0)).toBeUndefined()
    expect(legInto(1)?.to).toBe(EComunidadID.Andalucia)
    expect(legInto(ROUTE.length - 1)?.to).toBe(EComunidadID.Madrid)
    expect(legInto(ROUTE.length)).toBeUndefined()
  })
})
