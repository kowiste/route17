// Plays the chiptune sounds with Web Audio: one oscillator and one gain per
// tone, a short attack and release so tones don't click. Safe everywhere: no
// Web Audio (tests, old browsers) or a blocked context means silence, never an
// error. The audio context is created on the first sound, which comes from a
// tap or a click, so phone browsers allow it.

import { logger, type Logger } from '@/shared/logger/logger'
import { ESound, SOUNDS, type Tone } from './sounds'

export interface SoundPlayer {
  play(sound: ESound): void
  readonly muted: boolean
  setMuted(muted: boolean): void
}

// The part of Web Audio the player uses, so tests can pass a fake.
export interface AudioParamLike {
  setValueAtTime(value: number, time: number): unknown
  linearRampToValueAtTime(value: number, time: number): unknown
  exponentialRampToValueAtTime(value: number, time: number): unknown
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown
}

export interface OscillatorLike extends AudioNodeLike {
  type: OscillatorType
  readonly frequency: AudioParamLike
  start(when?: number): void
  stop(when?: number): void
}

export interface GainLike extends AudioNodeLike {
  readonly gain: AudioParamLike
}

export interface ToneContext {
  readonly currentTime: number
  readonly state: string
  readonly destination: AudioNodeLike
  resume(): Promise<void>
  createOscillator(): OscillatorLike
  createGain(): GainLike
}

/** Seconds of fade in and out at each end of a tone. */
const EDGE = 0.008

function browserContext(): ToneContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null
  return new window.AudioContext()
}

export interface ChiptunePlayerOptions {
  /** Makes the audio context; null when there is no Web Audio. */
  createContext?: () => ToneContext | null
  /** The master volume, 0-1. */
  volume?: number
  log?: Logger
}

export class ChiptunePlayer implements SoundPlayer {
  private readonly createContext: () => ToneContext | null
  private readonly volume: number
  private readonly log: Logger
  private context: ToneContext | null = null
  private master: GainLike | null = null
  private unavailable = false
  private muted_ = false

  constructor(options: ChiptunePlayerOptions = {}) {
    this.createContext = options.createContext ?? browserContext
    this.volume = options.volume ?? 0.15
    this.log = options.log ?? logger
  }

  get muted(): boolean {
    return this.muted_
  }

  setMuted(muted: boolean): void {
    this.muted_ = muted
  }

  play(sound: ESound): void {
    if (this.muted_) return
    const context = this.ready()
    const master = this.master
    if (context === null || master === null) return
    try {
      const startAt = context.currentTime + 0.01
      for (const tone of SOUNDS[sound]) this.schedule(context, master, tone, startAt)
    } catch (error) {
      this.log.warn('a sound could not play', { sound, error: String(error) })
    }
  }

  /** The audio context, created on first use; null when there is no sound. */
  private ready(): ToneContext | null {
    if (this.unavailable) return null
    if (this.context === null) {
      try {
        const context = this.createContext()
        if (context === null) {
          this.unavailable = true
          return null
        }
        const master = context.createGain()
        master.gain.setValueAtTime(this.volume, 0)
        master.connect(context.destination)
        this.context = context
        this.master = master
      } catch (error) {
        this.unavailable = true
        this.log.warn('sound is not available', { error: String(error) })
        return null
      }
    }
    if (this.context.state === 'suspended') {
      // Resuming may wait for a tap; until then sounds are silent. Nothing to do on failure.
      void this.context.resume().catch(() => undefined)
    }
    return this.context
  }

  private schedule(context: ToneContext, master: GainLike, tone: Tone, startAt: number): void {
    const begin = startAt + tone.start
    const end = begin + tone.duration
    const oscillator = context.createOscillator()
    oscillator.type = tone.wave
    oscillator.frequency.setValueAtTime(tone.frequency, begin)
    if (tone.slideTo !== undefined)
      oscillator.frequency.exponentialRampToValueAtTime(tone.slideTo, end)

    const gain = context.createGain()
    gain.gain.setValueAtTime(0, begin)
    gain.gain.linearRampToValueAtTime(tone.volume, begin + EDGE)
    gain.gain.setValueAtTime(tone.volume, Math.max(begin + EDGE, end - EDGE))
    gain.gain.linearRampToValueAtTime(0, end)

    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(begin)
    oscillator.stop(end + EDGE)
  }
}

/** The app's one player. The settings switch it with `setMuted`. */
export const sound: SoundPlayer = new ChiptunePlayer()
