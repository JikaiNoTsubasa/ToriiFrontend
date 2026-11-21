import { HttpContext, HttpContextToken, HttpErrorResponse } from '@angular/common/http';

/** Réponse d'erreur normalisée renvoyée par l'API (RFC 9457). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  /** Erreurs de validation par champ (renvoyées par ValidationException). */
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

/** Erreur applicative normalisée, directement exploitable par l'UI. */
export interface AppError {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  /** Réponse ProblemDetails brute, si disponible. */
  problem?: ProblemDetails;
}

/**
 * Jeton de contexte HTTP permettant à une requête de désactiver la notification
 * globale d'erreur — utile quand le composant gère lui-même l'erreur en ligne
 * (ex. formulaire de connexion) ou pour les appels d'arrière-plan.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/** Raccourci pour construire un contexte qui désactive la notification globale. */
export function skipErrorNotification(): { context: HttpContext } {
  return { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) };
}

const DEFAULT_MESSAGE = 'Une erreur inattendue est survenue.';

function isProblemDetails(body: unknown): body is ProblemDetails {
  return (
    typeof body === 'object' &&
    body !== null &&
    ('title' in body || 'detail' in body || 'status' in body)
  );
}

/**
 * Convertit une {@link HttpErrorResponse} en {@link AppError}, en interprétant
 * le corps ProblemDetails lorsqu'il est présent, et en gérant les cas limites
 * (erreur réseau, corps texte, message ad hoc).
 */
export function toAppError(error: HttpErrorResponse): AppError {
  // Statut 0 : pas de réponse serveur (réseau coupé, CORS, serveur injoignable).
  if (error.status === 0) {
    return {
      status: 0,
      title: 'Problème de connexion',
      detail: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    };
  }

  const body = error.error;

  if (isProblemDetails(body)) {
    return {
      status: body.status ?? error.status,
      title: body.title ?? error.statusText ?? 'Erreur',
      detail: body.detail ?? DEFAULT_MESSAGE,
      errors: body.errors,
      traceId: body.traceId,
      problem: body,
    };
  }

  // Corps non standard : chaîne brute, ancien format { message } ou rien.
  const detail =
    typeof body === 'string'
      ? body
      : ((body as { message?: string })?.message ?? error.message ?? DEFAULT_MESSAGE);

  return {
    status: error.status,
    title: error.statusText || 'Erreur',
    detail,
  };
}
