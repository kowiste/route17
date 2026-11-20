import { describe, expect, it } from 'vitest'
import { EErrorCode } from '@/shared/errors/appError'
import {
  cleanName,
  defaultSettings,
  ETheme,
  finishWelcome,
  NAME_MAX_LENGTH,
  rename,
  settingsSchema,
  withSound,
  withTheme,
} from './settings'

describe('settings', () => {
  it('starts with no name, sound on, the device theme and the welcome to do', () => {
    expect(defaultSettings()).toEqual({
      name: '',
      sound: true,
      theme: ETheme.System,
      welcomed: false,
    })
    expect(settingsSchema.safeParse(defaultSettings()).success).toBe(true)
  })

  it('keeps a name without spaces at the ends or doubled inside', () => {
    expect(cleanName('  María   José ')).toBe('María José')
    expect(rename(defaultSettings(), '  Lucía ').name).toBe('Lucía')
  })

  it('refuses an empty name and one too long', () => {
    expect(() => rename(defaultSettings(), '   ')).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidInput })
    )
    expect(() => rename(defaultSettings(), 'x'.repeat(NAME_MAX_LENGTH + 1))).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidInput })
    )
    expect(rename(defaultSettings(), 'x'.repeat(NAME_MAX_LENGTH)).name).toHaveLength(
      NAME_MAX_LENGTH
    )
  })

  it('switches the sound and the theme, and refuses a theme that does not exist', () => {
    expect(withSound(defaultSettings(), false).sound).toBe(false)
    expect(withTheme(defaultSettings(), ETheme.Dark).theme).toBe(ETheme.Dark)
    const theme: string = 'sepia'
    expect(() => withTheme(defaultSettings(), theme as ETheme)).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidInput })
    )
  })

  it('finishes the welcome only once she has a name', () => {
    expect(() => finishWelcome(defaultSettings())).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidState })
    )
    expect(finishWelcome(rename(defaultSettings(), 'Lucía')).welcomed).toBe(true)
  })
})
