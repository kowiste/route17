// The hairstyles, drawn over the face (and, for the ponytail, behind it).
// Keys: o outline, h hair, H its shine, c the outfit colour (a hair tie).
// Row 0 is the row above her head; row 1 is the top of her head.

import { EHairStyle } from '@/contracts/avatar'

export interface HairStyle {
  /** Painted over the face. */
  readonly front: readonly string[]
  /** Painted behind the head and the body. */
  readonly back: readonly string[]
}

const SHORT: HairStyle = {
  // A bob down to the jaw with a side fringe.
  front: [
    '..............',
    '....oooooo....',
    '...ohhHHhho...',
    '..ohhHhhhhho..',
    '.ohhhhhhhhhho.',
    '.ohhhhhhhhhho.',
    '.ohhhhhhhh.ho.',
    '.ohh......hho.',
    '.ohh......hho.',
    '.ohH......Hho.',
    '..oo......oo..',
  ],
  back: [],
}

const LONG: HairStyle = {
  // Parted in the middle, falling over her shoulders.
  front: [
    '..............',
    '....oooooo....',
    '...ohhHHhho...',
    '..ohhHhhhhho..',
    '.ohhhhhhhhhho.',
    '.ohhhh..hhhho.',
    '.ohhh....hhho.',
    '.ohh......hho.',
    '.ohh......hho.',
    '.ohh......hho.',
    '.ohH......Hho.',
    '.ohh......hho.',
    '.ohh......hho.',
    '..oo......oo..',
  ],
  back: [],
}

const PONYTAIL: HairStyle = {
  // Pulled back, a hair tie, the tail swinging out on one side.
  front: [
    '..............',
    '....oooooo....',
    '...ohhHHhco...',
    '..ohhHhhhcco..',
    '..ohhhhhhhho..',
    '..ohhhhhhhho..',
    '..oh......ho..',
    '..o........o..',
  ],
  back: [
    '..............',
    '..........ooo.',
    '.........ohhho',
    '..........ohho',
    '...........oho',
    '...........oho',
    '..........ohho',
    '..........oHo.',
    '..........oho.',
    '...........o..',
  ],
}

const CURLY: HairStyle = {
  // A big round mop of curls.
  front: [
    '...oo.oo.oo...',
    '..ohhohHohho..',
    '.ohHhhhhhhHho.',
    'ohhhhHhhHhhhho',
    'ohHhhhhhhhhHho',
    'ohhhHh.hh.hhho',
    'ohHh......hHho',
    '.ohh......hho.',
    'ohHh......hHho',
    '.ohh......hho.',
    '.oHh......hHo.',
    '..oo......oo..',
  ],
  back: [],
}

const BUN: HairStyle = {
  // Pulled up into a bun on top, with a hair tie.
  front: [
    '.....oooo.....',
    '....ohHhho....',
    '....occcco....',
    '...ohHHhhho...',
    '..ohHhhhhhho..',
    '..ohhhh.hhho..',
    '..oh......ho..',
    '..o........o..',
  ],
  back: [],
}

const CROP: HairStyle = {
  // Cut close: the forehead clear, short sideburns.
  front: [
    '..............',
    '....oooooo....',
    '...ohHHhhho...',
    '..ohhhhHhhho..',
    '..ohhhhhhhho..',
    '..oh......ho..',
    '..oh......ho..',
  ],
  back: [],
}

const BUZZ: HairStyle = {
  // Buzzed: a thin, speckled layer over the top of the head.
  front: ['..............', '....oooooo....', '...ohHhHhHo...', '..oHhHhHhHho..', '..oh......ho..'],
  back: [],
}

const SIDE_PART: HairStyle = {
  // Short and parted, the fringe swept across the forehead.
  front: [
    '..............',
    '....oooooo....',
    '...ohHhhhho...',
    '..ohHHhhhhho..',
    '..ohhhhhhhho..',
    '..ohhhhh..ho..',
    '..oh......ho..',
  ],
  back: [],
}

export const HAIR_STYLES: Readonly<Record<EHairStyle, HairStyle>> = {
  [EHairStyle.Short]: SHORT,
  [EHairStyle.Long]: LONG,
  [EHairStyle.Ponytail]: PONYTAIL,
  [EHairStyle.Curly]: CURLY,
  [EHairStyle.Bun]: BUN,
  [EHairStyle.Crop]: CROP,
  [EHairStyle.Buzz]: BUZZ,
  [EHairStyle.SidePart]: SIDE_PART,
}
