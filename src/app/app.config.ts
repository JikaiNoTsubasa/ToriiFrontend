import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
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
    provideRouter(routes),
    // errorInterceptor en premier (le plus externe) : authInterceptor voit
    // ainsi la HttpErrorResponse brute pour gérer le refresh sur 401.
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    // Au démarrage : si un token est présent, on réhydrate l'utilisateur.
    // En cas d'échec (session expirée), on nettoie l'état côté front ;
    // l'intercepteur / le guard se chargent alors de la redirection.
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
