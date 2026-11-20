// Her look on the map: the rules of what she can pick. Every part is one of
// its choices; she starts with the default look.

import { z } from 'zod'
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

export const avatarLookSchema = z
  .object({
    skin: z.enum(ESkinTone),
    hairStyle: z.enum(EHairStyle),
    hairColor: z.enum(EHairColor),
    outfit: z.enum(EOutfitColor),
    facialHair: z.enum(EFacialHair),
    blush: z.boolean(),
  })
  .strict()

/** A look saved before facial hair and blush could be picked. */
export const avatarLookV1Schema = avatarLookSchema.pick({
  skin: true,
  hairStyle: true,
  hairColor: true,
  outfit: true,
})

export type AvatarLookV1 = z.infer<typeof avatarLookV1Schema>

/** The part of her look a choice changes. */
export type AvatarPart = keyof AvatarLook

/** The choices of each part, in the order the editor shows them. */
export const AVATAR_CHOICES: {
  readonly skin: readonly ESkinTone[]
  readonly hairStyle: readonly EHairStyle[]
  readonly hairColor: readonly EHairColor[]
  readonly outfit: readonly EOutfitColor[]
  readonly facialHair: readonly EFacialHair[]
  readonly blush: readonly boolean[]
} = {
  skin: Object.values(ESkinTone),
  hairStyle: Object.values(EHairStyle),
  hairColor: Object.values(EHairColor),
  outfit: Object.values(EOutfitColor),
  facialHair: Object.values(EFacialHair),
  blush: [true, false],
}

/**
 * A look saved before facial hair and blush existed, as it looks now: those
 * characters were all drawn with rosy cheeks and no facial hair, so the look
 * keeps exactly the same appearance.
 */
export function lookFromV1(old: AvatarLookV1): AvatarLook {
  return { ...old, facialHair: EFacialHair.None, blush: true }
}

/** What she looks like before she picks anything. */
export function defaultLook(): AvatarLook {
  return DEFAULT_AVATAR_LOOK
}

/** Her saved look, or the default when there is none (or it couldn't be read). */
export function lookOrDefault(saved: AvatarLook | null): AvatarLook {
  return saved ?? defaultLook()
}

/** A look that follows the rules: every part is one of its choices. Throws `InvalidInput` otherwise. */
export function validateLook(input: unknown): AvatarLook {
  const parsed = avatarLookSchema.safeParse(input)
  if (!parsed.success) {
    throw new AppError(EErrorCode.InvalidInput, 'not a valid avatar look', {
      fields: parsed.error.issues.map((issue) => issue.path.join('.')),
    })
  }
  return parsed.data
}

/** Her look with some parts changed; the result is checked like any look. */
export function changeLook(look: AvatarLook, change: Partial<AvatarLook>): AvatarLook {
  return validateLook({ ...look, ...change })
}

/** Whether two looks are the same in every part. */
export function sameLook(a: AvatarLook, b: AvatarLook): boolean {
  return (
    a.skin === b.skin &&
    a.hairStyle === b.hairStyle &&
    a.hairColor === b.hairColor &&
    a.outfit === b.outfit &&
    a.facialHair === b.facialHair &&
    a.blush === b.blush
  )
}
