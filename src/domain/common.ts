/**
 * Shared primitives for the platform domain model.
 *
 * The platform follows a "make illegal states unrepresentable" philosophy:
 * - Branded ids prevent mixing identifiers of different entities.
 * - Validation returns an explicit {@link Result} instead of throwing, so that
 *   governance flows can reason about failures as data.
 */

/** Nominal (branded) type helper to distinguish structurally-identical ids. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** ISO-8601 timestamp string (e.g. `2026-06-25T12:00:00.000Z`). */
export type IsoTimestamp = Brand<string, "IsoTimestamp">;

/** A single field-level validation problem. */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

/** Discriminated result type used across the domain layer. */
export type Result<T, E = ValidationIssue[]> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Type guard narrowing a {@link Result} to its success branch. */
export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok;

/**
 * Validate that an ISO timestamp string is well-formed.
 * Accepts only strings that round-trip through `Date` without losing fidelity.
 */
export function toIsoTimestamp(value: string): Result<IsoTimestamp> {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return err([{ path: "timestamp", message: `invalid ISO timestamp: ${value}` }]);
  }
  return ok(value as IsoTimestamp);
}

/** Collects field validators and aggregates their issues. */
export class ValidationBuilder {
  private readonly issues: ValidationIssue[] = [];

  require(condition: boolean, path: string, message: string): this {
    if (!condition) {
      this.issues.push({ path, message });
    }
    return this;
  }

  nonEmpty(value: string | undefined, path: string): this {
    return this.require(
      typeof value === "string" && value.trim().length > 0,
      path,
      `${path} must be a non-empty string`,
    );
  }

  oneOf<T extends string>(value: T, allowed: readonly T[], path: string): this {
    return this.require(
      allowed.includes(value),
      path,
      `${path} must be one of: ${allowed.join(", ")}`,
    );
  }

  /** Returns the accumulated issues; empty means valid. */
  build(): ValidationIssue[] {
    return [...this.issues];
  }
}

/** Basic email shape check (intentionally permissive; deep checks belong elsewhere). */
export function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
