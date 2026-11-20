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
import { AppError } from '@/shared/errors/appError'
import type { IAvatarRepository } from '../domain/interface'
import { AvatarService } from './avatarService'

class FakeAvatarRepository implements IAvatarRepository {
  saved: AvatarLook | null = null
  saves = 0

  load(): AvatarLook | null {
    return this.saved
  }

  save(look: AvatarLook): void {
    this.saved = look
    this.saves += 1
  }
}

const LOOK: AvatarLook = {
  skin: ESkinTone.Light,
  hairStyle: EHairStyle.Ponytail,
  hairColor: EHairColor.Blonde,
  outfit: EOutfitColor.Green,
  facialHair: EFacialHair.Moustache,
  blush: false,
}

function setup(): { service: AvatarService; repository: FakeAvatarRepository } {
  const repository = new FakeAvatarRepository()
  return { service: new AvatarService({ repository }), repository }
}

describe('avatarService', () => {
  it('loads the default look when nothing is saved', () => {
    expect(setup().service.load()).toEqual(DEFAULT_AVATAR_LOOK)
  })

  it('saves her look and loads it back', () => {
    const { service, repository } = setup()
    expect(service.save(LOOK)).toEqual(LOOK)
    expect(repository.saved).toEqual(LOOK)
    expect(service.load()).toEqual(LOOK)
  })

  it('never saves a look that breaks the rules', () => {
    const { service, repository } = setup()
    const broken: AvatarLook = JSON.parse(
      '{"skin":"blue","hairStyle":"long","hairColor":"black","outfit":"red"}'
    )
    expect(() => service.save(broken)).toThrow(AppError)
    expect(repository.saves).toBe(0)
  })

  it('puts her back to the default look', () => {
    const { service, repository } = setup()
    service.save(LOOK)
    expect(service.reset()).toEqual(DEFAULT_AVATAR_LOOK)
    expect(repository.saved).toEqual(DEFAULT_AVATAR_LOOK)
  })
})
