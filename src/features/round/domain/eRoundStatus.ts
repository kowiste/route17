/** Where a round is: it starts `playing` and ends once, in one of the other three. */
export enum ERoundStatus {
  Playing = 'playing',
  /** She answered all 17 right: "¡Nacionalidad!". */
  Won = 'won',
  /** A wrong answer: she keeps the last safe rung's points. */
  Lost = 'lost',
  /** She stopped: she keeps the points she had. */
  Stopped = 'stopped',
}
