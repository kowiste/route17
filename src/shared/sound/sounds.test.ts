import { describe, expect, it } from 'vitest'
import { AppError } from '@/shared/errors/appError'
import { ESound, noteFrequency, SOUNDS, soundLength } from './sounds'

describe('noteFrequency', () => {
  it('tunes A4 to 440 Hz and steps by semitones', () => {
    expect(noteFrequency('A4')).toBe(440)
    expect(noteFrequency('A5')).toBe(880)
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 2)
    expect(noteFrequency('C#5')).toBeCloseTo(noteFrequency('Db5'), 6)
    expect(noteFrequency('G#3')).toBeCloseTo(207.65, 2)
  })

  it('refuses what is not a note', () => {
    expect(() => noteFrequency('H2')).toThrow(AppError)
    expect(() => noteFrequency('A')).toThrow(AppError)
  })
})

describe('SOUNDS', () => {
  it.each(Object.values(ESound))('%s is a short, quiet, chiptune sound', (sound) => {
    const tones = SOUNDS[sound]
    expect(tones.length).toBeGreaterThan(0)
    for (const tone of tones) {
      expect(['square', 'triangle']).toContain(tone.wave)
      expect(tone.start).toBeGreaterThanOrEqual(0)
      expect(tone.duration).toBeGreaterThan(0.02)
      expect(tone.volume).toBeGreaterThan(0)
      expect(tone.volume).toBeLessThanOrEqual(1)
      expect(tone.frequency).toBeGreaterThan(20)
      expect(tone.frequency).toBeLessThan(5000)
    }
    expect(soundLength(sound)).toBeLessThanOrEqual(1.5)
  })

  it('keeps the quick sounds quick', () => {
    expect(soundLength(ESound.Step)).toBeLessThan(0.1)
    expect(soundLength(ESound.Select)).toBeLessThan(0.15)
  })
})
