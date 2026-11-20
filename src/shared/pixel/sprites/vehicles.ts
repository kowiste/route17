// How she crosses the sea: a little sailing boat with her in it (to and from
// Baleares) and a plane (from Canarias to the peninsula). Both face right.

import { EAvatarPose, type AvatarLook } from '@/contracts/avatar'
import type { Sprite } from '../sprite'
import { avatarLegend, avatarSprite, lookKey } from './avatar'
import { compose, loopFrame, SpriteCache } from './compose'

const BOAT_WIDTH = 24
const BOAT_HEIGHT = 20

// The boat over her: she sits behind the hull, only her head and shoulders
// show. Keys (none of them used by her sprite): n rail, x hull, X its shade,
// b stripe, q sail, Q its shade, N mast, r pennant, f foam.
const BOAT = [
  '..................oo....',
  '..................oNrro.',
  '..................oNrrro',
  '..................oNoooo',
  '..................oNqo..',
  '..................oNqqo.',
  '..................oNqqo.',
  '..................oNqqqo',
  '..................oNqqqo',
  '..................oNqqQo',
  '..................oNqQQo',
  '..................oNoooo',
  '..................oN....',
  'onnnnnnnnnnnnnnnnnnnnnoo',
  'oxxxxxxxxxxxxxxxxxxxxxxo',
  '.obbbbbbbbbbbbbbbbbbbbo.',
  '..oxxxxxxxxxxxxxxxxxxo..',
  '...oXXXXXXXXXXXXXXXXo...',
  '....oooooooooooooooo....',
]

const FOAM: readonly [readonly string[], readonly string[]] = [
  ['.ff..................ff.', 'f....................f..'],
  ['ff..................ff..', '.f..................f...'],
]

const BOAT_LEGEND = {
  n: 'earth',
  x: 'white',
  X: 'greyLight',
  b: 'blue',
  q: 'cream',
  Q: 'sand',
  N: 'earthDark',
  r: 'red',
  f: 'foam',
} as const

const boats = new SpriteCache()

/** The boat she takes to and from Baleares, with her in it; 2 frames, rocking. */
export function boatSprite(look: AvatarLook, frame: number): Sprite {
  const index = loopFrame(frame, 2)
  const key = `${lookKey(look)}|${index}`
  return boats.get(key, () => {
    const her = avatarSprite(look, EAvatarPose.Idle, 0)
    const bob = index
    return compose(
      BOAT_WIDTH,
      BOAT_HEIGHT,
      [
        { rows: her.rows, x: 3, y: bob },
        { rows: BOAT, y: bob },
        { rows: FOAM[index] ?? FOAM[0], y: 17 + bob },
      ],
      { ...avatarLegend(look), ...BOAT_LEGEND }
    )
  })
}

// A small passenger plane, white with a red stripe and tail; the propeller
// turns between two frames. Keys: x body, X its shade, r red, R red shade,
// b windows, g hub, p propeller.
const PLANE_LEGEND = {
  o: 'outline',
  x: 'white',
  X: 'greyLight',
  r: 'red',
  R: 'redDark',
  b: 'seaLight',
  g: 'grey',
  p: 'greyDark',
} as const

const PLANE_FRAMES: readonly [Sprite, Sprite] = [
  {
    rows: [
      '.ooo..................o.',
      '.orro................op.',
      '.orrro...............op.',
      '.orrrroooooooooooo...op.',
      '.oxxxxxxxxxxxxxbbxoo.op.',
      'ooxxbxxbxxbxxbxxbbxxoop.',
      'orrrrrrrrrrrrrrrrrrrrggo',
      'oXxxxxxxxooooooxxxxxxop.',
      '.oXXXXXXorrrrrRoXXXXoop.',
      '..oooooooRRRRRoooooo.op.',
      '........ooooooo......op.',
      '......................o.',
    ],
    legend: PLANE_LEGEND,
  },
  {
    rows: [
      '.ooo....................',
      '.orro...................',
      '.orrro..................',
      '.orrrroooooooooooo......',
      '.oxxxxxxxxxxxxxbbxoo....',
      'ooxxbxxbxxbxxbxxbbxxoo..',
      'orrrrrrrrrrrrrrrrrrrrggo',
      'oXxxxxxxxooooooxxxxxxoo.',
      '.oXXXXXXorrrrrRoXXXXoop.',
      '..oooooooRRRRRoooooo.op.',
      '........ooooooo......op.',
      '......................o.',
    ],
    legend: PLANE_LEGEND,
  },
]

/** The plane from Canarias to the peninsula; 2 frames. */
export function planeSprite(frame: number): Sprite {
  return PLANE_FRAMES[loopFrame(frame, PLANE_FRAMES.length)] ?? PLANE_FRAMES[0]
}
