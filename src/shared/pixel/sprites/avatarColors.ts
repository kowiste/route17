// The palette colours of each choice in her look: what the avatar's legend
// keys become, and the swatches the editor shows.

import { EHairColor, EOutfitColor, ESkinTone } from '@/contracts/avatar'
import type { PixelColor } from '../palette'

/** A base colour and the second tone drawn with it (shade or shine). */
export interface ColorPair {
  readonly base: PixelColor
  readonly second: PixelColor
}

export const SKIN_COLORS: Readonly<Record<ESkinTone, ColorPair>> = {
  [ESkinTone.Light]: { base: 'skin1', second: 'skin1Dark' },
  [ESkinTone.LightMedium]: { base: 'skin2', second: 'skin2Dark' },
  [ESkinTone.Medium]: { base: 'skin3', second: 'skin3Dark' },
  [ESkinTone.MediumDark]: { base: 'skin4', second: 'skin4Dark' },
  [ESkinTone.Dark]: { base: 'skin5', second: 'skin5Dark' },
}

/** `second` is the shine on the hair. */
export const HAIR_COLORS: Readonly<Record<EHairColor, ColorPair>> = {
  [EHairColor.Black]: { base: 'hairBlack', second: 'hairBlackLight' },
  [EHairColor.DarkBrown]: { base: 'hairDarkBrown', second: 'hairDarkBrownLight' },
  [EHairColor.Brown]: { base: 'hairBrown', second: 'hairBrownLight' },
  [EHairColor.Blonde]: { base: 'hairBlonde', second: 'hairBlondeLight' },
  [EHairColor.Red]: { base: 'hairRed', second: 'hairRedLight' },
  [EHairColor.Grey]: { base: 'hairGrey', second: 'hairGreyLight' },
}

export const OUTFIT_COLORS: Readonly<Record<EOutfitColor, ColorPair>> = {
  [EOutfitColor.Red]: { base: 'red', second: 'redDark' },
  [EOutfitColor.Blue]: { base: 'blue', second: 'blueDark' },
  [EOutfitColor.Green]: { base: 'grass', second: 'grassDark' },
  [EOutfitColor.Yellow]: { base: 'yellow', second: 'gold' },
  [EOutfitColor.Purple]: { base: 'purple', second: 'purpleDark' },
  [EOutfitColor.Orange]: { base: 'orange', second: 'orangeDark' },
  [EOutfitColor.Pink]: { base: 'pink', second: 'pinkDark' },
  [EOutfitColor.Teal]: { base: 'teal', second: 'tealDark' },
}
