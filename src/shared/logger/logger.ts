// The only place that writes to the console.

export interface Logger {
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
}

class ConsoleLogger implements Logger {
  info(message: string, data?: Record<string, unknown>): void {
    console.info(`[route17] ${message}`, data ?? '')
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[route17] ${message}`, data ?? '')
  }

  error(message: string, data?: Record<string, unknown>): void {
    console.error(`[route17] ${message}`, data ?? '')
  }
}

/** Collects messages instead of printing them: for tests. */
export class MemoryLogger implements Logger {
  readonly entries: { level: 'info' | 'warn' | 'error'; message: string }[] = []

  info(message: string): void {
    this.entries.push({ level: 'info', message })
  }

  warn(message: string): void {
    this.entries.push({ level: 'warn', message })
  }

  error(message: string): void {
    this.entries.push({ level: 'error', message })
  }
}

export const logger: Logger = new ConsoleLogger()
