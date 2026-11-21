/**
 * Enums échangés avec l'API. Côté back, tout enum est sérialisé en chaîne
 * MAJUSCULE (ex. `"ON_GOING"`), identique à sa valeur en base ; les valeurs
 * numériques sont refusées. Côté front, un enum est donc une union de chaînes.
 *
 * Déclaration (miroir de l'enum C#, mêmes noms en UPPER_SNAKE) :
 *   export const TASK_STATUSES = apiEnum('NEW', 'ON_GOING', 'COMPLETED');
 *   export type TaskStatus = ApiEnumValue<typeof TASK_STATUSES>;
 *
 * Libellés / styles exhaustifs (le compilateur signale toute valeur oubliée) :
 *   const STATUS_LABELS: ApiEnumMap<TaskStatus, string> = {
 *     NEW: 'Nouvelle', ON_GOING: 'En cours', COMPLETED: 'Terminée',
 *   };
 */

/** Liste figée des valeurs d'un enum API, utilisable pour les selects ou les filtres. */
export function apiEnum<const T extends readonly string[]>(...values: T): T {
  return Object.freeze(values) as T;
}

/** Union des valeurs d'un enum déclaré via {@link apiEnum}. */
export type ApiEnumValue<T extends readonly string[]> = T[number];

/** Association exhaustive valeur d'enum → donnée d'affichage (libellé, classe CSS…). */
export type ApiEnumMap<E extends string, V> = Readonly<Record<E, V>>;

/**
 * Garde de type : vérifie qu'une chaîne quelconque (query param, stockage local…)
 * est une valeur de l'enum. Insensible à la casse comme l'API ; renvoie la valeur
 * normalisée en MAJUSCULES, ou `null` si elle est inconnue.
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
