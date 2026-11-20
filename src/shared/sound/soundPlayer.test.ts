import { describe, expect, it } from 'vitest'
import { MemoryLogger } from '@/shared/logger/logger'
import {
  ChiptunePlayer,
  sound,
  type AudioNodeLike,
  type AudioParamLike,
  type GainLike,
  type OscillatorLike,
  type ToneContext,
} from './soundPlayer'
import { ESound, SOUNDS } from './sounds'

class FakeParam implements AudioParamLike {
  readonly calls: [string, number, number][] = []
  setValueAtTime(value: number, time: number): void {
    this.calls.push(['set', value, time])
  }
  linearRampToValueAtTime(value: number, time: number): void {
    this.calls.push(['linear', value, time])
  }
  exponentialRampToValueAtTime(value: number, time: number): void {
    this.calls.push(['exponential', value, time])
  }
}

class FakeNode implements AudioNodeLike {
  readonly outputs: AudioNodeLike[] = []
  connect(destination: AudioNodeLike): void {
    this.outputs.push(destination)
  }
}

class FakeOscillator extends FakeNode implements OscillatorLike {
  type: OscillatorType = 'sine'
  readonly frequency = new FakeParam()
  started: number | null = null
  stopped: number | null = null
  start(when = 0): void {
    this.started = when
  }
  stop(when = 0): void {
    this.stopped = when
  }
}

class FakeGain extends FakeNode implements GainLike {
  readonly gain = new FakeParam()
}

class FakeContext implements ToneContext {
  currentTime = 2
  state = 'running'
  resumed = 0
  readonly destination = new FakeNode()
  readonly oscillators: FakeOscillator[] = []
  readonly gains: FakeGain[] = []
  async resume(): Promise<void> {
    this.resumed += 1
    this.state = 'running'
  }
  createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  }
  createGain(): FakeGain {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }
}

describe('ChiptunePlayer', () => {
  it('plays every tone of a sound through the master volume', () => {
    const context = new FakeContext()
    const player = new ChiptunePlayer({ createContext: () => context, volume: 0.2 })
    player.play(ESound.Correct)

    const tones = SOUNDS[ESound.Correct]
    expect(context.oscillators).toHaveLength(tones.length)
    const master = context.gains[0]
    expect(master?.outputs).toEqual([context.destination])
    expect(master?.gain.calls[0]).toEqual(['set', 0.2, 0])

    tones.forEach((tone, i) => {
      const oscillator = context.oscillators[i]
      const begin = 2.01 + tone.start
      expect(oscillator?.type).toBe(tone.wave)
      expect(oscillator?.frequency.calls[0]).toEqual(['set', tone.frequency, begin])
      expect(oscillator?.started).toBeCloseTo(begin, 6)
      expect(oscillator?.stopped).toBeGreaterThan(begin + tone.duration)
      const gain = context.gains[i + 1]
      expect(oscillator?.outputs).toEqual([gain])
      expect(gain?.outputs).toEqual([master])
      expect(gain?.gain.calls.at(-1)?.[1]).toBe(0)
    })
  })

  it('slides the pitch of tones that slide', () => {
    const context = new FakeContext()
    new ChiptunePlayer({ createContext: () => context }).play(ESound.Step)
    const slide = SOUNDS[ESound.Step][0]?.slideTo
    expect(context.oscillators[0]?.frequency.calls[1]?.slice(0, 2)).toEqual(['exponential', slide])
  })

  it('creates the audio context once, on the first sound', () => {
    let created = 0
    const context = new FakeContext()
    const player = new ChiptunePlayer({
      createContext: () => {
        created += 1
        return context
      },
    })
    expect(created).toBe(0)
    player.play(ESound.Select)
    player.play(ESound.Confirm)
    expect(created).toBe(1)
  })

  it('resumes a suspended context', () => {
    const context = new FakeContext()
    context.state = 'suspended'
    new ChiptunePlayer({ createContext: () => context }).play(ESound.Select)
    expect(context.resumed).toBe(1)
  })

  it('plays nothing while muted', () => {
    const context = new FakeContext()
    const player = new ChiptunePlayer({ createContext: () => context })
    player.setMuted(true)
    expect(player.muted).toBe(true)
    player.play(ESound.Win)
    expect(context.oscillators).toHaveLength(0)
    player.setMuted(false)
    player.play(ESound.Win)
    expect(context.oscillators.length).toBeGreaterThan(0)
  })

  it('is silent, never failing, without Web Audio', () => {
    const none = new ChiptunePlayer({ createContext: () => null })
    expect(() => none.play(ESound.Wrong)).not.toThrow()
    const log = new MemoryLogger()
    const broken = new ChiptunePlayer({
      createContext: () => {
        throw new Error('blocked')
      },
      log,
    })
    expect(() => broken.play(ESound.Wrong)).not.toThrow()
    expect(() => broken.play(ESound.Wrong)).not.toThrow()
    expect(log.entries).toEqual([{ level: 'warn', message: 'sound is not available' }])
    expect(() => sound.play(ESound.Step)).not.toThrow()
  })
})
