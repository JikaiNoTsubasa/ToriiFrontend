/**
 * Enums exchanged with the API. On the backend, every enum is serialized as an
 * UPPERCASE string (e.g. `"ON_GOING"`), identical to its database value; numeric
 * values are rejected. On the frontend, an enum is therefore a string union.
 *
 * Declaration (mirror of the C# enum, same UPPER_SNAKE names):
 *   export const TASK_STATUSES = apiEnum('NEW', 'ON_GOING', 'COMPLETED');
 *   export type TaskStatus = ApiEnumValue<typeof TASK_STATUSES>;
 *
 * Exhaustive labels / styles (the compiler flags any missing value):
 *   const STATUS_LABELS: ApiEnumMap<TaskStatus, string> = {
 *     NEW: 'New', ON_GOING: 'In progress', COMPLETED: 'Completed',
 *   };
 */

/** Frozen list of an API enum's values, usable for selects or filters. */
export function apiEnum<const T extends readonly string[]>(...values: T): T {
  return Object.freeze(values) as T;
}

/** Union of the values of an enum declared with {@link apiEnum}. */
export type ApiEnumValue<T extends readonly string[]> = T[number];

/** Exhaustive mapping enum value → display data (label, CSS class…). */
export type ApiEnumMap<E extends string, V> = Readonly<Record<E, V>>;

/**
 * Type guard: checks that an arbitrary string (query param, local storage…)
 * is a value of the enum. Case-insensitive like the API; returns the value
 * normalized to UPPERCASE, or `null` if it is unknown.
 */
export function parseApiEnum<T extends readonly string[]>(
  values: T,
  raw: string | null | undefined,
): ApiEnumValue<T> | null {
  if (raw == null) {
    return null;
  }
  const upper = raw.toUpperCase();
  return (values as readonly string[]).includes(upper) ? (upper as ApiEnumValue<T>) : null;
}
