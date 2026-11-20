// The map's clock: every animation frame while she moves, a few frames a second
// for the idle bob, the flags and the sea, nothing at all when the user asks
// for reduced motion or the tab is hidden.

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface MapClockOptions {
  /** Something is moving: run at full frame rate. */
  isMoving(): boolean
  /** Time between frames when nothing moves (the idle bob, the sea). */
  ambientMs(): number
  /** Called on every frame with the current time. */
  onFrame(now: number): void
}

export interface MapClock {
  /** The time of the last frame (performance.now()). */
  readonly now: Ref<number>
  readonly reducedMotion: Ref<boolean>
  /** Wakes the clock up: a travel started or the state changed. */
  wake(): void
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function motionQuery(): MediaQueryList | undefined {
  return typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION) : undefined
}

export function useMapClock(options: MapClockOptions): MapClock {
  const now = ref(performance.now())
  const query = motionQuery()
  const reducedMotion = ref(query?.matches ?? false)
  let frameID: number | undefined
  let timeoutID: ReturnType<typeof setTimeout> | undefined

  function cancel(): void {
    if (frameID !== undefined) cancelAnimationFrame(frameID)
    if (timeoutID !== undefined) clearTimeout(timeoutID)
    frameID = undefined
    timeoutID = undefined
  }

  function tick(): void {
    frameID = undefined
    now.value = performance.now()
    options.onFrame(now.value)
    schedule()
  }

  function schedule(): void {
    cancel()
    if (document.hidden) return
    if (options.isMoving()) {
      frameID = requestAnimationFrame(tick)
      return
    }
    if (reducedMotion.value) return
    timeoutID = setTimeout(() => {
      timeoutID = undefined
      frameID = requestAnimationFrame(tick)
    }, options.ambientMs())
  }

  function onVisibility(): void {
    if (document.hidden) cancel()
    else tick()
  }

  function onMotionChange(event: MediaQueryListEvent): void {
    reducedMotion.value = event.matches
    schedule()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility)
    query?.addEventListener('change', onMotionChange)
    schedule()
  })

  onBeforeUnmount(() => {
    cancel()
    document.removeEventListener('visibilitychange', onVisibility)
    query?.removeEventListener('change', onMotionChange)
  })

  return { now, reducedMotion, wake: schedule }
}
