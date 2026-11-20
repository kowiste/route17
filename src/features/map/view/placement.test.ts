import { describe, expect, it } from 'vitest'
import { DEFAULT_AVATAR_LOOK, EAvatarPose } from '@/contracts/avatar'
import { EComunidadID } from '@/contracts/comunidad'
import { ROUTE, SAFE_RUNGS } from '@/contracts/route'
import { spriteSize } from '@/shared/pixel/sprite'
import {
  avatarFrameCount,
  avatarSprite,
  EStopState,
  flagSprite,
  landmarkSprite,
  stopSprite,
} from '@/shared/pixel/sprites'
import { LEGS } from '../domain/legs'
import type { MapRect } from '../domain/lowPolyMap'
import { legPath, pathLength, positionAlong } from '../domain/path'
import { spainLowPoly } from '../infra/spainLowPoly'
import {
  AVATAR_BOX,
  avatarBox,
  FLAG_BOX,
  flagBox,
  LANDMARK_BOX,
  LANDMARK_SIDES,
  landmarkBox,
  onBoxCorner,
  onBoxFloor,
  overlaps,
  STOP_BOX,
  stopBox,
} from './placement'

const map = spainLowPoly()
const landmarks = ROUTE.map((id) => ({ id, box: landmarkBox(map.anchors[id], LANDMARK_SIDES[id]) }))
const safeStops = SAFE_RUNGS.map((rung) => ROUTE[rung - 1] ?? EComunidadID.Madrid)

function inside(inner: MapRect, outer: MapRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

describe('where the sprites go', () => {
  it('keeps every landmark on the map, and Canarias’s inside its inset', () => {
    const whole = { x: 0, y: 0, width: map.width, height: map.height }
    for (const { id, box } of landmarks) expect(inside(box, whole), id).toBe(true)
    const teide = landmarks.find(({ id }) => id === EComunidadID.Canarias)
    expect(teide !== undefined && inside(teide.box, map.inset)).toBe(true)
  })

  it('never lets two landmarks overlap', () => {
    for (const a of landmarks) {
      for (const b of landmarks) {
        if (a.id !== b.id) expect(overlaps(a.box, b.box), `${a.id} / ${b.id}`).toBe(false)
      }
    }
  })

  it('never covers a stop, or her standing at any stop', () => {
    for (const { id, box } of landmarks) {
      for (const stop of ROUTE) {
        const anchor = map.anchors[stop]
        expect(overlaps(box, stopBox(anchor)), `${id} over stop ${stop}`).toBe(false)
        expect(overlaps(box, avatarBox(anchor)), `${id} over her at ${stop}`).toBe(false)
      }
    }
  })

  it('never covers a checkpoint flag', () => {
    for (const stop of safeStops) {
      const flag = flagBox(map.anchors[stop])
      for (const { id, box } of landmarks) expect(overlaps(box, flag), `${id} / flag`).toBe(false)
    }
  })

  it('never hides the route', () => {
    for (const leg of LEGS) {
      const path = legPath(map, leg)
      const length = pathLength(path)
      for (let at = 0; at <= length; at += 2) {
        const { point } = positionAlong(path, at)
        const dot = { x: point.x - 3, y: point.y - 3, width: 6, height: 6 }
        for (const { id, box } of landmarks) {
          expect(overlaps(box, dot), `${id} hides ${leg.from} → ${leg.to}`).toBe(false)
        }
        for (const stop of safeStops) {
          const flag = flagBox(map.anchors[stop])
          expect(overlaps(flag, dot), `the flag of ${stop} hides ${leg.to}`).toBe(false)
        }
      }
    }
  })

  it('sits a sprite on the floor of its box, centred or in the corner', () => {
    const sprite = { rows: ['ab', 'ab'], legend: { a: 'red', b: 'blue' } } as const
    expect(onBoxFloor(sprite, { x: 0, y: 0, width: 20, height: 20 })).toEqual({ x: 7.5, y: 15 })
    expect(onBoxCorner(sprite, { x: 0, y: 0, width: 20, height: 20 })).toEqual({ x: 0, y: 15 })
  })

  it('reserves room for the real art', () => {
    const sizes = [
      ...ROUTE.map((id) => [spriteSize(landmarkSprite(id)), LANDMARK_BOX, LANDMARK_BOX] as const),
      ...[0, 1].map(
        (frame) => [spriteSize(flagSprite(frame)), FLAG_BOX.width, FLAG_BOX.height] as const
      ),
      ...Object.values(EStopState).map(
        (state) => [spriteSize(stopSprite(state)), STOP_BOX, STOP_BOX] as const
      ),
      ...Object.values(EAvatarPose).flatMap((pose) =>
        Array.from({ length: avatarFrameCount(pose) }, (_, frame) => {
          const size = spriteSize(avatarSprite(DEFAULT_AVATAR_LOOK, pose, frame))
          return [size, AVATAR_BOX.width, AVATAR_BOX.height] as const
        })
      ),
    ]
    for (const [size, width, height] of sizes) {
      expect(size.width).toBeLessThanOrEqual(width)
      expect(size.height).toBeLessThanOrEqual(height)
    }
  })
})
