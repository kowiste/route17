import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import {
  DEFAULT_AVATAR_LOOK,
  EFacialHair,
  EHairColor,
  EHairStyle,
  EOutfitColor,
  ESkinTone,
  type AvatarLook,
} from '@/contracts/avatar'
import { EErrorCode } from '@/shared/errors/appError'
import { MemoryLogger } from '@/shared/logger/logger'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { createAvatarService } from '../feature'
import { AVATAR_STORE_DEPS, useAvatarStore } from './avatarStore'

const LOOK: AvatarLook = {
  skin: ESkinTone.Dark,
  hairStyle: EHairStyle.Curly,
  hairColor: EHairColor.Black,
  outfit: EOutfitColor.Teal,
  facialHair: EFacialHair.None,
  blush: true,
}

function setup(store = new MemoryStore()) {
  const avatar = createAvatarService(store, new MemoryLogger())
  const app = createApp(defineComponent({ render: () => null }))
  const pinia = createPinia()
  app.use(pinia)
  app.provide(AVATAR_STORE_DEPS, { avatar })
  return { avatarStore: useAvatarStore(pinia), avatar, store }
}

describe('avatar store', () => {
  it('starts with the default look, then the saved one', () => {
    const { avatarStore, store } = setup()
    expect(avatarStore.look).toEqual(DEFAULT_AVATAR_LOOK)
    avatarStore.save(LOOK)
    expect(avatarStore.look).toEqual(LOOK)
    expect(setup(store).avatarStore.look).toEqual(LOOK)
  })

  it('refuses a look that breaks the rules and keeps the old one', () => {
    const { avatarStore } = setup()
    const outfit: string = 'tartan'
    expect(() => avatarStore.save({ ...LOOK, outfit: outfit as EOutfitColor })).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidInput })
    )
    expect(avatarStore.look).toEqual(DEFAULT_AVATAR_LOOK)
  })
})
