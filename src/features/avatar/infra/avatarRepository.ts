// Her look in the browser's key/value store. What comes back is parsed: data
// that isn't a valid look (corrupt, unknown version) counts as none. A look
// saved by the first version (before facial hair and blush) is still read, and
// the domain says what it looks like now.

import { z } from 'zod'
import type { AvatarLook } from '@/contracts/avatar'
import type { Logger } from '@/shared/logger/logger'
import type { KeyValueStore } from '@/shared/storage/keyValueStore'
import { avatarLookSchema, avatarLookV1Schema, lookFromV1 } from '../domain/avatarLook'
import type { IAvatarRepository } from '../domain/interface'

export const AVATAR_STORAGE_KEY = 'avatar'

const storedAvatarSchema = z.discriminatedUnion('version', [
  z.object({ version: z.literal(1), look: avatarLookV1Schema }),
  z.object({ version: z.literal(2), look: avatarLookSchema }),
])

interface StoredAvatarV2 {
  readonly version: 2
  readonly look: AvatarLook
}

function toStored(look: AvatarLook): StoredAvatarV2 {
  return {
    version: 2,
    look: {
      skin: look.skin,
      hairStyle: look.hairStyle,
      hairColor: look.hairColor,
      outfit: look.outfit,
      facialHair: look.facialHair,
      blush: look.blush,
    },
  }
}

export class KeyValueAvatarRepository implements IAvatarRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly log: Logger
  ) {}

  load(): AvatarLook | null {
    const raw = this.store.get(AVATAR_STORAGE_KEY)
    if (raw === null) return null
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      this.log.warn('avatar: the saved look is not JSON; using the default')
      return null
    }
    const parsed = storedAvatarSchema.safeParse(data)
    if (!parsed.success) {
      this.log.warn('avatar: the saved look is not valid; using the default')
      return null
    }
    return parsed.data.version === 1 ? lookFromV1(parsed.data.look) : parsed.data.look
  }

  save(look: AvatarLook): void {
    this.store.set(AVATAR_STORAGE_KEY, JSON.stringify(toStored(look)))
  }
}
