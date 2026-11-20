// Wiring: the avatar service on a key/value store.

import { logger, type Logger } from '@/shared/logger/logger'
import type { KeyValueStore } from '@/shared/storage/keyValueStore'
import { AvatarService } from './app/avatarService'
import { KeyValueAvatarRepository } from './infra/avatarRepository'

export function createAvatarService(store: KeyValueStore, log: Logger = logger): AvatarService {
  return new AvatarService({ repository: new KeyValueAvatarRepository(store, log) })
}
