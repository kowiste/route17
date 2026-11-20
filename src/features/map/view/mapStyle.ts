// How the map looks: the colour of each area (neighbours never share one) and
// the size of a sprite pixel on the map. Colours come only from the pixel palette.

import { EComunidadID } from '@/contracts/comunidad'
import type { PixelColor } from '@/shared/pixel/palette'
import { EAutonomousCity, type MapRegionID } from '../domain/lowPolyMap'

/** One sprite pixel, in map units (the viewBox is 1000 wide). */
export const SPRITE_PIXEL = 2.5

export const REGION_COLORS: Readonly<Record<MapRegionID, PixelColor>> = {
  [EComunidadID.Galicia]: 'grass',
  [EComunidadID.Asturias]: 'sand',
  [EComunidadID.Cantabria]: 'grassLight',
  [EComunidadID.PaisVasco]: 'grass',
  [EComunidadID.Navarra]: 'cream',
  [EComunidadID.Rioja]: 'sand',
  [EComunidadID.Aragon]: 'grassLight',
  [EComunidadID.Cataluna]: 'grass',
  [EComunidadID.Valenciana]: 'cream',
  [EComunidadID.Murcia]: 'grassLight',
  [EComunidadID.Andalucia]: 'grass',
  [EComunidadID.Extremadura]: 'grassLight',
  [EComunidadID.CastillaLaMancha]: 'sand',
  [EComunidadID.Madrid]: 'grassLight',
  [EComunidadID.CastillaYLeon]: 'earthLight',
  [EComunidadID.Baleares]: 'grassLight',
  [EComunidadID.Canarias]: 'sand',
  [EAutonomousCity.Ceuta]: 'earthLight',
  [EAutonomousCity.Melilla]: 'earthLight',
}

export const MAP_COLORS = {
  sea: 'sea',
  sparkle: 'seaLight',
  border: 'outline',
  abroad: 'greyLight',
  abroadBorder: 'grey',
  insetFrame: 'cream',
  dot: 'white',
  dotVisited: 'red',
  dotOutline: 'outline',
  record: 'gold',
} as const satisfies Record<string, PixelColor>
