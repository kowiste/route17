import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import InfoSheet from './InfoSheet.vue'

const EXPLANATION = 'Según el artículo 56 de la Constitución, el rey es el jefe del Estado.'

describe('InfoSheet', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the verdict, the right answer and the explanation', () => {
    const wrapper = mount(InfoSheet, {
      props: {
        open: true,
        explanation: EXPLANATION,
        correct: true,
        answerIndex: 1,
        answerText: 'El rey',
        question: '¿Quién es el jefe del Estado?',
      },
      attachTo: document.body,
    })
    expect(wrapper.get('dialog').element.open).toBe(true)
    expect(wrapper.get('h2').text()).toBe('Explicación')
    expect(wrapper.get('[data-verdict]').text()).toBe('¡Correcto!')
    expect(wrapper.get('[data-verdict]').classes()).toContain('bg-correct')
    const answer = wrapper.findAll('[data-answer] span').map((part) => part.text())
    expect(answer).toEqual(['Respuesta correcta:', 'B · El rey'])
    expect(wrapper.text()).toContain('¿Quién es el jefe del Estado?')
    expect(wrapper.get('[data-explanation]').text()).toBe(EXPLANATION)
    wrapper.unmount()
  })

  it('says so when she got it wrong, and leaves out what is not given', () => {
    const wrapper = mount(InfoSheet, {
      props: { open: true, explanation: EXPLANATION, correct: false },
      attachTo: document.body,
    })
    expect(wrapper.get('[data-verdict]').text()).toBe('Esta vez no')
    expect(wrapper.get('[data-verdict]').classes()).toContain('bg-wrong')
    expect(wrapper.text()).not.toContain('Respuesta correcta')
    wrapper.unmount()
  })

  it('has no verdict when reviewing', () => {
    const wrapper = mount(InfoSheet, {
      props: { open: true, explanation: EXPLANATION },
      attachTo: document.body,
    })
    expect(wrapper.find('[data-verdict]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits close from Entendido and from the modal', async () => {
    const wrapper = mount(InfoSheet, {
      props: { open: true, explanation: EXPLANATION },
      attachTo: document.body,
    })
    const understood = wrapper.findAll('button').find((b) => b.text() === 'Entendido')
    await understood?.trigger('click')
    await wrapper.get('[data-modal-close]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
    wrapper.unmount()
  })
})
