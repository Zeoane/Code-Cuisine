import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

/**
 * Keeps the personal cookbook reachable only for signed-in users, redirecting
 * to /login (with a returnUrl) otherwise. Awaits Firebase's session restore
 * before deciding, so a page reload while logged in does not bounce the user.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } });
};
