// The home feature's ports.

import type { SetID } from '@/contracts/question'

/** Her record per question set: the furthest rung reached (0–17). The round feature keeps it. */
export interface IRecordBook {
  best(setID: SetID): Promise<number>
}
