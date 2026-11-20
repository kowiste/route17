import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR_LOOK, EAvatarPose } from '@/contracts/avatar'
import { AVATAR_HEIGHT, AVATAR_WIDTH } from '@/shared/pixel/sprites'
import AvatarCanvas from './AvatarCanvas.vue'

function frameOf(wrapper: ReturnType<typeof mount>): string | undefined {
  return wrapper.get('canvas').attributes('data-frame')
}

function preferReducedMotion(): void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  Object.defineProperty(query, 'matches', { value: true })
  vi.spyOn(window, 'matchMedia').mockReturnValue(query)
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('AvatarCanvas', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    setHidden(false)
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('is as big as her sprite times the whole-number scale, with a label', () => {
    const wrapper = mount(AvatarCanvas, {
      props: { look: DEFAULT_AVATAR_LOOK, scale: 3.4, label: 'Tu personaje' },
    })
    const canvas = wrapper.get('canvas')
    expect(canvas.attributes('width')).toBe(String(AVATAR_WIDTH * 3))
    expect(canvas.attributes('height')).toBe(String(AVATAR_HEIGHT * 3))
    expect(canvas.attributes('role')).toBe('img')
    expect(canvas.attributes('aria-label')).toBe('Tu personaje')
  })

  it('stays on the first frame unless asked to animate', () => {
    const wrapper = mount(AvatarCanvas, { props: { look: DEFAULT_AVATAR_LOOK, label: 'x' } })
    vi.advanceTimersByTime(5000)
    expect(frameOf(wrapper)).toBe('0')
  })

  it('plays the frames of the pose', async () => {
    const wrapper = mount(AvatarCanvas, {
      props: { look: DEFAULT_AVATAR_LOOK, pose: EAvatarPose.Walk, animate: true, label: 'x' },
    })
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(Number(frameOf(wrapper))).toBeGreaterThan(2)
  })

  it('keeps still when she prefers reduced motion', () => {
    preferReducedMotion()
    const wrapper = mount(AvatarCanvas, {
      props: { look: DEFAULT_AVATAR_LOOK, animate: true, label: 'x' },
    })
    vi.advanceTimersByTime(5000)
    expect(frameOf(wrapper)).toBe('0')
  })

  it('pauses while the tab is hidden and goes on when it is back', async () => {
    const wrapper = mount(AvatarCanvas, {
      props: { look: DEFAULT_AVATAR_LOOK, pose: EAvatarPose.Walk, animate: true, label: 'x' },
    })
    setHidden(true)
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    expect(frameOf(wrapper)).toBe('0')
    setHidden(false)
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(Number(frameOf(wrapper))).toBeGreaterThan(0)
  })

  it('stops its timer when it goes away', () => {
    const wrapper = mount(AvatarCanvas, {
      props: { look: DEFAULT_AVATAR_LOOK, animate: true, label: 'x' },
    })
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
