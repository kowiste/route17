// The round's ports. Implemented in `round/infra/`.

import type { SetID } from '@/contracts/question'

/** Her record per question set: the furthest rung she has ever reached (0–17). */
export interface IRoundRecords {
  /** Her record on the set; 0 when she has none. */
  best(setID: SetID): Promise<number>
  /** Stores `rung` as her record on the set. The round service calls it only with a new record. */
  save(setID: SetID, rung: number): Promise<void>
}
