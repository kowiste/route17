import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import App from './App.vue'

const Broken = defineComponent({
  setup() {
    throw new AppError(EErrorCode.CorruptData, 'broken question file')
  },
})

const Fine = { render: () => h('p', 'Pantalla de inicio') }

describe('App', () => {
  it('shows a friendly message instead of a blank page when a screen breaks', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: Fine },
        { path: '/roto', component: Broken },
      ],
    })
    await router.push('/roto')
    await router.isReady()
    const wrapper = mount(App, {
      global: { plugins: [router] },
    })
    await flushPromises()
    expect(wrapper.get('[data-error-panel]').text()).toContain('no se pueden leer')
    expect(wrapper.text()).not.toContain('broken question file')

    await wrapper.get('[data-action="home"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Pantalla de inicio')
    expect(wrapper.find('[data-error-panel]').exists()).toBe(false)
  })
})
