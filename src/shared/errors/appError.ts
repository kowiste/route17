// Domain and app code throw `AppError`; only the screens decide how to show one.

export enum EErrorCode {
  /** An action that the current state doesn't allow (confirm before select, a lifeline twice…). */
  InvalidState = 'invalidState',
  /** Input that breaks a rule (an option out of range, a count below 1…). */
  InvalidInput = 'invalidInput',
  /** A set or question that doesn't exist. */
  NotFound = 'notFound',
  /** A question file or saved data that doesn't match its schema. */
  CorruptData = 'corruptData',
}

export class AppError extends Error {
  readonly code: EErrorCode
  readonly details: Readonly<Record<string, unknown>>

  constructor(code: EErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}
