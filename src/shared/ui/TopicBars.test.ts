import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ETopic, TOPICS } from '@/contracts/question'
import TopicBars from './TopicBars.vue'

const PER_TOPIC = {
  [ETopic.Government]: { mastered: 10, seen: 20, total: 100 },
  [ETopic.Rights]: { mastered: 0, seen: 0, total: 40 },
  [ETopic.Territory]: { mastered: 40, seen: 40, total: 40 },
  [ETopic.CultureHistory]: { mastered: 5, seen: 25, total: 50 },
  [ETopic.Society]: { mastered: 7, seen: 9, total: 70 },
}

describe('TopicBars', () => {
  it('shows every tarea in exam order with its bar and counts', () => {
    const wrapper = mount(TopicBars, { props: { perTopic: PER_TOPIC } })
    const sections = wrapper.findAll('section')
    expect(sections.map((s) => s.attributes('data-topic'))).toEqual(TOPICS.map((t) => t.topic))
    const first = sections[0]
    expect(first?.text()).toContain('Tarea 1')
    expect(first?.text()).toContain('Gobierno, legislación y participación ciudadana')
    expect(first?.text()).toContain('10/100')
    expect(first?.text()).toContain('10 dominadas · 20 vistas · 100 en total')
    expect(first?.get('[role="progressbar"]').attributes('aria-valuetext')).toBe(
      'Tarea 1: 10 dominadas · 20 vistas · 100 en total'
    )
    expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(5)
  })
})
