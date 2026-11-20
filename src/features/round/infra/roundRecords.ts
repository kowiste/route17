// Her record per question set in the browser's key/value store: one key per
// set, `record:<setID>`. Data that can't be read counts as no record, with a
// warning.

import { z } from 'zod'
import type { SetID } from '@/contracts/question'
import { ROUND_LENGTH } from '@/contracts/route'
import { logger as defaultLogger, type Logger } from '@/shared/logger/logger'
import type { KeyValueStore } from '@/shared/storage/keyValueStore'
import type { IRoundRecords } from '../domain/interface'

/** The key of a set's record (the store adds its own prefix). */
export function recordKey(setID: SetID): string {
  return `record:${setID}`
}

const storedRecordSchema = z.object({
  version: z.literal(1),
  setID: z.string().min(1),
  best: z.number().int().min(0).max(ROUND_LENGTH),
})

type StoredRecord = z.infer<typeof storedRecordSchema>

function toStored(setID: SetID, best: number): StoredRecord {
  return { version: 1, setID, best }
}

export class KeyValueRoundRecords implements IRoundRecords {
  constructor(
    private readonly store: KeyValueStore,
    private readonly log: Logger = defaultLogger
  ) {}

  async best(setID: SetID): Promise<number> {
    const raw = this.store.get(recordKey(setID))
    if (raw === null) return 0
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      return this.unreadable(setID, 'not JSON')
    }
    const parsed = storedRecordSchema.safeParse(data)
    if (!parsed.success) return this.unreadable(setID, 'not a valid record')
    if (parsed.data.setID !== setID) return this.unreadable(setID, 'saved for another set')
    return parsed.data.best
  }

  async save(setID: SetID, rung: number): Promise<void> {
    this.store.set(recordKey(setID), JSON.stringify(toStored(setID, rung)))
  }

  private unreadable(setID: SetID, reason: string): number {
    this.log.warn('round: the saved record can not be read; starting with none', {
      setID,
      reason,
    })
    return 0
  }
}
