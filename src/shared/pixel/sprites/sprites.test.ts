import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AVATAR_LOOK,
  EAvatarPose,
  EFacialHair,
  EHairColor,
  EHairStyle,
  EOutfitColor,
  ESkinTone,
  type AvatarLook,
} from '@/contracts/avatar'
import { EComunidadID } from '@/contracts/comunidad'
import { PIXEL_PALETTE } from '../palette'
import { spriteSize, type Sprite } from '../sprite'
import { avatarLegend } from './avatar'
import { compose, loopFrame, SpriteCache } from './compose'
import {
  AVATAR_HEIGHT,
  AVATAR_WIDTH,
  avatarFrameCount,
  avatarSprite,
  boatSprite,
  EStopState,
  fireworkFrames,
  flagSprite,
  HAIR_COLORS,
  landmarkSprite,
  OUTFIT_COLORS,
  planeSprite,
  SKIN_COLORS,
  stopSprite,
} from './index'

const LOOK: AvatarLook = {
  skin: ESkinTone.Dark,
  hairStyle: EHairStyle.Curly,
  hairColor: EHairColor.Red,
  outfit: EOutfitColor.Teal,
  facialHair: EFacialHair.Beard,
  blush: false,
}

function sizesOf(sprites: readonly Sprite[]): string[] {
  return [...new Set(sprites.map((sprite) => JSON.stringify(spriteSize(sprite))))]
}

function pixels(sprite: Sprite): number {
  return sprite.rows.join('').replace(/\./g, '').length
}

describe('compose', () => {
  it('paints later layers over earlier ones and keeps what their dots leave', () => {
    const sprite = compose(3, 2, [{ rows: ['aaa', 'aaa'] }, { rows: ['b.b'], x: 0, y: 1 }], {
      a: 'red',
      b: 'blue',
    })
    expect(sprite.rows).toEqual(['aaa', 'bab'])
  })

  it('cuts off what falls outside the grid', () => {
    const sprite = compose(2, 2, [{ rows: ['aaa', 'aaa', 'aaa'], x: 1, y: 1 }], { a: 'red' })
    expect(sprite.rows).toEqual(['..', '.a'])
  })

  it('wraps frame numbers both ways and rounds them down', () => {
    expect(loopFrame(0, 4)).toBe(0)
    expect(loopFrame(5, 4)).toBe(1)
    expect(loopFrame(-1, 4)).toBe(3)
    expect(loopFrame(2.9, 4)).toBe(2)
    expect(loopFrame(Number.NaN, 4)).toBe(0)
  })

  it('builds a cached sprite once', () => {
    const cache = new SpriteCache()
    let builds = 0
    function build(): Sprite {
      builds += 1
      return { rows: ['a'], legend: { a: 'red' } }
    }
    expect(cache.get('k', build)).toBe(cache.get('k', build))
    expect(builds).toBe(1)
  })
})

describe('her character', () => {
  it('is the same size in every pose and frame', () => {
    const sprites = Object.values(EAvatarPose).flatMap((pose) =>
      Array.from({ length: avatarFrameCount(pose) }, (_, frame) => avatarSprite(LOOK, pose, frame))
    )
    expect(sizesOf(sprites)).toEqual([
      JSON.stringify({ width: AVATAR_WIDTH, height: AVATAR_HEIGHT }),
    ])
  })

  it('has a walk of 4 frames, an idle bob, a cheer and a sad pose of 2', () => {
    expect(avatarFrameCount(EAvatarPose.Walk)).toBe(4)
    expect(avatarFrameCount(EAvatarPose.Idle)).toBe(2)
    expect(avatarFrameCount(EAvatarPose.Cheer)).toBe(2)
    expect(avatarFrameCount(EAvatarPose.Sad)).toBe(2)
  })

  it('moves between the frames of every pose', () => {
    for (const pose of Object.values(EAvatarPose)) {
      const frames = Array.from({ length: avatarFrameCount(pose) }, (_, frame) =>
        avatarSprite(LOOK, pose, frame).rows.join('\n')
      )
      expect(frames[0]).not.toBe(frames[1])
    }
  })

  it('wraps the frame number and hands out the same sprite for the same look and frame', () => {
    const walk = avatarFrameCount(EAvatarPose.Walk)
    expect(avatarSprite(LOOK, EAvatarPose.Walk, walk + 1)).toBe(
      avatarSprite(LOOK, EAvatarPose.Walk, 1)
    )
    expect(avatarSprite({ ...LOOK }, EAvatarPose.Walk, -1)).toBe(
      avatarSprite(LOOK, EAvatarPose.Walk, walk - 1)
    )
  })

  it('takes her skin, hair and outfit colours from her look', () => {
    const sprite = avatarSprite(LOOK, EAvatarPose.Idle, 0)
    expect(sprite.legend.s).toBe(SKIN_COLORS[ESkinTone.Dark].base)
    expect(sprite.legend.h).toBe(HAIR_COLORS[EHairColor.Red].base)
    expect(sprite.legend.c).toBe(OUTFIT_COLORS[EOutfitColor.Teal].base)
    const rows = sprite.rows.join('')
    for (const key of ['s', 'S', 'h', 'H', 'c', 'C']) expect(rows).toContain(key)
  })

  it('draws every hairstyle differently', () => {
    const drawings = Object.values(EHairStyle).map((hairStyle) =>
      avatarSprite({ ...LOOK, hairStyle }, EAvatarPose.Idle, 0).rows.join('\n')
    )
    expect(new Set(drawings).size).toBe(drawings.length)
  })

  it('gives every choice its own colour', () => {
    for (const table of [SKIN_COLORS, HAIR_COLORS, OUTFIT_COLORS]) {
      const bases = Object.values(table).map((pair) => pair.base)
      expect(new Set(bases).size).toBe(bases.length)
      for (const pair of Object.values(table)) {
        expect(PIXEL_PALETTE[pair.base]).not.toBe(PIXEL_PALETTE[pair.second])
      }
    }
  })
})

describe('the route sprites', () => {
  it('draws the three stops at the same odd size, so one pixel is the centre', () => {
    const stops = Object.values(EStopState).map((state) => stopSprite(state))
    expect(sizesOf(stops)).toHaveLength(1)
    expect(spriteSize(stops[0] ?? stopSprite(EStopState.Ahead)).width % 2).toBe(1)
    expect(new Set(stops.map((sprite) => sprite.rows.join())).size).toBe(3)
  })

  it('waves the flag, turns the propeller and rocks the boat, frame size unchanged', () => {
    for (const frames of [
      [flagSprite(0), flagSprite(1)],
      [planeSprite(0), planeSprite(1)],
      [boatSprite(DEFAULT_AVATAR_LOOK, 0), boatSprite(DEFAULT_AVATAR_LOOK, 1)],
    ]) {
      expect(sizesOf(frames)).toHaveLength(1)
      expect(frames[0]?.rows).not.toEqual(frames[1]?.rows)
    }
    expect(flagSprite(2)).toBe(flagSprite(0))
    expect(planeSprite(-1)).toBe(planeSprite(1))
  })

  it('puts her in the boat in her own colours', () => {
    const boat = boatSprite(LOOK, 0)
    const legend = avatarLegend(LOOK)
    for (const key of Object.keys(legend)) expect(boat.legend[key]).toBe(legend[key])
    expect(boat.rows.join('')).toContain('h')
    expect(boatSprite(LOOK, 0)).toBe(boat)
  })

  it('keeps the fireworks in place and lets them burst and fade', () => {
    const frames = fireworkFrames()
    expect(frames.length).toBeGreaterThanOrEqual(4)
    expect(sizesOf(frames)).toHaveLength(1)
    const burst = Math.max(...frames.map(pixels))
    expect(pixels(frames[0] ?? frames[1] ?? stopSprite(EStopState.Ahead))).toBeLessThan(burst)
  })

  it('has a different 16 × 16 landmark for every comunidad', () => {
    const landmarks = Object.values(EComunidadID).map((id) => landmarkSprite(id))
    expect(sizesOf(landmarks)).toEqual([JSON.stringify({ width: 16, height: 16 })])
    expect(new Set(landmarks.map((sprite) => sprite.rows.join())).size).toBe(landmarks.length)
    for (const landmark of landmarks) expect(pixels(landmark)).toBeGreaterThan(60)
  })
})
