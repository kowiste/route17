// The sprite catalog: every sprite the game draws, behind these functions.
// The signatures are the contract between the sprites and the map; the art is
// in the other files of this folder.

export { avatarFrameCount, avatarSprite, AVATAR_HEIGHT, AVATAR_WIDTH } from './avatar'
export { HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS, type ColorPair } from './avatarColors'
export { fireworkFrames } from './fireworks'
export { landmarkSprite } from './landmarks'
export { EStopState, flagSprite, stopSprite } from './markers'
export { boatSprite, planeSprite } from './vehicles'
