import { describe, expect, it } from 'vitest'
import { DEFAULT_AVATAR_LOOK, EOutfitColor } from '@/contracts/avatar'
import { MemoryLogger } from '@/shared/logger/logger'
import { MemoryStore } from '@/shared/storage/keyValueStore'
import { createAvatarService } from './feature'

describe('createAvatarService', () => {
  it('wires the service to the store', () => {
    const store = new MemoryStore()
    const look = { ...DEFAULT_AVATAR_LOOK, outfit: EOutfitColor.Pink }
    createAvatarService(store, new MemoryLogger()).save(look)
    expect(createAvatarService(store, new MemoryLogger()).load()).toEqual(look)
  })
})
