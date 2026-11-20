import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ModeCard from './ModeCard.vue'

describe('ModeCard', () => {
  it('shows the mode, its progress and record, and emits start', async () => {
    const wrapper = mount(ModeCard, {
      props: {
        title: 'Modo juego',
        subtitle: 'Nuestras preguntas',
        progress: { mastered: 12, seen: 30, total: 300 },
        bestRung: 9,
      },
    })
    expect(wrapper.get('h2').text()).toBe('Modo juego')
    expect(wrapper.text()).toContain('Nuestras preguntas')
    expect(wrapper.text()).toContain('12 de 300 dominadas · 30 vistas')
    expect(wrapper.text()).toContain('Récord: parada 9 de 17 · La Rioja')
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('hides progress and record when there are none', () => {
    const wrapper = mount(ModeCard, {
      props: { title: 'Modo juego', subtitle: 'Nuestras preguntas', bestRung: 0 },
    })
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Récord')
  })

  it('when disabled, shows the note and never emits start', async () => {
    const wrapper = mount(ModeCard, {
      props: {
        title: 'Modo oficial',
        subtitle: 'Las preguntas del manual',
        disabled: true,
        note: 'Pendiente',
        actionLabel: 'Jugar',
      },
    })
    expect(wrapper.text()).toContain('Pendiente')
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.emitted('start')).toBeUndefined()
  })
})
