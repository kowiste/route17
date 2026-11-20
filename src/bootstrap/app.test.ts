import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { ETheme } from '@/features/settings/view/theme'
import { createRoute17App } from './app'
import { ERouteName } from './router'
import { testDeps } from './test/harness'

async function boot(welcomed: boolean, path = '/') {
  const deps = testDeps({ welcomed })
  const { app, router } = createRoute17App(deps, { history: createMemoryHistory() })
  const root = document.createElement('div')
  document.body.append(root)
  await router.push(path)
  await router.isReady()
  app.mount(root)
  await flushPromises()
  return { app, router, root, deps }
}

describe('the app', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('opens on the welcome the first time', async () => {
    const { app, router, root } = await boot(false)
    expect(router.currentRoute.value.name).toBe(ERouteName.Welcome)
    expect(root.textContent).toContain('¿Cómo te llamas?')
    app.unmount()
  })

  it('opens on Home once she is welcomed, greeting her by name', async () => {
    const { app, router, root } = await boot(true)
    expect(router.currentRoute.value.name).toBe(ERouteName.Home)
    expect(root.textContent).toContain('¡Hola, Lucía!')
    expect(root.textContent).toContain('Modo oficial')
    app.unmount()
  })

  it('applies her saved settings at start', () => {
    const deps = testDeps()
    deps.settings.setSound(false)
    deps.settings.setTheme(ETheme.Dark)
    createRoute17App(deps, { history: createMemoryHistory() })
    expect(deps.recorded.muted).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
