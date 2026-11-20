import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DevGallery from './DevGallery.vue'

describe('DevGallery', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('shows every section of the kit without a Vue warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mount(DevGallery, { attachTo: document.body })
    const titles = wrapper.findAll('h2.font-pixel').map((h) => h.text())
    expect(titles).toEqual(
      expect.arrayContaining([
        'Básicos',
        'Modos y progreso',
        'Preguntas',
        'Comodines',
        'Escalera',
        'Sonido',
      ])
    )
    expect(warn).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('forces a theme on the page and gives it back on leaving', async () => {
    const wrapper = mount(DevGallery, { attachTo: document.body })
    const dark = wrapper.findAll('button').find((b) => b.text() === 'Oscuro')
    await dark?.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
    const system = wrapper.findAll('button').find((b) => b.text() === 'Sistema')
    await system?.trigger('click')
    expect(document.documentElement.dataset.theme).toBeUndefined()
    await dark?.trigger('click')
    wrapper.unmount()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
