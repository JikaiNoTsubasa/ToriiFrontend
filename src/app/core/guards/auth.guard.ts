import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';

/**
 * Protège les routes authentifiées. Autorise si un utilisateur est chargé,
 * ou si un token est présent (le rechargement de l'utilisateur / refresh est
 * géré par l'intercepteur au premier appel API).
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
