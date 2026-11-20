import { describe, expect, it } from 'vitest'
import {
  EAvatarPose,
  EFacialHair,
  EHairColor,
  EHairStyle,
  EOutfitColor,
  ESkinTone,
  type AvatarLook,
} from '@/contracts/avatar'
import { EComunidadID } from '@/contracts/comunidad'
import { flipX, recolor, spriteProblems, spriteSize, type Sprite } from './sprite'
import {
  avatarFrameCount,
  avatarSprite,
  boatSprite,
  EStopState,
  fireworkFrames,
  flagSprite,
  landmarkSprite,
  planeSprite,
  stopSprite,
} from './sprites'

const tiny: Sprite = { rows: ['ab.', '.ba'], legend: { a: 'red', b: 'blue' } }

describe('sprite engine', () => {
  it('measures a sprite', () => {
    expect(spriteSize(tiny)).toEqual({ width: 3, height: 2 })
  })

  it('finds uneven rows and characters missing from the legend', () => {
    expect(spriteProblems(tiny)).toEqual([])
    expect(spriteProblems({ rows: ['ab', 'a'], legend: { a: 'red', b: 'blue' } })).toHaveLength(1)
    expect(spriteProblems({ rows: ['az'], legend: { a: 'red' } })).toHaveLength(1)
    expect(spriteProblems({ rows: [], legend: {} })).toHaveLength(1)
  })

  it('recolours without changing the drawing', () => {
    const teal = recolor(tiny, { a: 'teal' })
    expect(teal.rows).toBe(tiny.rows)
    expect(teal.legend).toEqual({ a: 'teal', b: 'blue' })
  })

  it('mirrors left to right', () => {
    expect(flipX(tiny).rows).toEqual(['.ba', 'ab.'])
  })
})

// Every sprite the catalog can return must be well formed: same-width rows and
// only colours from the palette. Agent S keeps this passing as the art grows.
describe('sprite catalog', () => {
  const looks: AvatarLook[] = Object.values(EHairStyle).flatMap((hairStyle) =>
    Object.values(ESkinTone).map((skin, i) => ({
      skin,
      hairStyle,
      hairColor:
        Object.values(EHairColor)[i % Object.values(EHairColor).length] ?? EHairColor.Black,
      outfit:
        Object.values(EOutfitColor)[i % Object.values(EOutfitColor).length] ?? EOutfitColor.Red,
      facialHair:
        Object.values(EFacialHair)[i % Object.values(EFacialHair).length] ?? EFacialHair.None,
      blush: i % 2 === 0,
    }))
  )

  function all(): { name: string; sprite: Sprite }[] {
    const list: { name: string; sprite: Sprite }[] = []
    for (const look of looks) {
      for (const pose of Object.values(EAvatarPose)) {
        for (let frame = 0; frame < avatarFrameCount(pose); frame++) {
          list.push({
            name: `avatar ${look.hairStyle}/${look.skin}/${look.facialHair} ${pose} ${frame}`,
            sprite: avatarSprite(look, pose, frame),
          })
        }
      }
      list.push({ name: `boat ${look.hairStyle}`, sprite: boatSprite(look, 0) })
      list.push({ name: `boat ${look.hairStyle} 1`, sprite: boatSprite(look, 1) })
    }
    for (const state of Object.values(EStopState))
      list.push({ name: `stop ${state}`, sprite: stopSprite(state) })
    for (const frame of [0, 1]) {
      list.push({ name: `flag ${frame}`, sprite: flagSprite(frame) })
      list.push({ name: `plane ${frame}`, sprite: planeSprite(frame) })
    }
    for (const id of Object.values(EComunidadID))
      list.push({ name: `landmark ${id}`, sprite: landmarkSprite(id) })
    fireworkFrames().forEach((sprite, i) => list.push({ name: `firework ${i}`, sprite }))
    return list
  }

  it('has only well-formed sprites', () => {
    const problems = all().flatMap(({ name, sprite }) =>
      spriteProblems(sprite).map((problem) => `${name}: ${problem}`)
    )
    expect(problems).toEqual([])
  })

  it('has at least one frame per pose', () => {
    for (const pose of Object.values(EAvatarPose)) expect(avatarFrameCount(pose)).toBeGreaterThan(0)
  })
})
