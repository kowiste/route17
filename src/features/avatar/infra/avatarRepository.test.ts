import { describe, expect, it } from 'vitest'
import {
  EFacialHair,
  EHairColor,
  EHairStyle,
  EOutfitColor,
  ESkinTone,
  type AvatarLook,
} from '@/contracts/avatar'
import { MemoryLogger } from '@/shared/logger/logger'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { AVATAR_STORAGE_KEY, KeyValueAvatarRepository } from './avatarRepository'

const LOOK: AvatarLook = {
  skin: ESkinTone.MediumDark,
  hairStyle: EHairStyle.Short,
  hairColor: EHairColor.Black,
  outfit: EOutfitColor.Orange,
  facialHair: EFacialHair.Beard,
  blush: false,
}

function setup(): { repository: KeyValueAvatarRepository; store: MemoryStore; log: MemoryLogger } {
  const store = new MemoryStore()
  const log = new MemoryLogger()
  return { repository: new KeyValueAvatarRepository(store, log), store, log }
}

describe('KeyValueAvatarRepository', () => {
  it('has nothing before she saves', () => {
    const { repository, log } = setup()
    expect(repository.load()).toBeNull()
    expect(log.entries).toEqual([])
  })

  it('saves her look under its key and reads it back', () => {
    const { repository, store } = setup()
    repository.save(LOOK)
    expect(JSON.parse(store.get(AVATAR_STORAGE_KEY) ?? 'null')).toEqual({ version: 2, look: LOOK })
    expect(new KeyValueAvatarRepository(store, new MemoryLogger()).load()).toEqual(LOOK)
  })

  it('treats data that is not JSON as nothing saved, with a warning', () => {
    const { repository, store, log } = setup()
    store.set(AVATAR_STORAGE_KEY, '{not json')
    expect(repository.load()).toBeNull()
    expect(log.entries.map((entry) => entry.level)).toEqual(['warn'])
  })

  it('reads a look saved by the first version, keeping how it looked', () => {
    const { repository, store, log } = setup()
    const old = {
      skin: ESkinTone.Light,
      hairStyle: EHairStyle.Long,
      hairColor: EHairColor.Brown,
      outfit: EOutfitColor.Red,
    }
    store.set(AVATAR_STORAGE_KEY, JSON.stringify({ version: 1, look: old }))
    expect(repository.load()).toEqual({ ...old, facialHair: EFacialHair.None, blush: true })
    expect(log.entries).toEqual([])
  })

  it('treats a look with unknown values, or another version, as nothing saved', () => {
    const { repository, store, log } = setup()
    store.set(AVATAR_STORAGE_KEY, JSON.stringify({ version: 2, look: { ...LOOK, skin: 'green' } }))
    expect(repository.load()).toBeNull()
    store.set(AVATAR_STORAGE_KEY, JSON.stringify({ version: 3, look: LOOK }))
    expect(repository.load()).toBeNull()
    store.set(AVATAR_STORAGE_KEY, JSON.stringify(LOOK))
    expect(repository.load()).toBeNull()
    expect(log.entries).toHaveLength(3)
  })

  it('overwrites a corrupt value when she saves again', () => {
    const { repository, store } = setup()
    store.set(AVATAR_STORAGE_KEY, 'garbage')
    repository.save(LOOK)
    expect(repository.load()).toEqual(LOOK)
  })
})
