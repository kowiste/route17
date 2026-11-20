// One landmark per comunidad, drawn next to its stop on the map.

import { EComunidadID } from '@/contracts/comunidad'
import type { Sprite } from '../sprite'
import {
  ARTES_Y_CIENCIAS,
  GIRALDA,
  MURCIA_CATHEDRAL,
  PALMA_CATHEDRAL,
  PILAR,
  SAGRADA_FAMILIA,
  SAN_FERMIN,
  TEIDE,
} from './landmarksFirstHalf'
import {
  ALTAMIRA,
  GUGGENHEIM,
  HORREO,
  MERIDA_THEATRE,
  PUERTA_DE_ALCALA,
  RIOJA_WINE,
  SANTIAGO_CATHEDRAL,
  SEGOVIA_AQUEDUCT,
  WINDMILL,
} from './landmarksSecondHalf'

export const LANDMARKS: Readonly<Record<EComunidadID, Sprite>> = {
  [EComunidadID.Canarias]: TEIDE,
  [EComunidadID.Andalucia]: GIRALDA,
  [EComunidadID.Murcia]: MURCIA_CATHEDRAL,
  [EComunidadID.Valenciana]: ARTES_Y_CIENCIAS,
  [EComunidadID.Baleares]: PALMA_CATHEDRAL,
  [EComunidadID.Cataluna]: SAGRADA_FAMILIA,
  [EComunidadID.Aragon]: PILAR,
  [EComunidadID.Navarra]: SAN_FERMIN,
  [EComunidadID.Rioja]: RIOJA_WINE,
  [EComunidadID.PaisVasco]: GUGGENHEIM,
  [EComunidadID.Cantabria]: ALTAMIRA,
  [EComunidadID.Asturias]: HORREO,
  [EComunidadID.Galicia]: SANTIAGO_CATHEDRAL,
  [EComunidadID.CastillaYLeon]: SEGOVIA_AQUEDUCT,
  [EComunidadID.Extremadura]: MERIDA_THEATRE,
  [EComunidadID.CastillaLaMancha]: WINDMILL,
  [EComunidadID.Madrid]: PUERTA_DE_ALCALA,
}

/** A small landmark drawn next to a comunidad's stop. */
export function landmarkSprite(comunidad: EComunidadID): Sprite {
  return LANDMARKS[comunidad]
}
