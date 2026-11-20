import { describe, expect, it } from 'vitest'
import { EErrorCode } from '@/shared/errors/appError'
import type { ISettingsRepository } from '../domain/interface'
import { ETheme, type Settings } from '../domain/settings'
import { SettingsService } from './settingsService'

class InMemorySettingsRepository implements ISettingsRepository {
  saved: Settings | null = null

  load(): Settings | null {
    return this.saved
  }

  save(settings: Settings): void {
    this.saved = settings
  }
}

function setup(): { service: SettingsService; repository: InMemorySettingsRepository } {
  const repository = new InMemorySettingsRepository()
  return { service: new SettingsService({ repository }), repository }
}

describe('SettingsService', () => {
  it('gives the defaults before anything is saved', () => {
    const { service } = setup()
    expect(service.load()).toMatchObject({ name: '', sound: true, welcomed: false })
  })

  it('saves each change on top of the saved settings', () => {
    const { service, repository } = setup()
    service.rename(' Lucía ')
    service.setSound(false)
    service.setTheme(ETheme.Light)
    expect(service.finishWelcome()).toEqual({
      name: 'Lucía',
      sound: false,
      theme: ETheme.Light,
      welcomed: true,
    })
    expect(repository.saved).toEqual(service.load())
  })

  it('saves nothing when a change breaks the rules', () => {
    const { service, repository } = setup()
    expect(() => service.rename('')).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidInput })
    )
    expect(() => service.finishWelcome()).toThrow(
      expect.objectContaining({ code: EErrorCode.InvalidState })
    )
    expect(repository.saved).toBeNull()
  })
})
