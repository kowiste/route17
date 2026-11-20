// What the editor calls each choice, in Spanish.

import { EFacialHair, EHairColor, EHairStyle, EOutfitColor, ESkinTone } from '@/contracts/avatar'

export const SKIN_LABELS: Readonly<Record<ESkinTone, string>> = {
  [ESkinTone.Light]: 'Piel clara',
  [ESkinTone.LightMedium]: 'Piel clara media',
  [ESkinTone.Medium]: 'Piel media',
  [ESkinTone.MediumDark]: 'Piel morena',
  [ESkinTone.Dark]: 'Piel oscura',
}

export const HAIR_STYLE_LABELS: Readonly<Record<EHairStyle, string>> = {
  [EHairStyle.Short]: 'Media melena',
  [EHairStyle.Long]: 'Largo',
  [EHairStyle.Ponytail]: 'Coleta',
  [EHairStyle.Curly]: 'Rizos',
  [EHairStyle.Bun]: 'Moño',
  [EHairStyle.Crop]: 'Corto',
  [EHairStyle.Buzz]: 'Rapado',
  [EHairStyle.SidePart]: 'Con raya',
}

export const FACIAL_HAIR_LABELS: Readonly<Record<EFacialHair, string>> = {
  [EFacialHair.None]: 'Nada',
  [EFacialHair.Moustache]: 'Bigote',
  [EFacialHair.Beard]: 'Barba',
}

/** The cheeks choice: on, off. */
export function blushLabel(blush: boolean): string {
  return blush ? 'Con colorete' : 'Sin colorete'
}

export const HAIR_COLOR_LABELS: Readonly<Record<EHairColor, string>> = {
  [EHairColor.Black]: 'Pelo negro',
  [EHairColor.DarkBrown]: 'Pelo castaño oscuro',
  [EHairColor.Brown]: 'Pelo castaño',
  [EHairColor.Blonde]: 'Pelo rubio',
  [EHairColor.Red]: 'Pelo pelirrojo',
  [EHairColor.Grey]: 'Pelo canoso',
}

export const OUTFIT_LABELS: Readonly<Record<EOutfitColor, string>> = {
  [EOutfitColor.Red]: 'Ropa roja',
  [EOutfitColor.Blue]: 'Ropa azul',
  [EOutfitColor.Green]: 'Ropa verde',
  [EOutfitColor.Yellow]: 'Ropa amarilla',
  [EOutfitColor.Purple]: 'Ropa morada',
  [EOutfitColor.Orange]: 'Ropa naranja',
  [EOutfitColor.Pink]: 'Ropa rosa',
  [EOutfitColor.Teal]: 'Ropa turquesa',
}
