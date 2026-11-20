// The camera is the SVG viewBox. When the whole map fits at a readable size
// (a laptop, a tablet) it shows all of it; when it doesn't (a phone in
// portrait) it zooms in and keeps her in the middle, panning as she travels.
// The zoom is snapped so a sprite pixel is a whole number of device pixels.

import type { MapPoint, MapRect } from '../domain/lowPolyMap'
import { SPRITE_PIXEL } from './mapStyle'

/** Below this many CSS pixels per map unit, the whole map is too small to read: follow her instead. */
export const FOLLOW_BELOW = 0.55
/** CSS pixels per map unit while following her. */
export const FOLLOW_ZOOM = 1
/** The most the whole map may shrink so sprite pixels land on whole device pixels. */
const SNAP_LOSS = 0.15

export interface Viewport {
  /** CSS pixels. */
  readonly width: number
  readonly height: number
  readonly devicePixelRatio: number
}

export interface Camera {
  readonly viewBox: MapRect
  /** Zoomed in on her rather than showing the whole map. */
  readonly follows: boolean
  /** CSS pixels per map unit. */
  readonly zoom: number
}

function clamp(start: number, size: number, total: number): number {
  if (size >= total) return (total - size) / 2
  return Math.min(total - size, Math.max(0, start))
}

/** The viewBox for a viewport of this size, with `focus` (where she is) in view. */
export function cameraFor(
  viewport: Viewport,
  map: { readonly width: number; readonly height: number },
  focus: MapPoint
): Camera {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return {
      viewBox: { x: 0, y: 0, width: map.width, height: map.height },
      follows: false,
      zoom: 1,
    }
  }
  const ratio = viewport.devicePixelRatio > 0 ? viewport.devicePixelRatio : 1
  const fit = Math.min(viewport.width / map.width, viewport.height / map.height)
  const follows = fit < FOLLOW_BELOW
  const wanted = (follows ? FOLLOW_ZOOM : fit) * SPRITE_PIXEL * ratio
  // Down when fitting (the whole map must stay in view), to the nearest when following;
  // not at all when snapping down would shrink the map by more than SNAP_LOSS.
  const snapped = Math.max(1, follows ? Math.round(wanted) : Math.floor(wanted))
  const devicePixels = !follows && snapped < wanted * (1 - SNAP_LOSS) ? wanted : snapped
  const zoom = devicePixels / (SPRITE_PIXEL * ratio)
  const width = viewport.width / zoom
  const height = viewport.height / zoom
  const x = follows ? clamp(focus.x - width / 2, width, map.width) : (map.width - width) / 2
  const y = follows ? clamp(focus.y - height / 2, height, map.height) : (map.height - height) / 2
  return { viewBox: { x, y, width, height }, follows, zoom }
}
