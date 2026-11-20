import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { AppError, EErrorCode } from '@/shared/errors/appError'
import ErrorPanel from './ErrorPanel.vue'
import { friendlyError, nameError, UNKNOWN_ERROR_MESSAGE } from './errorMessage'

describe('friendly errors', () => {
  it('has a Spanish sentence for every error code, never the technical message', () => {
    for (const code of Object.values(EErrorCode)) {
      const message = friendlyError(new AppError(code, 'technical detail'))
      expect(message.length).toBeGreaterThan(10)
      expect(message).not.toContain('technical')
    }
    expect(friendlyError(new AppError(EErrorCode.CorruptData, 'x'))).toContain('no se pueden leer')
  })

  it('falls back to a message about the connection for anything else', () => {
    expect(friendlyError(new TypeError('Failed to fetch dynamically imported module'))).toBe(
      UNKNOWN_ERROR_MESSAGE
    )
    expect(friendlyError('boom')).toBe(UNKNOWN_ERROR_MESSAGE)
  })

  it('says how long a name can be', () => {
    expect(nameError(20)).toBe('Escribe tu nombre: entre 1 y 20 letras.')
  })

  it('shows the message with "Reintentar" and "Inicio"', async () => {
    const wrapper = mount(ErrorPanel, {
      props: { error: new AppError(EErrorCode.NotFound, 'no set') },
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('todavía no tiene preguntas')
    await wrapper.get('[data-action="retry"]').trigger('click')
    await wrapper.get('[data-action="home"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.emitted('home')).toHaveLength(1)
    const quiet = mount(ErrorPanel, { props: { error: null, retry: false, home: false } })
    expect(quiet.find('button').exists()).toBe(false)
  })
})
