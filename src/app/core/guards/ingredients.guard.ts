import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { WizardStateService } from "../services/wizard-state.service";

/**
 * Keeps the later wizard steps (preferences, loading, results) unreachable
 * until at least one ingredient has been entered, including on direct URL
 * access or a page reload.
 */
export const ingredientsGuard: CanActivateFn = () => {
  const wizard = inject(WizardStateService);
  const router = inject(Router);

  return wizard.ingredients().length > 0 ? true : router.createUrlTree(["/generator"]);
};
