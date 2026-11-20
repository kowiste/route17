// Facial hair, painted over the face in the hair colour. Keys: o outline,
// h hair, m mouth (left showing through the beard). Each layer says which face
// row it starts on (row 0 is the top of the head; the eyes are on rows 5–6, the
// cheeks on 7, the mouth on 8, the chin outline on 9).

import { EFacialHair } from '@/contracts/avatar'

export interface FacialHairLayer {
  readonly rows: readonly string[]
  /** The face row of the first row. */
  readonly faceRow: number
}

const MOUSTACHE: FacialHairLayer = {
  // Above the mouth, across the middle of the face.
  rows: ['.....hhhh.....'],
  faceRow: 7,
}

const BEARD: FacialHairLayer = {
  // Sideburns down to a full beard around the mouth and over the chin.
  rows: ['..oh......ho..', '..oh.hhhh.ho..', '...ohhmmhho...', '....ohhhho....'],
  faceRow: 6,
}

export const FACIAL_HAIR: Readonly<Record<EFacialHair, FacialHairLayer | null>> = {
  [EFacialHair.None]: null,
  [EFacialHair.Moustache]: MOUSTACHE,
  [EFacialHair.Beard]: BEARD,
}
