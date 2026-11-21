import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';
import { SKIP_ERROR_NOTIFICATION, toAppError } from '../http/problem-details';

/**
 * Intercepteur global d'erreurs. Normalise toute {@link HttpErrorResponse} au
 * format ProblemDetails ({@link AppError}), affiche une notification globale,
 * puis propage l'AppError aux abonnés.
 *
 * Deux exceptions ne déclenchent pas de notification :
 *  - les requêtes portant {@link SKIP_ERROR_NOTIFICATION} (gérées en ligne) ;
 *  - les 401, prises en charge par le flux d'authentification (refresh / logout).
 *
 * Doit être placé AVANT `authInterceptor` dans la chaîne, afin que ce dernier
 * voie encore la HttpErrorResponse brute pour déclencher le refresh sur 401.
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
