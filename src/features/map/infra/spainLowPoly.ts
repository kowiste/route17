// Loads the low-poly map written by `scripts/buildMap.ts` (`pnpm build:map`):
// parsed with Zod, then mapped to the domain's shape.

import { z } from 'zod'
import { EComunidadID } from '@/contracts/comunidad'
import { EAutonomousCity, type LowPolyMap, type MapPoint, type MapRing } from '../domain/lowPolyMap'
import data from './spainLowPoly.json'

const coordinate = z.number().int()
/** A ring as flat coordinates: x1, y1, x2, y2… at least three corners. */
const flatRing = z
  .array(coordinate)
  .min(6)
  .refine((values) => values.length % 2 === 0, 'a ring needs pairs of coordinates')
const point = z.tuple([coordinate, coordinate])

const regionShapes = z.array(flatRing).min(1)

export const spainLowPolySchema = z.object({
  source: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  inset: z.tuple([coordinate, coordinate, coordinate, coordinate]),
  regions: z.record(z.enum({ ...EComunidadID, ...EAutonomousCity }), regionShapes),
  abroad: z.array(flatRing),
  anchors: z.record(z.enum(EComunidadID), point),
})

export type SpainLowPolyFile = z.infer<typeof spainLowPolySchema>

function toRing(values: readonly number[]): MapRing {
  const ring: MapPoint[] = []
  for (let i = 0; i + 1 < values.length; i += 2) {
    ring.push({ x: values[i] ?? 0, y: values[i + 1] ?? 0 })
  }
  return ring
}

function mapRecord<K extends string, A, B>(
  record: Record<K, A>,
  map: (value: A) => B
): Record<K, B> {
  const entries = Object.entries(record) as [K, A][]
  return Object.fromEntries(entries.map(([key, value]) => [key, map(value)])) as Record<K, B>
}

/** The file's shape mapped to the domain's: pure field mapping. */
export function toLowPolyMap(file: SpainLowPolyFile): LowPolyMap {
  const [x, y, width, height] = file.inset
  return {
    width: file.width,
    height: file.height,
    inset: { x, y, width, height },
    regions: mapRecord(file.regions, (rings) => rings.map(toRing)),
    abroad: file.abroad.map(toRing),
    anchors: mapRecord(file.anchors, ([px, py]) => ({ x: px, y: py })),
  }
}

let loaded: LowPolyMap | undefined

/** The map of Spain, parsed once. Throws if the committed file is broken (rebuild it with `pnpm build:map`). */
export function spainLowPoly(): LowPolyMap {
  loaded ??= toLowPolyMap(spainLowPolySchema.parse(data))
  return loaded
}
