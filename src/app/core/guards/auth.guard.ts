import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';

/**
 * Protects authenticated routes. Allows access if a user is loaded,
 * or if a token is present (reloading the user / refreshing is handled
 * by the interceptor on the first API call).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const storage = inject(TokenStorageService);
  const router = inject(Router);

  if (auth.isAuthenticated() || storage.refreshToken) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
