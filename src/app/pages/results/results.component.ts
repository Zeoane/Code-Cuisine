import { Component, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import { cuisineLabel, timeLabel } from "../../core/data/preference-options";
import { ToastService } from "../../core/services/toast.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";

/**
 * Step 3 of the generator wizard ("The recipe results"): the three suggestions
 * produced from the entered ingredients and the chosen preferences.
 */
@Component({
  selector: "app-results",
  standalone: true,
  imports: [LogoComponent],
  templateUrl: "./results.component.html",
})
export class ResultsComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly recipes = this.wizard.results;

  /** Cuisine and cooking time of this run, shown as tags under the intro. */
  protected readonly tags = computed(() => {
    const { cuisineStyle, timeCategory } = this.wizard.preferences();
    return [cuisineLabel(cuisineStyle), timeLabel(timeCategory)].filter(
      (label): label is string => label !== null,
    );
  });

  /** Opens the single recipe view (follows once that screen is designed). */
  openRecipe(title: string): void {
    this.toast.info(`"${title}" – die Einzelansicht folgt als Nächstes.`);
  }

  /** Starts over at the ingredient step, keeping what was entered. */
  generateNew(): void {
    this.router.navigate(["/generator"]);
  }
}
