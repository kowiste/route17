// The legs of the route: from each stop to the next, and how she travels it.

import { EComunidadID } from '@/contracts/comunidad'
import { ROUTE } from '@/contracts/route'

export enum ETravelMode {
  Walk = 'walk',
  Boat = 'boat',
  Plane = 'plane',
}

export interface Leg {
  /** The leg from stop `index` to stop `index + 1` (indexes in ROUTE). */
  readonly index: number
  readonly from: EComunidadID
  readonly to: EComunidadID
  readonly mode: ETravelMode
}

/** Pairs of comunidades with the sea between them on the route, either way round. */
const CROSSINGS: readonly { pair: readonly [EComunidadID, EComunidadID]; mode: ETravelMode }[] = [
  { pair: [EComunidadID.Canarias, EComunidadID.Andalucia], mode: ETravelMode.Plane },
  { pair: [EComunidadID.Valenciana, EComunidadID.Baleares], mode: ETravelMode.Boat },
  { pair: [EComunidadID.Baleares, EComunidadID.Cataluna], mode: ETravelMode.Boat },
]

/** How she gets from one comunidad to the next: by plane from Canarias, by boat to and from Baleares, else on foot. */
export function travelModeBetween(from: EComunidadID, to: EComunidadID): ETravelMode {
  const crossing = CROSSINGS.find(
    ({ pair }) => (pair[0] === from && pair[1] === to) || (pair[0] === to && pair[1] === from)
  )
  return crossing?.mode ?? ETravelMode.Walk
}

/** Every leg of the route, in order: 16 of them for 17 stops. */
export const LEGS: readonly Leg[] = ROUTE.slice(1).map((to, i) => {
  const from = ROUTE[i] ?? to
  return { index: i, from, to, mode: travelModeBetween(from, to) }
})

/** The leg that ends at this stop (index in ROUTE); none for the first stop. */
export function legInto(stop: number): Leg | undefined {
  return LEGS[stop - 1]
}
