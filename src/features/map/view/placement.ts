// Where each sprite goes on the map, in map units. Every sprite has a reserved
// box (in sprite pixels) at least as large as the art, so the layout holds when
// the art changes: a landmark beside its stop never covers another stop, the
// route, a flag or her standing at a stop.

import { EComunidadID } from '@/contracts/comunidad'
import { type Sprite, spriteSize } from '@/shared/pixel/sprite'
import { AVATAR_HEIGHT, AVATAR_WIDTH } from '@/shared/pixel/sprites'
import type { MapPoint, MapRect } from '../domain/lowPolyMap'
import { SPRITE_PIXEL } from './mapStyle'

/** Reserved boxes, in sprite pixels (the art: stops 9 × 9, landmarks 16 × 16, the flag 14 × 16). */
export const STOP_BOX = 10
export const AVATAR_BOX = { width: AVATAR_WIDTH, height: AVATAR_HEIGHT } as const
export const LANDMARK_BOX = 16
export const FLAG_BOX = { width: 14, height: 16 } as const
/** Her feet are this far below the stop's centre: she stands on the marker. */
const FEET = 2
const GAP = 1

export enum ESide {
  Left = 'left',
  Right = 'right',
  Below = 'below',
  AboveLeft = 'above-left',
  AboveRight = 'above-right',
}

/** Which side of its stop each landmark stands on: chosen so nothing overlaps (the tests check it). */
export const LANDMARK_SIDES: Readonly<Record<EComunidadID, ESide>> = {
  [EComunidadID.Canarias]: ESide.AboveRight,
  [EComunidadID.Andalucia]: ESide.AboveLeft,
  [EComunidadID.Murcia]: ESide.Below,
  [EComunidadID.Valenciana]: ESide.Left,
  [EComunidadID.Baleares]: ESide.Below,
  [EComunidadID.Cataluna]: ESide.AboveRight,
  [EComunidadID.Aragon]: ESide.Below,
  [EComunidadID.Navarra]: ESide.Right,
  [EComunidadID.Rioja]: ESide.Below,
  [EComunidadID.PaisVasco]: ESide.AboveLeft,
  [EComunidadID.Cantabria]: ESide.Below,
  [EComunidadID.Asturias]: ESide.Below,
  [EComunidadID.Galicia]: ESide.Left,
  [EComunidadID.CastillaYLeon]: ESide.Right,
  [EComunidadID.Extremadura]: ESide.Below,
  [EComunidadID.CastillaLaMancha]: ESide.Below,
  [EComunidadID.Madrid]: ESide.Right,
}

/** Where the fireworks burst, relative to Madrid's stop, in map units. */
const FIREWORK_SPOTS: readonly MapPoint[] = [
  { x: -34, y: -82 },
  { x: 6, y: -102 },
  { x: 36, y: -74 },
]

function units(spritePixels: number): number {
  return spritePixels * SPRITE_PIXEL
}

export function stopBox(anchor: MapPoint): MapRect {
  const half = units(STOP_BOX / 2)
  return { x: anchor.x - half, y: anchor.y - half, width: 2 * half, height: 2 * half }
}

/** The room she takes standing at a stop. */
export function avatarBox(anchor: MapPoint): MapRect {
  const width = units(AVATAR_BOX.width)
  const height = units(AVATAR_BOX.height)
  return { x: anchor.x - width / 2, y: anchor.y + units(FEET) - height, width, height }
}

export function landmarkBox(anchor: MapPoint, side: ESide): MapRect {
  const size = units(LANDMARK_BOX)
  const besideAvatar = units(AVATAR_BOX.width / 2 + GAP)
  const left = anchor.x - besideAvatar - size
  const right = anchor.x + besideAvatar
  const middle = anchor.y - size / 2
  const above = anchor.y - units(STOP_BOX / 2) - size
  switch (side) {
    case ESide.Left:
      return { x: left, y: middle, width: size, height: size }
    case ESide.Right:
      return { x: right, y: middle, width: size, height: size }
    case ESide.Below:
      return {
        x: anchor.x - size / 2,
        y: anchor.y + units(STOP_BOX / 2 + GAP),
        width: size,
        height: size,
      }
    case ESide.AboveLeft:
      return { x: left, y: above, width: size, height: size }
    case ESide.AboveRight:
      return { x: right, y: above, width: size, height: size }
  }
}

/** The flag of a checkpoint stands to the right of its stop, beside her; its pole's foot is the box's bottom-left corner. */
export function flagBox(anchor: MapPoint): MapRect {
  const width = units(FLAG_BOX.width)
  const height = units(FLAG_BOX.height)
  const bottom = anchor.y + units(STOP_BOX / 2)
  return { x: anchor.x + units(AVATAR_BOX.width / 2 + GAP), y: bottom - height, width, height }
}

/** The sprite's top-left corner so it sits centred on the bottom of a box. */
export function onBoxFloor(sprite: Sprite, box: MapRect): MapPoint {
  const { width, height } = spriteSize(sprite)
  return { x: box.x + (box.width - units(width)) / 2, y: box.y + box.height - units(height) }
}

/** The sprite's top-left corner so its bottom-left corner is the box's. */
export function onBoxCorner(sprite: Sprite, box: MapRect): MapPoint {
  const { height } = spriteSize(sprite)
  return { x: box.x, y: box.y + box.height - units(height) }
}

/** A sprite centred on a point. */
export function centredOn(sprite: Sprite, point: MapPoint): MapPoint {
  const { width, height } = spriteSize(sprite)
  return { x: point.x - units(width) / 2, y: point.y - units(height) / 2 }
}

/** Her sprite standing (or walking) with her feet on a point. */
export function standingOn(sprite: Sprite, point: MapPoint): MapPoint {
  const { width, height } = spriteSize(sprite)
  return { x: point.x - units(width) / 2, y: point.y + units(FEET) - units(height) }
}

/** The boat floats with its bottom a little below the point. */
export function floatingOn(sprite: Sprite, point: MapPoint): MapPoint {
  const { width, height } = spriteSize(sprite)
  return { x: point.x - units(width) / 2, y: point.y + units(FEET + 1) - units(height) }
}

/** Where each firework bursts over Madrid. */
export function fireworkSpots(madrid: MapPoint): MapPoint[] {
  return FIREWORK_SPOTS.map((spot) => ({ x: madrid.x + spot.x, y: madrid.y + spot.y }))
}

export function overlaps(a: MapRect, b: MapRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}
