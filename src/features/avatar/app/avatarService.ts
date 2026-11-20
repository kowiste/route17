// Loads and saves her look. The rules (the default, what a valid look is) are
// the domain's; this only runs the steps.

import type { AvatarLook } from '@/contracts/avatar'
import { defaultLook, lookOrDefault, validateLook } from '../domain/avatarLook'
import type { IAvatarRepository } from '../domain/interface'

export interface AvatarServiceDeps {
  readonly repository: IAvatarRepository
}

export class AvatarService {
  constructor(private readonly deps: AvatarServiceDeps) {}

  /** Her look: the saved one, or the default. */
  load(): AvatarLook {
    return lookOrDefault(this.deps.repository.load())
  }

  /** Checks her look and saves it; returns what was saved. Throws `InvalidInput` for a look that breaks the rules. */
  save(input: AvatarLook): AvatarLook {
    const look = validateLook(input)
    this.deps.repository.save(look)
    return look
  }

  /** Puts her back to the default look, saved. */
  reset(): AvatarLook {
    return this.save(defaultLook())
  }
}
