// Her character on the map: what she picks in the avatar editor. The avatar
// feature stores it; the sprites in `shared/pixel` draw it.

export enum ESkinTone {
  Light = 'light',
  LightMedium = 'light-medium',
  Medium = 'medium',
  MediumDark = 'medium-dark',
  Dark = 'dark',
}

/** Features she picks freely; there is no gender choice. */
export enum EHairStyle {
  /** A bob down to the jaw. */
  Short = 'short',
  Long = 'long',
  Ponytail = 'ponytail',
  Curly = 'curly',
  Bun = 'bun',
  /** Cut close, the forehead clear. */
  Crop = 'crop',
  /** Buzzed. */
  Buzz = 'buzz',
  /** Short, parted, the fringe swept to one side. */
  SidePart = 'side-part',
}

export enum EFacialHair {
  None = 'none',
  Moustache = 'moustache',
  Beard = 'beard',
}

export enum EHairColor {
  Black = 'black',
  DarkBrown = 'dark-brown',
  Brown = 'brown',
  Blonde = 'blonde',
  Red = 'red',
  Grey = 'grey',
}

export enum EOutfitColor {
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow',
  Purple = 'purple',
  Orange = 'orange',
  Pink = 'pink',
  Teal = 'teal',
}

export interface AvatarLook {
  readonly skin: ESkinTone
  readonly hairStyle: EHairStyle
  readonly hairColor: EHairColor
  readonly outfit: EOutfitColor
  /** Drawn in the hair colour. */
  readonly facialHair: EFacialHair
  /** Rosy cheeks. */
  readonly blush: boolean
}

/** What she looks like before she opens the editor. */
export const DEFAULT_AVATAR_LOOK: AvatarLook = {
  skin: ESkinTone.LightMedium,
  hairStyle: EHairStyle.Long,
  hairColor: EHairColor.DarkBrown,
  outfit: EOutfitColor.Red,
  facialHair: EFacialHair.None,
  blush: true,
}

/** What the character is doing: each pose has a few animation frames. */
export enum EAvatarPose {
  Idle = 'idle',
  Walk = 'walk',
  Cheer = 'cheer',
  Sad = 'sad',
}
