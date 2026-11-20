// Her preferences: her name, sound on or off, and the colour theme. The rules
// (what a valid name is, the defaults, when the welcome is done) live here.

import { z } from 'zod'
import { AppError, EErrorCode } from '@/shared/errors/appError'

/** The colours of the app: follow the device, or always light or dark. */
export enum ETheme {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

/** The themes in the order the settings show them. */
export const THEMES: readonly ETheme[] = [ETheme.System, ETheme.Light, ETheme.Dark]

/** The longest name she can type: it has to fit in a greeting on a phone. */
export const NAME_MAX_LENGTH = 20

export interface Settings {
  /** What the game calls her; empty until the welcome. */
  readonly name: string
  /** Sounds on. */
  readonly sound: boolean
  readonly theme: ETheme
  /** She has gone through the welcome (name and character). */
  readonly welcomed: boolean
}

export const settingsSchema = z
  .object({
    name: z.string().max(NAME_MAX_LENGTH),
    sound: z.boolean(),
    theme: z.enum(ETheme),
    welcomed: z.boolean(),
  })
  .strict()

const themeSchema = z.enum(ETheme)

/** Before she has set anything: no name, sound on, the device's theme, the welcome to do. */
export function defaultSettings(): Settings {
  return { name: '', sound: true, theme: ETheme.System, welcomed: false }
}

/** A name as it is kept: no spaces at the ends, single spaces inside. */
export function cleanName(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/** Her settings with a new name. Throws `InvalidInput` (field `name`) for an empty or too long name. */
export function rename(settings: Settings, input: string): Settings {
  const name = cleanName(input)
  if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
    throw new AppError(
      EErrorCode.InvalidInput,
      `a name has 1 to ${NAME_MAX_LENGTH} characters, got ${name.length}`,
      { field: 'name', max: NAME_MAX_LENGTH }
    )
  }
  return { ...settings, name }
}

export function withSound(settings: Settings, sound: boolean): Settings {
  return { ...settings, sound }
}

/** Throws `InvalidInput` (field `theme`) for a theme that doesn't exist. */
export function withTheme(settings: Settings, theme: ETheme): Settings {
  const parsed = themeSchema.safeParse(theme)
  if (!parsed.success) {
    throw new AppError(EErrorCode.InvalidInput, `no theme ${String(theme)}`, { field: 'theme' })
  }
  return { ...settings, theme: parsed.data }
}

/** The welcome is done once she has a name. Throws `InvalidState` without one. */
export function finishWelcome(settings: Settings): Settings {
  if (settings.name.length === 0) {
    throw new AppError(EErrorCode.InvalidState, 'the welcome needs her name first', {
      field: 'name',
    })
  }
  return { ...settings, welcomed: true }
}
