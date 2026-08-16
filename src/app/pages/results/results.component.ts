import { Component, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import { cuisineLabel, timeLabel } from "../../core/data/preference-options";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/**
 * Step 3 of the generator wizard ("The recipe results"): the three suggestions
 * produced from the entered ingredients and the chosen preferences.
 */
@Component({
  selector: "app-results",
  standalone: true,
  imports: [LogoComponent, LogoutButtonComponent],
  templateUrl: "./results.component.html",
})
export class ResultsComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly router = inject(Router);

  protected readonly recipes = this.wizard.results;

  /** Cuisine and cooking time of this run, shown as tags under the intro. */
  protected readonly tags = computed(() => {
    const { cuisineStyle, timeCategory } = this.wizard.preferences();
    return [cuisineLabel(cuisineStyle), timeLabel(timeCategory)].filter(
      (label): label is string => label !== null,
    );
  });

  /** Opens the single recipe view for the card at the given position. */
  openRecipe(index: number): void {
    this.router.navigate(["/recipe", index]);
  }

  /** Starts over at the ingredient step, keeping what was entered. */
  generateNew(): void {
    this.router.navigate(["/generator"]);
  }
}
