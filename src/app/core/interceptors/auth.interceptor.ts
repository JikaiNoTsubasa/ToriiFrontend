import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';

/** Endpoints d'auth qui ne doivent PAS porter d'access token / ne pas déclencher de refresh. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

// État partagé pour dédupliquer les refresh concurrents.
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = storage.accessToken;
  const authReq = token && !isAuthEndpoint(req.url) ? withToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthEndpoint(req.url) &&
        storage.refreshToken
      ) {
        return handle401(req, next, auth, storage, router);
      }
      return throwError(() => error);
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  storage: TokenStorageService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    // Un refresh est déjà en cours : on attend son résultat puis on rejoue.
    return refreshDone$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken) => next(withToken(req, newToken))),
    );
  }

  isRefreshing = true;
  refreshDone$.next(null);

  return auth.refresh().pipe(
    switchMap((res) => {
      isRefreshing = false;
      refreshDone$.next(res.accessToken);
      return next(withToken(req, res.accessToken));
    }),
    catchError((error: unknown) => {
      isRefreshing = false;
      auth.logout();
      router.navigate(['/login']);
      return throwError(() => error);
    }),
  );
}
