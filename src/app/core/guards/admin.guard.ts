import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Restricts a branch of routes to ADMINs. As `canMatch`: the route is not even
 * matched (nor its lazy code loaded) for a non-admin, who is redirected home.
 * The user is rehydrated by the app initializer before the first navigation.
 * UI convenience only: the real protection is in the API ([Authorize(Roles = "ADMIN")]).
 */
export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/']);
};
