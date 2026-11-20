import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR_LOOK, EOutfitColor } from '@/contracts/avatar'
import { ERouteName } from '@/bootstrap/router'
import { mountScreen, testDeps } from '@/bootstrap/test/harness'
import WelcomeScreen from './WelcomeScreen.vue'

async function mountWelcome() {
  const deps = testDeps({ welcomed: false })
  const mounted = await mountScreen(WelcomeScreen, deps, { path: '/bienvenida' })
  return { ...mounted, deps }
}

describe('WelcomeScreen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('asks her name first and refuses an empty one', async () => {
    const { wrapper } = await mountWelcome()
    expect(wrapper.text()).toContain('¿Cómo te llamas?')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toBe('Escribe tu nombre: entre 1 y 20 letras.')
    expect(wrapper.find('[data-step="character"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('then her character, then Home', async () => {
    const { wrapper, deps, router } = await mountWelcome()
    await wrapper.get('input').setValue('  Ana ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('[data-step="character"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('¡Hola, Ana!')
    await wrapper.get(`[data-test="outfit-${EOutfitColor.Teal}"]`).trigger('click')
    await wrapper.get('[data-action="finish"]').trigger('click')
    await flushPromises()
    expect(deps.settings.load()).toMatchObject({ name: 'Ana', welcomed: true })
    expect(deps.avatar.load()).toEqual({ ...DEFAULT_AVATAR_LOOK, outfit: EOutfitColor.Teal })
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ERouteName.Home))
    wrapper.unmount()
  })

  it('goes back to the name', async () => {
    const { wrapper } = await mountWelcome()
    await wrapper.get('input').setValue('Ana')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('[data-action="back"]').trigger('click')
    expect(wrapper.find('[data-step="name"]').exists()).toBe(true)
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('Ana')
    wrapper.unmount()
  })
})
