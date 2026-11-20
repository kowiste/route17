// The three lifelines (comodines), shared by the round rules and the UI kit.

/** Each can be used once per round. */
export enum ELifeline {
  /** Removes one wrong option. Not on true/false questions. */
  FiftyFifty = 'fiftyFifty',
  /** El público: a vote per option. */
  Audience = 'audience',
  /** Llamar a un amigo: the friend names an option and how sure they are. */
  Friend = 'friend',
}

/** The lifelines in the order they are shown. */
export const LIFELINES: readonly ELifeline[] = [
  ELifeline.FiftyFifty,
  ELifeline.Audience,
  ELifeline.Friend,
]
