// The avatar feature's ports.

import type { AvatarLook } from '@/contracts/avatar'

export interface IAvatarRepository {
  /** Her saved look; null when none is saved or the saved one can't be read. */
  load(): AvatarLook | null
  save(look: AvatarLook): void
}
