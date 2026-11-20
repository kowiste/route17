// A tiny key/value store: what infra repositories save progress and settings
// with. The browser one never throws: when storage is blocked (private mode,
// cleared site data) it keeps the values in memory for the session.

export interface KeyValueStore {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}

/** Every key the game writes starts with this. */
export const STORAGE_PREFIX = 'route17:'

export class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  get(key: string): string | null {
    return this.values.get(key) ?? null
  }

  set(key: string, value: string): void {
    this.values.set(key, value)
  }

  remove(key: string): void {
    this.values.delete(key)
  }
}

class BrowserStore implements KeyValueStore {
  private readonly fallback = new MemoryStore()

  get(key: string): string | null {
    try {
      return window.localStorage.getItem(STORAGE_PREFIX + key)
    } catch {
      return this.fallback.get(key)
    }
  }

  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, value)
    } catch {
      this.fallback.set(key, value)
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key)
    } catch {
      this.fallback.remove(key)
    }
  }
}

/** The store backed by the browser's `localStorage`. */
export function browserStore(): KeyValueStore {
  return new BrowserStore()
}
