// All randomness in the game goes through `Random`, so tests can replay a run
// with the same seed. Never call `Math.random()` outside this file.

export interface Random {
  /** A number in [0, 1). */
  next(): number
  /** An integer in [0, maxExclusive). */
  int(maxExclusive: number): number
  /** A new array with the items in random order (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[]
  /** One item; throws on an empty list. */
  pick<T>(items: readonly T[]): T
}

/** mulberry32: small, fast and good enough for a game. Same seed, same sequence. */
export class SeededRandom implements Random {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(`int(): maxExclusive must be a positive integer, got ${maxExclusive}`)
    }
    return Math.floor(this.next() * maxExclusive)
  }

  shuffle<T>(items: readonly T[]): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(i + 1)
      const a = result[i]
      const b = result[j]
      if (a === undefined || b === undefined) continue
      result[i] = b
      result[j] = a
    }
    return result
  }

  pick<T>(items: readonly T[]): T {
    const item = items[this.int(items.length || 1)]
    if (item === undefined) throw new RangeError('pick(): the list is empty')
    return item
  }
}

/** A fresh seed for a real game. */
export function newSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0
}

/** A `Random` with a fresh seed. */
export function newRandom(): Random {
  return new SeededRandom(newSeed())
}
