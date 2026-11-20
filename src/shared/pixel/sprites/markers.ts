// The route's markers: a stop for every comunidad and the waving flag on a
// checkpoint (a safe rung).

import type { Sprite } from '../sprite'
import { loopFrame } from './compose'

export enum EStopState {
  /** Not reached yet. */
  Ahead = 'ahead',
  /** Where she is now. */
  Current = 'current',
  /** Already passed. */
  Done = 'done',
}

// Every stop is 9 × 9, so its centre pixel sits on the comunidad's anchor.

const STOP_AHEAD: Sprite = {
  rows: [
    '.........',
    '...ooo...',
    '..owllo..',
    '.owllldo.',
    '.olllldo.',
    '.olllddo.',
    '..odddo..',
    '...ooo...',
    '.........',
  ],
  legend: { o: 'outline', w: 'white', l: 'cream', d: 'sandDark' },
}

const STOP_CURRENT: Sprite = {
  rows: [
    '..ooooo..',
    '.owwyyyo.',
    'owwyyyyyo',
    'owyyyyyGo',
    'oyyyoyyGo',
    'oyyyyyyGo',
    'oyyyyyGGo',
    '.oGGGGGo.',
    '..ooooo..',
  ],
  legend: { o: 'outline', w: 'white', y: 'yellow', G: 'gold' },
}

const STOP_DONE: Sprite = {
  rows: [
    '..ooooo..',
    '.orrrrro.',
    'orrrrrrwo',
    'orrrrrwro',
    'orwrrwrro',
    'orrwwrrRo',
    'orrrrrRRo',
    '.oRRRRRo.',
    '..ooooo..',
  ],
  legend: { o: 'outline', w: 'white', r: 'red', R: 'redDark' },
}

const STOPS: Readonly<Record<EStopState, Sprite>> = {
  [EStopState.Ahead]: STOP_AHEAD,
  [EStopState.Current]: STOP_CURRENT,
  [EStopState.Done]: STOP_DONE,
}

/** The marker of a stop on the route. */
export function stopSprite(state: EStopState): Sprite {
  return STOPS[state]
}

// The checkpoint flag: red and yellow, on a pole with a gold knob; the cloth
// ripples between two shapes. Both frames are 14 × 16 with the pole's foot at
// the bottom of column 1.

const FLAG_LEGEND = {
  o: 'outline',
  k: 'gold',
  K: 'yellow',
  p: 'greyLight',
  P: 'grey',
  r: 'red',
  R: 'redDark',
  y: 'yellow',
  Y: 'gold',
} as const

const FLAG_FRAMES: readonly [Sprite, Sprite] = [
  {
    rows: [
      '.oo...........',
      'oKko..........',
      'okko..........',
      'opPooooo......',
      'opPorrrroooooo',
      'opPoyyyyrrrRRo',
      'opPoyyyyyyyYYo',
      'opPorrrryyyYYo',
      'opPooooorrrRRo',
      'opPo....oooooo',
      'opPo..........',
      'opPo..........',
      'opPo..........',
      'opPo..........',
      'opPo..........',
      'oooo..........',
    ],
    legend: FLAG_LEGEND,
  },
  {
    rows: [
      '.oo...........',
      'oKko..........',
      'okko..........',
      'opPooo....oooo',
      'opPorroooorRRo',
      'opPoyyrrrryYYo',
      'opPoyyyyyyyYYo',
      'opPorryyyyrRRo',
      'opPooorrrroooo',
      'opPo..oooo....',
      'opPo..........',
      'opPo..........',
      'opPo..........',
      'opPo..........',
      'opPo..........',
      'oooo..........',
    ],
    legend: FLAG_LEGEND,
  },
]

/** The flag on a checkpoint (safe rung); 2 frames, waving. */
export function flagSprite(frame: number): Sprite {
  return FLAG_FRAMES[loopFrame(frame, FLAG_FRAMES.length)] ?? FLAG_FRAMES[0]
}
