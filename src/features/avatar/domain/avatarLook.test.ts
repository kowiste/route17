import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AVATAR_LOOK,
  EFacialHair,
  EHairColor,
  EHairStyle,
  EOutfitColor,
  ESkinTone,
  type AvatarLook,
} from '@/contracts/avatar'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import {
  AVATAR_CHOICES,
  changeLook,
  defaultLook,
  lookFromV1,
  lookOrDefault,
  sameLook,
  validateLook,
} from './avatarLook'

const LOOK: AvatarLook = {
  skin: ESkinTone.Medium,
  hairStyle: EHairStyle.Bun,
  hairColor: EHairColor.Grey,
  outfit: EOutfitColor.Purple,
  facialHair: EFacialHair.Beard,
  blush: true,
}

function invalidInput(run: () => unknown): AppError {
  try {
    run()
  } catch (error) {
    if (error instanceof AppError) return error
  }
  throw new Error('expected an AppError')
}

describe('her look', () => {
  it('starts as the default look', () => {
    expect(defaultLook()).toEqual(DEFAULT_AVATAR_LOOK)
    expect(lookOrDefault(null)).toEqual(DEFAULT_AVATAR_LOOK)
    expect(lookOrDefault(LOOK)).toBe(LOOK)
  })

  it('offers every value of every part, once', () => {
    expect(AVATAR_CHOICES.skin).toEqual(Object.values(ESkinTone))
    expect(AVATAR_CHOICES.hairStyle).toEqual(Object.values(EHairStyle))
    expect(AVATAR_CHOICES.hairColor).toEqual(Object.values(EHairColor))
    expect(AVATAR_CHOICES.outfit).toEqual(Object.values(EOutfitColor))
    expect(AVATAR_CHOICES.facialHair).toEqual(Object.values(EFacialHair))
    expect(AVATAR_CHOICES.blush).toEqual([true, false])
  })

  it('accepts a look whose parts are all choices', () => {
    expect(validateLook({ ...LOOK })).toEqual(LOOK)
  })

  it('refuses a missing part, an unknown value or an extra field', () => {
    const missing = invalidInput(() => validateLook({ skin: ESkinTone.Dark }))
    expect(missing.code).toBe(EErrorCode.InvalidInput)
    expect(invalidInput(() => validateLook({ ...LOOK, outfit: 'gold' })).details.fields).toEqual([
      'outfit',
    ])
    expect(invalidInput(() => validateLook({ ...LOOK, hat: 'yes' })).code).toBe(
      EErrorCode.InvalidInput
    )
    expect(invalidInput(() => validateLook('pelo largo')).code).toBe(EErrorCode.InvalidInput)
  })

  it('changes one part and keeps the others', () => {
    expect(changeLook(LOOK, { hairStyle: EHairStyle.Curly })).toEqual({
      ...LOOK,
      hairStyle: EHairStyle.Curly,
    })
  })

  it('refuses a change to a value that is not a choice', () => {
    const change: Partial<AvatarLook> = JSON.parse('{"skin":"green"}')
    expect(invalidInput(() => changeLook(LOOK, change)).code).toBe(EErrorCode.InvalidInput)
  })

  it('compares looks part by part', () => {
    expect(sameLook(LOOK, { ...LOOK })).toBe(true)
    expect(sameLook(LOOK, { ...LOOK, hairColor: EHairColor.Black })).toBe(false)
    expect(sameLook(LOOK, { ...LOOK, facialHair: EFacialHair.Moustache })).toBe(false)
    expect(sameLook(LOOK, { ...LOOK, blush: !LOOK.blush })).toBe(false)
  })

  it('upgrades a first-version look without changing how it looks', () => {
    const { facialHair: _facialHair, blush: _blush, ...old } = LOOK
    expect(lookFromV1(old)).toEqual({ ...old, facialHair: EFacialHair.None, blush: true })
  })
})
