// Her face and body in each pose. Keys: o outline, s skin, S its shade, e eyes,
// k blush, m mouth, t a tear, c outfit, C its shade, p shorts, w shoes.
// Faces are 10 rows (the head); bodies are 8 rows, starting on the chin row.

import { EAvatarPose } from '@/contracts/avatar'

const FACE = [
  '....oooooo....',
  '...osssssso...',
  '..osssssssso..',
  '..osssssssso..',
  '..osssssssso..',
  '..ossessesso..',
  '..ossessesso..',
  '..osksssskso..',
  '...ossmmsso...',
  '....oooooo....',
]

const FACE_HAPPY = [
  '....oooooo....',
  '...osssssso...',
  '..osssssssso..',
  '..osssssssso..',
  '..osssssssso..',
  '..ossessesso..',
  '..ossessesso..',
  '..osksooskso..',
  '...ossmmsso...',
  '....oooooo....',
]

const FACE_SAD = [
  '....oooooo....',
  '...osssssso...',
  '..osssssssso..',
  '..osssssssso..',
  '..osssssssso..',
  '..osssssssso..',
  '..oseesseeso..',
  '..ostsssssso..',
  '...ossmmsso...',
  '....oooooo....',
]

/** The tear has run down to her chin. */
const FACE_SAD_DRIP = [
  '....oooooo....',
  '...osssssso...',
  '..osssssssso..',
  '..osssssssso..',
  '..osssssssso..',
  '..osssssssso..',
  '..oseesseeso..',
  '..osssssssso..',
  '...tssmmsso...',
  '....oooooo....',
]

const BODY = [
  '...oooooooo...',
  '..occcccccco..',
  '..osocccCoso..',
  '..osoCccCoso..',
  '...oppppppo...',
  '...osSooSso...',
  '...owwoowwo...',
  '...oooooooo...',
]

/** Her left foot down, the right one lifted. */
const BODY_STEP_LEFT = [
  '...oooooooo...',
  '..occcccccco..',
  '..osocccCoso..',
  '..osoCccCoso..',
  '...oppppppo...',
  '...osSoowwo...',
  '...owwooooo...',
  '...oooo.......',
]

const BODY_STEP_RIGHT = [
  '...oooooooo...',
  '..occcccccco..',
  '..osocccCoso..',
  '..osoCccCoso..',
  '...oppppppo...',
  '...owwooSso...',
  '...ooooowwo...',
  '.......oooo...',
]

/** Her arms are up: they are drawn by ARMS_UP / ARMS_HIGH. */
const BODY_ARMS_UP = [
  '..oooooooooo..',
  '..occcccccco..',
  '...oCccccCo...',
  '...oCccccCo...',
  '...oppppppo...',
  '...osSooSso...',
  '...owwoowwo...',
  '...oooooooo...',
]

const BODY_SLUMPED = [
  '...oooooooo...',
  '...occcccco...',
  '..osCccccCso..',
  '..osCccccCso..',
  '...oppppppo...',
  '...osSooSso...',
  '...owwoowwo...',
  '...oooooooo...',
]

const ARMS_UP = [
  '.oo........oo.',
  'osso......osso',
  'osso......osso',
  '.oso......oso.',
  '.oso......oso.',
  '.oso......oso.',
  '.oso......oso.',
  '..oso....oso..',
  '..oco....oco..',
]

const ARMS_HIGH = [
  '.oo........oo.',
  'osso......osso',
  'osso......osso',
  '.oso......oso.',
  '.oso......oso.',
  '.oso......oso.',
  '.oso......oso.',
  '.oso......oso.',
  '..oso....oso..',
  '..oco....oco..',
]

export interface PoseFrame {
  readonly face: readonly string[]
  readonly body: readonly string[]
  /** How many rows her head sits lower than usual: a bob, a hung head. */
  readonly headDrop: number
  /** Raised arms, painted last (over her hair), with the row of their top edge. */
  readonly arms?: { readonly rows: readonly string[]; readonly y: number }
}

type Frames = readonly [PoseFrame, ...PoseFrame[]]

export const POSE_FRAMES: Readonly<Record<EAvatarPose, Frames>> = {
  // Breathing: her head bobs down and up.
  [EAvatarPose.Idle]: [
    { face: FACE, body: BODY, headDrop: 0 },
    { face: FACE, body: BODY, headDrop: 1 },
  ],
  // Left step, pass, right step, pass; she dips on each step.
  [EAvatarPose.Walk]: [
    { face: FACE, body: BODY_STEP_LEFT, headDrop: 1 },
    { face: FACE, body: BODY, headDrop: 0 },
    { face: FACE, body: BODY_STEP_RIGHT, headDrop: 1 },
    { face: FACE, body: BODY, headDrop: 0 },
  ],
  // Arms up, pumping: crouch, then stretch.
  [EAvatarPose.Cheer]: [
    { face: FACE_HAPPY, body: BODY_ARMS_UP, headDrop: 1, arms: { rows: ARMS_UP, y: 2 } },
    { face: FACE_HAPPY, body: BODY_ARMS_UP, headDrop: 0, arms: { rows: ARMS_HIGH, y: 1 } },
  ],
  // Head down, a tear running down her cheek.
  [EAvatarPose.Sad]: [
    { face: FACE_SAD, body: BODY_SLUMPED, headDrop: 1 },
    { face: FACE_SAD_DRIP, body: BODY_SLUMPED, headDrop: 1 },
  ],
}
