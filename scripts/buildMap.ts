// Builds the low-poly map of Spain from Natural Earth's admin-1 GeoJSON (public
// domain), a one-off source of outlines that is never committed:
//
//   pnpm build:map                      writes src/features/map/infra/spainLowPoly.json
//   pnpm build:map --preview map.svg    also writes an SVG to look at
//
// The provinces are merged into comunidades by dropping the edges two provinces
// of the same comunidad share (Natural Earth's neighbours share identical
// vertices). Every border is then simplified once, with the points where three
// areas meet locked, so neighbours keep matching borders with no gaps. The
// neighbouring countries are merged into one "abroad" outline for context.
// Canarias goes in an inset box at the bottom left. Self-contained on purpose:
// Node runs it with type stripping only, so no enums and no `@/` imports.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Point = [number, number]

interface Ring {
  label: string
  keys: string[]
}

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE = resolve(ROOT, 'mapdata/ne_10m_admin_1_states_provinces.geojson')
const TARGET = resolve(ROOT, 'src/features/map/infra/spainLowPoly.json')

/** The viewBox: 0 0 WIDTH HEIGHT. */
const WIDTH = 1000
const HEIGHT = 800
/** Space between the mainland and the edges of the viewBox. */
const MARGIN = 28
/** How far a simplified border may stray from the real one, in viewBox units. */
const TOLERANCE = 9
/** Canarias is drawn smaller, so its islands keep a little more of their shape. */
const CANARIAS_TOLERANCE = 4
/** Islands, enclaves and holes smaller than this (km²) are dropped, except Ceuta and Melilla. */
const MIN_AREA_KM2 = 120
/** Canarias in the inset, relative to the mainland's scale: as large as the corner allows. */
const CANARIAS_MAX_SCALE = 1
const CANARIAS_MIN_SCALE = 0.6
const INSET_PADDING = 12
const INSET_MARGIN = 10
/** Room between the inset and the mainland. */
const INSET_GAP = 8
/** An anchor keeps at least this much room to its comunidad's border, when the shape allows it. */
const ANCHOR_CLEARANCE = 16
/** The neighbouring countries are cut this far outside the viewBox (a wide screen shows more). */
const ABROAD_MARGIN = 250
const LABEL_ABROAD = 'abroad'
const LABEL_SEA = 'sea'
const CANARIAS = 'canarias'

/** Natural Earth's `region` → the game's ID (EComunidadID values, plus Ceuta and Melilla). */
const REGIONS: Record<string, string> = {
  Andalucía: 'andalucia',
  Aragón: 'aragon',
  Asturias: 'asturias',
  'Islas Baleares': 'baleares',
  'Canary Is.': 'canarias',
  Cantabria: 'cantabria',
  'Castilla-La Mancha': 'castilla-la-mancha',
  'Castilla y León': 'castilla-y-leon',
  Cataluña: 'cataluna',
  Valenciana: 'valenciana',
  Extremadura: 'extremadura',
  Galicia: 'galicia',
  Madrid: 'madrid',
  Murcia: 'murcia',
  'Foral de Navarra': 'navarra',
  'País Vasco': 'pais-vasco',
  'La Rioja': 'rioja',
  Ceuta: 'ceuta',
  Melilla: 'melilla',
}

/** Kept even though they are tiny. */
const ALWAYS_KEPT = new Set(['ceuta', 'melilla'])

/** Neighbouring countries, drawn as one muted "abroad" shape. */
const NEIGHBOURS = new Set(['PRT', 'FRA', 'AND', 'GIB', 'MAR', 'DZA'])

/** Where each stop should go (lon, lat): a capital or a landmark, moved inside if too close to a border. */
const PREFERRED_ANCHORS: Record<string, Point> = {
  canarias: [-16.55, 28.3],
  andalucia: [-5.0, 37.4],
  murcia: [-1.45, 38.0],
  valenciana: [-0.55, 39.45],
  baleares: [2.95, 39.62],
  cataluna: [1.95, 41.6],
  aragon: [-0.88, 41.65],
  navarra: [-1.64, 42.75],
  rioja: [-2.5, 42.3],
  'pais-vasco': [-2.6, 43.1],
  cantabria: [-4.0, 43.18],
  asturias: [-5.9, 43.3],
  galicia: [-8.0, 42.75],
  'castilla-y-leon': [-4.72, 41.65],
  extremadura: [-6.2, 39.1],
  'castilla-la-mancha': [-3.3, 39.35],
  madrid: [-3.7, 40.42],
}

// --- Reading -------------------------------------------------------------------

interface Feature {
  adm0: string
  region: string
  polygons: Point[][][]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toPoint(value: unknown): Point {
  if (!Array.isArray(value) || typeof value[0] !== 'number' || typeof value[1] !== 'number') {
    throw new Error('a coordinate is not [lon, lat]')
  }
  return [value[0], value[1]]
}

function toPolygon(value: unknown): Point[][] {
  if (!Array.isArray(value)) throw new Error('a polygon is not a list of rings')
  return value.map((ring: unknown) => {
    if (!Array.isArray(ring)) throw new Error('a ring is not a list of points')
    return ring.map(toPoint)
  })
}

function readFeatures(path: string): Feature[] {
  const data: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!isRecord(data) || !Array.isArray(data.features)) throw new Error(`${path} is not GeoJSON`)
  const features: Feature[] = []
  for (const item of data.features) {
    if (!isRecord(item) || !isRecord(item.properties) || !isRecord(item.geometry)) continue
    const adm0 = String(item.properties.adm0_a3)
    const region = String(item.properties.region ?? '').normalize('NFC')
    const { type, coordinates } = item.geometry
    if (!Array.isArray(coordinates)) continue
    const polygons =
      type === 'Polygon'
        ? [toPolygon(coordinates)]
        : type === 'MultiPolygon'
          ? coordinates.map(toPolygon)
          : []
    features.push({ adm0, region, polygons })
  }
  return features
}

// --- Geometry --------------------------------------------------------------------

function keyOf(point: Point): string {
  return `${point[0]},${point[1]}`
}

function signedArea(points: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i] as Point
    const b = points[(i + 1) % points.length] as Point
    sum += a[0] * b[1] - b[0] * a[1]
  }
  return sum / 2
}

/** Rough area of a lon/lat ring in km². */
function areaKm2(points: readonly Point[]): number {
  const lat = points.reduce((sum, p) => sum + p[1], 0) / Math.max(1, points.length)
  const kmPerLon = 111.32 * Math.cos((lat * Math.PI) / 180)
  return Math.abs(signedArea(points)) * kmPerLon * 110.57
}

function mercatorY(lat: number): number {
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lengthSquared = dx * dx + dy * dy
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/** Douglas–Peucker: the indices of the points kept; the two ends always stay. */
function simplifyLine(points: readonly Point[], tolerance: number): number[] {
  const keep = new Set([0, points.length - 1])
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number]
    let farthest = -1
    let distance = tolerance
    for (let i = from + 1; i < to; i++) {
      const d = distanceToSegment(points[i] as Point, points[from] as Point, points[to] as Point)
      if (d > distance) {
        distance = d
        farthest = i
      }
    }
    if (farthest >= 0) {
      keep.add(farthest)
      stack.push([from, farthest], [farthest, to])
    }
  }
  return [...keep].sort((a, b) => a - b)
}

function insideRings(point: Point, rings: readonly (readonly Point[])[]): boolean {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i] as Point
      const b = ring[j] as Point
      if (a[1] > point[1] !== b[1] > point[1]) {
        const x = a[0] + ((point[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
        if (point[0] < x) inside = !inside
      }
    }
  }
  return inside
}

function distanceToRings(point: Point, rings: readonly (readonly Point[])[]): number {
  let best = Infinity
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const d = distanceToSegment(point, ring[i] as Point, ring[(i + 1) % ring.length] as Point)
      best = Math.min(best, d)
    }
  }
  return best
}

/** Sutherland–Hodgman against one side of the box; `inside` and `cross` describe that side. */
function clipSide(
  ring: readonly Point[],
  inside: (p: Point) => boolean,
  cross: (a: Point, b: Point) => Point
): Point[] {
  const result: Point[] = []
  for (let i = 0; i < ring.length; i++) {
    const current = ring[i] as Point
    const previous = ring[(i + ring.length - 1) % ring.length] as Point
    if (inside(current)) {
      if (!inside(previous)) result.push(cross(previous, current))
      result.push(current)
    } else if (inside(previous)) {
      result.push(cross(previous, current))
    }
  }
  return result
}

function clipToBox(
  ring: readonly Point[],
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Point[] {
  function atX(x: number) {
    return (a: Point, b: Point): Point => [x, a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]
  }
  function atY(y: number) {
    return (a: Point, b: Point): Point => [a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), y]
  }
  let clipped = clipSide(ring, (p) => p[0] >= x0, atX(x0))
  clipped = clipSide(clipped, (p) => p[0] <= x1, atX(x1))
  clipped = clipSide(clipped, (p) => p[1] >= y0, atY(y0))
  return clipSide(clipped, (p) => p[1] <= y1, atY(y1))
}

// --- Merging provinces into comunidades ------------------------------------------

function labelOf(feature: Feature): string | undefined {
  if (feature.adm0 === 'ESP') {
    const label = REGIONS[feature.region]
    if (label === undefined) throw new Error(`unknown Spanish region "${feature.region}"`)
    return label
  }
  return NEIGHBOURS.has(feature.adm0) ? LABEL_ABROAD : undefined
}

/** Near enough to Spain to matter: drops overseas France and the south of Algeria. */
function nearSpain(ring: readonly Point[]): boolean {
  return ring.some(([lon, lat]) => lon > -19 && lon < 8 && lat > 27 && lat < 47)
}

/**
 * Every ring of every label, provinces dissolved: an edge two provinces of the
 * same label share is dropped, and the edges left are chained back into rings.
 */
function dissolve(features: readonly Feature[], coords: Map<string, Point>): Ring[] {
  const edgesByLabel = new Map<string, Map<string, [string, string]>>()
  for (const feature of features) {
    const label = labelOf(feature)
    if (label === undefined) continue
    for (const polygon of feature.polygons) {
      if (!nearSpain(polygon[0] ?? [])) continue
      polygon.forEach((ring, index) => {
        const open = ring.slice(0, -1)
        // Outer rings counter-clockwise, holes clockwise: the area is always on the left.
        const counterClockwise = signedArea(open) > 0
        const oriented = counterClockwise === (index === 0) ? open : [...open].reverse()
        const edges = edgesByLabel.get(label) ?? new Map<string, [string, string]>()
        edgesByLabel.set(label, edges)
        oriented.forEach((point, i) => {
          const next = oriented[(i + 1) % oriented.length] as Point
          const from = keyOf(point)
          const to = keyOf(next)
          if (from === to) return
          coords.set(from, point)
          const reverse = `${to}>${from}`
          if (edges.has(reverse)) edges.delete(reverse)
          else edges.set(`${from}>${to}`, [from, to])
        })
      })
    }
  }
  const rings: Ring[] = []
  for (const [label, edges] of edgesByLabel) {
    const outgoing = new Map<string, string[]>()
    for (const [from, to] of edges.values()) {
      outgoing.set(from, [...(outgoing.get(from) ?? []), to])
    }
    for (const start of [...outgoing.keys()]) {
      while ((outgoing.get(start)?.length ?? 0) > 0) {
        const keys: string[] = []
        let at = start
        do {
          keys.push(at)
          const nexts = outgoing.get(at) ?? []
          const next = nexts.shift()
          if (next === undefined) throw new Error(`the outline of ${label} does not close`)
          at = next
        } while (at !== start)
        rings.push({ label, keys })
      }
    }
  }
  return rings
}

// --- Simplifying the shared borders ------------------------------------------------

/** Where three or more areas meet (the sea counts as one): these points never move. */
function junctions(rings: readonly Ring[]): Set<string> {
  const edgeLabels = new Map<string, Set<string>>()
  for (const ring of rings) {
    ring.keys.forEach((from, i) => {
      const to = ring.keys[(i + 1) % ring.keys.length] as string
      const key = from < to ? `${from}|${to}` : `${to}|${from}`
      const labels = edgeLabels.get(key) ?? new Set<string>()
      labels.add(ring.label)
      edgeLabels.set(key, labels)
    })
  }
  const around = new Map<string, Set<string>>()
  for (const [key, labels] of edgeLabels) {
    const all = labels.size === 1 ? [...labels, LABEL_SEA] : [...labels]
    for (const vertex of key.split('|')) {
      const set = around.get(vertex) ?? new Set<string>()
      all.forEach((label) => set.add(label))
      around.set(vertex, set)
    }
  }
  const result = new Set<string>()
  for (const [vertex, labels] of around) {
    if (labels.size >= 3) result.add(vertex)
  }
  // A vertex a ring passes twice (a pinch) is locked too.
  for (const ring of rings) {
    const seen = new Set<string>()
    for (const key of ring.keys) {
      if (seen.has(key)) result.add(key)
      seen.add(key)
    }
  }
  return result
}

/** The ring cut at its locked points: each piece runs from one locked point to the next. */
function sections(keys: readonly string[], locked: ReadonlySet<string>, at: Map<string, Point>) {
  let locks = keys.map((key, i) => (locked.has(key) ? i : -1)).filter((i) => i >= 0)
  if (locks.length < 2) {
    // A ring with no junction (an island, an enclave): lock its smallest key and the point
    // farthest from it, the same two points whichever side of the border asks.
    const first = keys.reduce((best, key, i) => (key < (keys[best] as string) ? i : best), 0)
    const origin = at.get(keys[first] as string) as Point
    let far = first
    let farDistance = -1
    keys.forEach((key, i) => {
      const p = at.get(key) as Point
      const d = Math.hypot(p[0] - origin[0], p[1] - origin[1])
      if (d > farDistance) {
        farDistance = d
        far = i
      }
    })
    locks = [...new Set([...locks, first, far])].sort((a, b) => a - b)
  }
  const pieces: string[][] = []
  locks.forEach((from, i) => {
    const to = locks[(i + 1) % locks.length] as number
    const piece: string[] = []
    for (let j = from; ; j = (j + 1) % keys.length) {
      piece.push(keys[j] as string)
      if (j === to && piece.length > 1) break
    }
    pieces.push(piece)
  })
  return pieces
}

function simplifyRings(
  rings: readonly Ring[],
  at: Map<string, Point>,
  toleranceOf: (label: string) => number
): Map<string, Point[][]> {
  const locked = junctions(rings)
  const cache = new Map<string, string[]>()
  function simplifyPiece(piece: string[], ringTolerance: number): string[] {
    const backward = [...piece].reverse()
    const forwardID = `${piece[0]}|${piece[1]}`
    const backwardID = `${backward[0]}|${backward[1]}`
    const canonical = forwardID <= backwardID ? piece : backward
    const cacheKey = `${ringTolerance}|${canonical[0]}|${canonical[1]}|${canonical.at(-1)}|${canonical.length}`
    let simplified = cache.get(cacheKey)
    if (simplified === undefined) {
      const points = canonical.map((key) => at.get(key) as Point)
      simplified = simplifyLine(points, ringTolerance).map((i) => canonical[i] as string)
      cache.set(cacheKey, simplified)
    }
    return canonical === piece ? simplified : [...simplified].reverse()
  }
  const result = new Map<string, Point[][]>()
  for (const ring of rings) {
    let points: Point[] = []
    const tolerance = toleranceOf(ring.label)
    for (let ringTolerance = tolerance; ringTolerance > 0.5; ringTolerance /= 2) {
      const keys = sections(ring.keys, locked, at).flatMap((piece) =>
        simplifyPiece(piece, ringTolerance).slice(0, -1)
      )
      points = dedupe(keys.map((key) => at.get(key) as Point).map(roundPoint))
      if (points.length >= 4 || (points.length >= 3 && ringTolerance < tolerance)) break
    }
    if (points.length < 3) continue
    result.set(ring.label, [...(result.get(ring.label) ?? []), points])
  }
  return result
}

function roundPoint(point: Point): Point {
  return [Math.round(point[0]), Math.round(point[1])]
}

function dedupe(points: readonly Point[]): Point[] {
  const result: Point[] = []
  for (const point of points) {
    const last = result.at(-1)
    if (last === undefined || last[0] !== point[0] || last[1] !== point[1]) result.push(point)
  }
  const first = result[0]
  const last = result.at(-1)
  if (result.length > 1 && first && last && first[0] === last[0] && first[1] === last[1]) {
    result.pop()
  }
  return result
}

// --- Projection and layout -------------------------------------------------------

interface Layout {
  mainland(lonLat: Point): Point
  canarias(lonLat: Point): Point
  inset: [number, number, number, number]
}

function bounds(points: Iterable<Point>): [number, number, number, number] {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of points) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  return [x0, y0, x1, y1]
}

/** Mercator for everything; the mainland fills the viewBox on the right, Canarias sits in the inset. */
function layout(rings: readonly Ring[], at: Map<string, Point>): Layout {
  function project(lonLat: Point): Point {
    return [lonLat[0], -mercatorY(lonLat[1])]
  }
  function pointsOf(predicate: (label: string) => boolean): Point[] {
    return rings
      .filter((ring) => predicate(ring.label))
      .flatMap((ring) => ring.keys.map((key) => project(at.get(key) as Point)))
  }
  const [mx0, my0, mx1, my1] = bounds(
    pointsOf((label) => label !== CANARIAS && label !== LABEL_ABROAD)
  )
  const scale = Math.min((WIDTH - 2 * MARGIN) / (mx1 - mx0), (HEIGHT - 2 * MARGIN) / (my1 - my0))
  const offsetX = WIDTH - MARGIN - (mx1 - mx0) * scale
  const offsetY = (HEIGHT - (my1 - my0) * scale) / 2
  function mainland(lonLat: Point): Point {
    const [x, y] = project(lonLat)
    return [offsetX + (x - mx0) * scale, offsetY + (y - my0) * scale]
  }
  const [cx0, cy0, cx1, cy1] = bounds(pointsOf((label) => label === CANARIAS))
  const spain = pointsOf((label) => label !== CANARIAS && label !== LABEL_ABROAD).map(
    ([x, y]): Point => [offsetX + (x - mx0) * scale, offsetY + (y - my0) * scale]
  )
  function insetAt(canariasScale: number): [number, number, number, number] {
    const width = Math.round((cx1 - cx0) * canariasScale + 2 * INSET_PADDING)
    const height = Math.round((cy1 - cy0) * canariasScale + 2 * INSET_PADDING)
    return [INSET_MARGIN, HEIGHT - INSET_MARGIN - height, width, height]
  }
  function isFree([x, y, width, height]: [number, number, number, number]): boolean {
    return !spain.some(
      ([px, py]) =>
        px > x - INSET_GAP &&
        px < x + width + INSET_GAP &&
        py > y - INSET_GAP &&
        py < y + height + INSET_GAP
    )
  }
  // Canarias as large as the corner allows.
  let relative = CANARIAS_MAX_SCALE
  while (relative > CANARIAS_MIN_SCALE && !isFree(insetAt(scale * relative))) relative -= 0.01
  const canariasScale = scale * relative
  const inset = insetAt(canariasScale)
  console.log(`Canarias at ${relative.toFixed(2)} of the mainland's scale`)
  function canarias(lonLat: Point): Point {
    const [x, y] = project(lonLat)
    return [
      inset[0] + INSET_PADDING + (x - cx0) * canariasScale,
      inset[1] + INSET_PADDING + (y - cy0) * canariasScale,
    ]
  }
  return { mainland, canarias, inset }
}

// --- Anchors -------------------------------------------------------------------

/** The stop: the preferred point if it has room around it, else the nearest point that does. */
function anchorFor(preferred: Point, rings: readonly Point[][]): Point {
  const [x0, y0, x1, y1] = bounds(rings.flat())
  const candidates: { point: Point; clearance: number }[] = []
  for (let y = Math.ceil(y0); y <= y1; y += 2) {
    for (let x = Math.ceil(x0); x <= x1; x += 2) {
      const point: Point = [x, y]
      if (insideRings(point, rings)) {
        candidates.push({ point, clearance: distanceToRings(point, rings) })
      }
    }
  }
  const roomiest = Math.max(...candidates.map((c) => c.clearance))
  const needed = Math.min(ANCHOR_CLEARANCE, roomiest * 0.6)
  const start = roundPoint(preferred)
  if (insideRings(start, rings) && distanceToRings(start, rings) >= needed) return start
  let best: Point | undefined
  let bestDistance = Infinity
  for (const { point, clearance } of candidates) {
    const d = Math.hypot(point[0] - preferred[0], point[1] - preferred[1])
    if (clearance >= needed && d < bestDistance) {
      best = point
      bestDistance = d
    }
  }
  if (best === undefined) throw new Error('no room for an anchor')
  return best
}

// --- Output --------------------------------------------------------------------

function flat(ring: readonly Point[]): number[] {
  return ring.flatMap((p) => [p[0], p[1]])
}

function previewSvg(
  regions: Map<string, Point[][]>,
  abroad: Point[][],
  anchors: Record<string, Point>,
  inset: [number, number, number, number]
): string {
  const colours = ['#8fd14f', '#e8c97a', '#d9a066', '#4fa83d', '#f4e8c1']
  function path(rings: readonly Point[][]): string {
    return rings.map((ring) => `M${ring.map((p) => p.join(',')).join('L')}Z`).join('')
  }
  const shapes = [...regions.entries()].map(
    ([label, rings], i) =>
      `<path d="${path(rings)}" fill="${colours[i % colours.length]}" fill-rule="evenodd" stroke="#1a1423" stroke-width="2" stroke-linejoin="round"><title>${label}</title></path>`
  )
  const dots = Object.entries(anchors).map(
    ([label, [x, y]]) =>
      `<circle cx="${x}" cy="${y}" r="5" fill="#d7263d"/><text x="${x + 7}" y="${y + 4}" font-size="14">${label}</text>`
  )
  return [
    // Square, so Quick Look's square thumbnail (qlmanage -t) shows all of it.
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${WIDTH}" width="${WIDTH}" height="${WIDTH}">`,
    `<rect width="${WIDTH}" height="${WIDTH}" fill="#0d0b14"/>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="#2f7fc1"/>`,
    `<path d="${path(abroad)}" fill="#9c8f86" fill-rule="evenodd" stroke="#6e4024" stroke-width="2"/>`,
    `<rect x="${inset[0]}" y="${inset[1]}" width="${inset[2]}" height="${inset[3]}" fill="#2f7fc1" stroke="#fffaf0" stroke-width="3"/>`,
    ...shapes,
    ...dots,
    '</svg>',
  ].join('\n')
}

/** Nothing of the mainland may reach into the Canarias inset. */
function checkInset(
  regions: Map<string, Point[][]>,
  inset: [number, number, number, number]
): void {
  const [ix, iy, iw, ih] = inset
  for (const [label, rings] of regions) {
    if (rings.length === 0) throw new Error(`${label} has no outline`)
    if (label === CANARIAS) continue
    const intruder = rings
      .flat()
      .find(([x, y]) => x > ix - 6 && x < ix + iw + 6 && y > iy - 6 && y < iy + ih + 6)
    if (intruder !== undefined) {
      throw new Error(`${label} reaches into the Canarias inset at ${intruder.join(',')}`)
    }
  }
}

function main(): void {
  const features = readFeatures(SOURCE)
  const lonLat = new Map<string, Point>()
  const kept = dissolve(features, lonLat).filter(
    (ring) =>
      ALWAYS_KEPT.has(ring.label) ||
      areaKm2(ring.keys.map((key) => lonLat.get(key) as Point)) >= MIN_AREA_KM2
  )
  const { mainland, canarias, inset } = layout(kept, lonLat)
  const projected = new Map<string, Point>()
  for (const ring of kept) {
    const project = ring.label === CANARIAS ? canarias : mainland
    for (const key of ring.keys) projected.set(key, project(lonLat.get(key) as Point))
  }
  const simplified = simplifyRings(kept, projected, (label) =>
    label === CANARIAS ? CANARIAS_TOLERANCE : TOLERANCE
  )

  const abroad = (simplified.get(LABEL_ABROAD) ?? [])
    .map((ring) =>
      dedupe(
        clipToBox(
          ring,
          -ABROAD_MARGIN,
          -ABROAD_MARGIN,
          WIDTH + ABROAD_MARGIN,
          HEIGHT + ABROAD_MARGIN
        )
      ).map(roundPoint)
    )
    .map(dedupe)
    .filter((ring) => ring.length >= 3)
  const regions = new Map(
    [...new Set(Object.values(REGIONS))].map((label) => [label, simplified.get(label) ?? []])
  )

  const anchors: Record<string, Point> = {}
  for (const [label, preferred] of Object.entries(PREFERRED_ANCHORS)) {
    const project = label === CANARIAS ? canarias : mainland
    anchors[label] = anchorFor(project(preferred), regions.get(label) ?? [])
  }

  const output = {
    source: 'Natural Earth 1:10m admin-1 states and provinces (public domain)',
    width: WIDTH,
    height: HEIGHT,
    inset,
    regions: Object.fromEntries([...regions].map(([label, rings]) => [label, rings.map(flat)])),
    abroad: abroad.map(flat),
    anchors,
  }
  const previewIndex = process.argv.indexOf('--preview')
  const previewPath = previewIndex >= 0 ? process.argv[previewIndex + 1] : undefined
  if (previewPath !== undefined) {
    writeFileSync(previewPath, previewSvg(regions, abroad, anchors, inset))
  }
  checkInset(regions, inset)
  writeFileSync(TARGET, `${JSON.stringify(output)}\n`)

  for (const [label, rings] of regions) {
    const vertices = rings.reduce((sum, ring) => sum + ring.length, 0)
    console.log(
      `${label.padEnd(20)} ${String(rings.length).padStart(2)} rings ${vertices} vertices`
    )
  }
  const bytes = readFileSync(TARGET).length
  console.log(`abroad ${abroad.length} rings; wrote ${TARGET} (${bytes} bytes)`)
}

main()
