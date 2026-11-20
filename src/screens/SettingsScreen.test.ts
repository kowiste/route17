import { afterEach, describe, expect, it } from 'vitest'
import { EHairStyle } from '@/contracts/avatar'
import { mountScreen, testDeps } from '@/bootstrap/test/harness'
import { ETheme } from '@/features/settings/view/theme'
import SettingsScreen from './SettingsScreen.vue'

async function mountSettings() {
  const deps = testDeps()
  const mounted = await mountScreen(SettingsScreen, deps, { path: '/ajustes' })
  return { ...mounted, deps }
}

describe('SettingsScreen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('changes her name, and explains a name it can not keep', async () => {
    const { wrapper, deps } = await mountSettings()
    const input = wrapper.get('input[name="name"]')
    expect((input.element as HTMLInputElement).value).toBe('Lucía')
    await input.setValue('  ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('entre 1 y 20 letras')
    await input.setValue('Lu')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('[data-name-saved]').exists()).toBe(true)
    expect(deps.settings.load().name).toBe('Lu')
    wrapper.unmount()
  })

  it('saves her character from the editor', async () => {
    const { wrapper, deps } = await mountSettings()
    await wrapper.get(`[data-test="hair-style-${EHairStyle.Bun}"]`).trigger('click')
    await wrapper.get('[data-test="save"]').trigger('click')
    expect(deps.avatar.load().hairStyle).toBe(EHairStyle.Bun)
    expect(wrapper.find('[data-look-saved]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('switches the sound off and on', async () => {
    const { wrapper, deps } = await mountSettings()
    const toggle = wrapper.get('[data-sound] button')
    expect(toggle.text()).toContain('Sonido: sí')
    await toggle.trigger('click')
    expect(deps.settings.load().sound).toBe(false)
    expect(deps.recorded.muted).toBe(true)
    expect(wrapper.get('[data-sound] button').text()).toContain('Sonido: no')
    wrapper.unmount()
  })

  it('picks the theme: Sistema, Claro or Oscuro', async () => {
    const { wrapper, deps } = await mountSettings()
    expect(wrapper.get('[data-themes]').text()).toContain('Sistema')
    await wrapper.get(`[data-theme-option="${ETheme.Dark}"]`).setValue(true)
    expect(deps.settings.load().theme).toBe(ETheme.Dark)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    await wrapper.get(`[data-theme-option="${ETheme.System}"]`).setValue(true)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    wrapper.unmount()
  })
})
