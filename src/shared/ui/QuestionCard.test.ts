import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { EComunidadID } from '@/contracts/comunidad'
import { ETopic } from '@/contracts/question'
import QuestionCard from './QuestionCard.vue'

describe('QuestionCard', () => {
  it('shows the stop, the comunidad, the tarea and the question, with the options in a group', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        topic: ETopic.Territory,
        rung: 3,
        comunidad: EComunidadID.Murcia,
        question: '¿Cuál es la capital de la Región de Murcia?',
      },
      slots: { default: '<button>A</button><button>B</button>', footer: '<p>Pie</p>' },
    })
    const text = wrapper.text().replace(/\s+/g, ' ')
    const stop = wrapper.get('[data-stop]').findAll(':scope > span')
    expect(stop.map((part) => part.text())).toEqual(['Parada', '3/17', '·', 'Murcia'])
    expect(text).toContain('Tarea 3 · Territorio y geografía')
    const question = wrapper.get('p[id]')
    expect(question.text()).toBe('¿Cuál es la capital de la Región de Murcia?')
    const group = wrapper.get('[role="group"]')
    expect(group.attributes('aria-labelledby')).toBe(question.attributes('id'))
    expect(group.findAll('button')).toHaveLength(2)
    expect(wrapper.text()).toContain('Pie')
  })

  it('has no footer when none is given', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        topic: ETopic.Government,
        rung: 1,
        comunidad: EComunidadID.Canarias,
        question: 'Pregunta',
      },
    })
    expect(wrapper.findAll('.mt-4')).toHaveLength(0)
  })
})
