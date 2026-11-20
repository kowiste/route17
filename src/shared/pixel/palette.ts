// The pixel-art colours: the only place with colour values for sprites and the
// map. A sprite names colours from here; never write a hex value in a sprite.

export const PIXEL_PALETTE = {
  transparent: 'transparent',
  outline: '#1a1423',
  black: '#0d0b14',
  white: '#fffaf0',
  cream: '#f4e8c1',
  greyDark: '#4a4458',
  grey: '#8a8299',
  greyLight: '#c7c0d4',

  seaDeep: '#1f4e8c',
  sea: '#2f7fc1',
  seaLight: '#6cc3e8',
  foam: '#d8f3ff',
  sand: '#e8c97a',
  sandDark: '#c9a14e',
  grassLight: '#8fd14f',
  grass: '#4fa83d',
  grassDark: '#2e7a32',
  forest: '#1f5a2e',
  earthLight: '#d9a066',
  earth: '#a8693a',
  earthDark: '#6e4024',
  rock: '#9c8f86',
  snow: '#f2f5ff',

  red: '#d7263d',
  redDark: '#8f1a2a',
  orange: '#f28c28',
  yellow: '#ffd23f',
  gold: '#e0a526',
  blue: '#3f6fd8',
  blueDark: '#253f8a',
  purple: '#7b4bc4',
  pink: '#f27eb5',
  teal: '#2bb3a3',

  skin1: '#ffe0c4',
  skin2: '#f1c27d',
  skin3: '#d9a066',
  skin4: '#a86b3c',
  skin5: '#6b3f22',

  hairBlack: '#1b1b22',
  hairDarkBrown: '#3d2414',
  hairBrown: '#6e4024',
  hairBlonde: '#e8c15a',
  hairRed: '#b5442a',
  hairGrey: '#b9b4bf',

  // Added for the sprites: the shade of each skin tone, the shine of each hair
  // colour, the shade of each outfit colour, and a few materials.
  skin1Dark: '#f0bf9c',
  skin2Dark: '#d39f5c',
  skin3Dark: '#b77d48',
  skin4Dark: '#86512a',
  skin5Dark: '#4f2c17',

  hairBlackLight: '#45455a',
  hairDarkBrownLight: '#6a4428',
  hairBrownLight: '#a06a3e',
  hairBlondeLight: '#fbe7a1',
  hairRedLight: '#e0754b',
  hairGreyLight: '#e6e2ec',

  purpleDark: '#52308c',
  orangeDark: '#c0601a',
  pinkDark: '#c4568c',
  tealDark: '#1b7d72',
  blush: '#f59a9a',

  denim: '#3a4a78',
  denimDark: '#283356',
  brick: '#c4643a',
  brickDark: '#8e4226',
  stone: '#d8cdb4',
  stoneDark: '#a99d86',
  ochre: '#b4532a',
} as const

export type PixelColor = keyof typeof PIXEL_PALETTE
