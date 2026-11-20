// Her character: a body in a pose, a face, facial hair if she picked it and a
// hairstyle, coloured from her look. Faces the viewer; the map flips it
// (`flipX`) to walk left.

import { EAvatarPose, type AvatarLook } from '@/contracts/avatar'
import type { PixelColor } from '../palette'
import type { Sprite } from '../sprite'
import { HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS } from './avatarColors'
import { FACIAL_HAIR } from './avatarFacialHair'
import { HAIR_STYLES } from './avatarHair'
import { POSE_FRAMES } from './avatarPoses'
import { compose, loopFrame, SpriteCache, type Layer } from './compose'

export const AVATAR_WIDTH = 14
export const AVATAR_HEIGHT = 18
/** The row of the top of her head; the hair starts one row above it. */
const HEAD_Y = 1
/** The row her body starts on: her chin. */
const BODY_Y = 10

const cache = new SpriteCache()

/** The colour of every key her sprites use, for this look. */
export function avatarLegend(look: AvatarLook): Readonly<Record<string, PixelColor>> {
  const skin = SKIN_COLORS[look.skin]
  const hair = HAIR_COLORS[look.hairColor]
  const outfit = OUTFIT_COLORS[look.outfit]
  return {
    o: 'outline',
    e: 'black',
    m: 'redDark',
    k: look.blush ? 'blush' : skin.base,
    t: 'seaLight',
    p: 'denim',
    w: 'white',
    s: skin.base,
    S: skin.second,
    h: hair.base,
    H: hair.second,
    c: outfit.base,
    C: outfit.second,
  }
}

/** How many frames each pose has. */
export function avatarFrameCount(pose: EAvatarPose): number {
  return POSE_FRAMES[pose].length
}

/** One string per distinct look: the sprite caches key on it. */
export function lookKey(look: AvatarLook): string {
  return [
    look.skin,
    look.hairStyle,
    look.hairColor,
    look.outfit,
    look.facialHair,
    look.blush ? 'blush' : 'plain',
  ].join('|')
}

/** Her character in a pose, frame `frame` (wraps around). Faces the viewer; flip it to face left. */
export function avatarSprite(look: AvatarLook, pose: EAvatarPose, frame: number): Sprite {
  const frames = POSE_FRAMES[pose]
  const index = loopFrame(frame, frames.length)
  return cache.get(`${lookKey(look)}|${pose}|${index}`, () => {
    const step = frames[index] ?? frames[0]
    const hair = HAIR_STYLES[look.hairStyle]
    const facialHair = FACIAL_HAIR[look.facialHair]
    const headY = HEAD_Y + step.headDrop
    const layers: Layer[] = [
      { rows: hair.back, y: headY - 1 },
      { rows: step.body, y: BODY_Y },
      { rows: step.face, y: headY },
    ]
    if (facialHair !== null) layers.push({ rows: facialHair.rows, y: headY + facialHair.faceRow })
    layers.push({ rows: hair.front, y: headY - 1 })
    if (step.arms !== undefined) layers.push(step.arms)
    return compose(AVATAR_WIDTH, AVATAR_HEIGHT, layers, avatarLegend(look))
  })
}
