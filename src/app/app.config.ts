import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/auth/auth.service';
import { TokenStorageService } from './core/auth/token-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route parameters bound to component input()s (e.g. :id → id = input()).
    provideRouter(routes, withComponentInputBinding()),
    // errorInterceptor first (outermost): authInterceptor therefore sees
    // the raw HttpErrorResponse to handle the refresh on 401.
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    // At startup: if a token is present, rehydrate the user.
    // On failure (expired session), clear the frontend state;
    // the interceptor / guard then take care of the redirect.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const storage = inject(TokenStorageService);

      if (!storage.accessToken && !storage.refreshToken) {
        return;
      }

      return auth.loadCurrentUser().pipe(
        catchError(() => {
          auth.logout();
          return of(null);
        }),
      );
    }),
  ],
};
