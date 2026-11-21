import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';
import { SKIP_ERROR_NOTIFICATION, toAppError } from '../http/problem-details';

/**
 * Global error interceptor. Normalizes any {@link HttpErrorResponse} to the
 * ProblemDetails format ({@link AppError}), shows a global notification,
 * then propagates the AppError to subscribers.
 *
 * Two exceptions do not trigger a notification:
 *  - requests carrying {@link SKIP_ERROR_NOTIFICATION} (handled inline);
 *  - 401s, handled by the authentication flow (refresh / logout).
 *
 * Must be placed BEFORE `authInterceptor` in the chain, so that the latter
 * still sees the raw HttpErrorResponse to trigger the refresh on 401.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const appError = toAppError(error);
      const skip = req.context.get(SKIP_ERROR_NOTIFICATION);

      if (!skip && appError.status !== 401) {
        notifications.error(appError.title, appError.detail);
      }

      return throwError(() => appError);
    }),
  );
};
