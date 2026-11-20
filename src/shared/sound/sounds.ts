// The game's chiptune sounds, as data: a few square and triangle tones each.
// Our own little tunes; the player (soundPlayer.ts) turns them into Web Audio.

import { AppError, EErrorCode } from '@/shared/errors/appError'

export enum ESound {
  /** She picks an option. */
  Select = 'select',
  /** She confirms her answer. */
  Confirm = 'confirm',
  Correct = 'correct',
  Wrong = 'wrong',
  /** One footstep on the map. */
  Step = 'step',
  /** She uses a lifeline. */
  Lifeline = 'lifeline',
  /** She reaches Madrid. */
  Win = 'win',
}

export type Wave = 'square' | 'triangle'

export interface Tone {
  readonly wave: Wave
  /** Seconds after the sound starts. */
  readonly start: number
  /** Seconds. */
  readonly duration: number
  /** Hz. */
  readonly frequency: number
  /** Hz at the end of the tone, for a slide. */
  readonly slideTo?: number
  /** 0-1, before the player's master volume. */
  readonly volume: number
}

const NOTE_OFFSETS: Readonly<Record<string, number>> = {
  C: -9,
  D: -7,
  E: -5,
  F: -4,
  G: -2,
  A: 0,
  B: 2,
}

/** The frequency of a note name: 'A4' is 440 Hz; sharps and flats as 'C#5', 'Bb3'. */
export function noteFrequency(note: string): number {
  const match = /^([A-G])([#b]?)(\d)$/.exec(note)
  const offset = NOTE_OFFSETS[match?.[1] ?? '']
  if (match === null || offset === undefined) {
    throw new AppError(EErrorCode.InvalidInput, `not a note: ${note}`)
  }
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0
  const semitones = offset + accidental + (Number(match[3]) - 4) * 12
  return 440 * 2 ** (semitones / 12)
}

function tone(
  wave: Wave,
  note: string,
  start: number,
  duration: number,
  volume: number,
  slideTo?: string
): Tone {
  return {
    wave,
    start,
    duration,
    volume,
    frequency: noteFrequency(note),
    ...(slideTo === undefined ? {} : { slideTo: noteFrequency(slideTo) }),
  }
}

export const SOUNDS: Readonly<Record<ESound, readonly Tone[]>> = {
  [ESound.Select]: [tone('square', 'A5', 0, 0.045, 0.35), tone('square', 'E6', 0.045, 0.05, 0.3)],
  [ESound.Confirm]: [tone('square', 'C5', 0, 0.08, 0.4), tone('square', 'G5', 0.08, 0.14, 0.4)],
  [ESound.Correct]: [
    tone('square', 'C5', 0, 0.07, 0.35),
    tone('square', 'E5', 0.07, 0.07, 0.35),
    tone('square', 'G5', 0.14, 0.07, 0.35),
    tone('square', 'C6', 0.21, 0.26, 0.35),
    tone('triangle', 'C4', 0, 0.47, 0.6),
  ],
  [ESound.Wrong]: [
    tone('square', 'E4', 0, 0.18, 0.35, 'D#4'),
    tone('square', 'C4', 0.2, 0.45, 0.35, 'G#3'),
    tone('triangle', 'C3', 0.2, 0.45, 0.6),
  ],
  [ESound.Step]: [tone('triangle', 'C4', 0, 0.045, 0.5, 'G3')],
  [ESound.Lifeline]: [
    tone('square', 'A4', 0, 0.16, 0.3, 'A5'),
    tone('square', 'E5', 0.16, 0.1, 0.3),
  ],
  [ESound.Win]: [
    tone('square', 'G4', 0, 0.1, 0.35),
    tone('square', 'C5', 0.1, 0.1, 0.35),
    tone('square', 'E5', 0.2, 0.1, 0.35),
    tone('square', 'G5', 0.3, 0.2, 0.35),
    tone('square', 'E5', 0.5, 0.1, 0.35),
    tone('square', 'G5', 0.6, 0.5, 0.35),
    tone('triangle', 'C3', 0, 0.3, 0.6),
    tone('triangle', 'G3', 0.3, 0.3, 0.6),
    tone('triangle', 'C4', 0.6, 0.5, 0.6),
  ],
}

/** How long a sound lasts, in seconds. */
export function soundLength(sound: ESound): number {
  return SOUNDS[sound].reduce((end, t) => Math.max(end, t.start + t.duration), 0)
}
