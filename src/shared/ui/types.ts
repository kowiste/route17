// The kit's own vocabulary: what a screen tells a component to show. The
// round feature has its own types for the rules; the screens map them here.

import type { EComunidadID } from '@/contracts/comunidad'

/** How an answer option looks. */
export enum EAnswerState {
  /** Can be chosen. */
  Idle = 'idle',
  /** Chosen, waiting for the confirm. */
  Selected = 'selected',
  /** The right answer, shown after confirming. */
  Correct = 'correct',
  /** Her confirmed answer, and it was wrong. */
  Wrong = 'wrong',
  /** Taken away by the 50:50. */
  Removed = 'removed',
}

/** The lifelines are shared with the round rules. */
export { ELifeline, LIFELINES } from '@/contracts/lifeline'

/** Where a round stands, as the ladder shows it. */
export enum ELadderStatus {
  Playing = 'playing',
  Won = 'won',
  Lost = 'lost',
  Stopped = 'stopped',
}

/** One rung of the prize ladder; rung n (1-based) is the n-th item. */
export interface LadderRung {
  readonly comunidad: EComunidadID
  readonly points: number
  readonly safe: boolean
}

/** How a rung of the ladder looks. */
export enum ERungState {
  /** Not reached yet. */
  Ahead = 'ahead',
  /** The question she is on. */
  Current = 'current',
  /** Answered right. */
  Done = 'done',
  /** Where she answered wrong. */
  Failed = 'failed',
}

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'sign'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type PanelTone = 'surface' | 'alt' | 'sign' | 'accent' | 'lcd'
