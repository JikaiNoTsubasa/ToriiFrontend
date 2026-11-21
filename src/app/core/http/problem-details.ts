import { HttpContext, HttpContextToken, HttpErrorResponse } from '@angular/common/http';

/** Normalized error response returned by the API (RFC 9457). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  /** Per-field validation errors (returned by ValidationException). */
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

/** Normalized application error, directly usable by the UI. */
export interface AppError {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  /** Raw ProblemDetails response, if available. */
  problem?: ProblemDetails;
}

/**
 * HTTP context token letting a request disable the global error
 * notification — useful when the component handles the error inline itself
 * (e.g. the sign-in form) or for background calls.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/** Shortcut to build a context that disables the global notification. */
export function skipErrorNotification(): { context: HttpContext } {
  return { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) };
}

const DEFAULT_MESSAGE = 'An unexpected error occurred.';

function isProblemDetails(body: unknown): body is ProblemDetails {
  return (
    typeof body === 'object' &&
    body !== null &&
    ('title' in body || 'detail' in body || 'status' in body)
  );
}

/**
 * Converts an {@link HttpErrorResponse} into an {@link AppError}, interpreting
 * the ProblemDetails body when present, and handling edge cases
 * (network error, text body, ad hoc message).
 */
export function toAppError(error: HttpErrorResponse): AppError {
  // Status 0: no server response (network down, CORS, unreachable server).
  if (error.status === 0) {
    return {
      status: 0,
      title: 'Connection problem',
      detail: 'Unable to reach the server. Please check your connection.',
    };
  }

  const body = error.error;

  if (isProblemDetails(body)) {
    return {
      status: body.status ?? error.status,
      title: body.title ?? error.statusText ?? 'Error',
      detail: body.detail ?? DEFAULT_MESSAGE,
      errors: body.errors,
      traceId: body.traceId,
      problem: body,
    };
  }

  // Non-standard body: raw string, legacy { message } format or nothing.
  const detail =
    typeof body === 'string'
      ? body
      : ((body as { message?: string })?.message ?? error.message ?? DEFAULT_MESSAGE);

  return {
    status: error.status,
    title: error.statusText || 'Error',
    detail,
  };
}
