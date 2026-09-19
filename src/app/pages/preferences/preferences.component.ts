import { Component, OnInit, computed, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  TIME_OPTIONS,
  dietLabel,
} from "../../core/data/preference-options";
import { CuisineStyle, DietPreference, TimeCategory } from "../../core/models/recipe.models";
import { conflictingIngredients } from "../../core/services/diet-check";
import { QuotaService } from "../../core/services/quota.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { ChoiceChipComponent } from "../../recipes/choice-chip/choice-chip.component";
import { IconComponent } from "../../shared/icon/icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";
import { QuotaBadgeComponent } from "../../shared/quota-badge/quota-badge.component";

/**
 * Step 2 of the recipe generator wizard ("Choose your preferences"):
 * portions, number of chefs, cooking time, cuisine and diet.
 */
@Component({
  selector: "app-preferences",
  standalone: true,
  imports: [
    RouterLink,
    LogoComponent,
    IconComponent,
    ChoiceChipComponent,
    QuotaBadgeComponent,
    LogoutButtonComponent,
  ],
  templateUrl: "./preferences.component.html",
})
export class PreferencesComponent implements OnInit {
  private readonly wizard = inject(WizardStateService);
  private readonly router = inject(Router);
  private readonly quota = inject(QuotaService);

  protected readonly timeOptions = TIME_OPTIONS;
  protected readonly cuisineOptions = CUISINE_OPTIONS;
  protected readonly dietOptions = DIET_OPTIONS;

  protected readonly preferences = this.wizard.preferences;

  /** Entered ingredients that clash with the selected diet. */
  protected readonly dietConflicts = computed(() => {
    const diet = this.preferences().diet;
    return diet === null ? [] : conflictingIngredients(this.wizard.ingredients(), diet);
  });

  /** True when nothing the user entered survives the diet filter. */
  protected readonly allIngredientsConflict = computed(
    () =>
      this.dietConflicts().length > 0 &&
      this.dietConflicts().length === this.wizard.ingredients().length,
  );

  /** The clashing ingredient names as one readable list. */
  protected readonly conflictNames = computed(() => {
    const names = this.dietConflicts().map(entry => entry.name);
    if (names.length <= 1) return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  });

  /** "it" or "them", matching the number of clashing ingredients. */
  protected readonly conflictPronoun = computed(() =>
    this.dietConflicts().length === 1 ? "it" : "them",
  );

  /** Label of the selected diet, for the conflict notice. */
  protected readonly dietName = computed(() => dietLabel(this.preferences().diet) ?? "this diet");

  /**
   * True once cooking time, cuisine and diet are picked, the quota isn't
   * exhausted and at least one ingredient survives the diet filter.
   */
  protected readonly canGenerate = computed(() => {
    const { timeCategory, cuisineStyle, diet } = this.preferences();
    const hasPreferences = timeCategory !== null && cuisineStyle !== null && diet !== null;
    return hasPreferences && this.quota.ipRemaining() !== 0 && !this.allIngredientsConflict();
  });

  /** Fetches the current quota status so the badge is fresh when this step opens. */
  ngOnInit(): void {
    void this.quota.refresh();
  }

  /** Adjusts the portion count within the allowed 1-12 range. */
  stepServings(delta: number): void {
    const next = this.preferences().servings + delta;
    if (next < 1 || next > 12) return;
    this.wizard.patchPreferences({ servings: next });
  }

  /** Adjusts the number of cooking helpers within the allowed 1-3 range. */
  stepHelpers(delta: number): void {
    const next = this.preferences().helpers + delta;
    if (next < 1 || next > 3) return;
    this.wizard.patchPreferences({ helpers: next });
  }

  /** Selects a cooking time budget (clicking the active one clears it). */
  selectTime(value: TimeCategory): void {
    const current = this.preferences().timeCategory;
    this.wizard.patchPreferences({ timeCategory: current === value ? null : value });
  }

  /** Selects a cuisine style (clicking the active one clears it). */
  selectCuisine(value: CuisineStyle): void {
    const current = this.preferences().cuisineStyle;
    this.wizard.patchPreferences({ cuisineStyle: current === value ? null : value });
  }

  /** Selects a diet preference (clicking the active one clears it). */
  selectDiet(value: DietPreference): void {
    const current = this.preferences().diet;
    this.wizard.patchPreferences({ diet: current === value ? null : value });
  }

  /** Sends the user back to step 1 with their ingredients still in place. */
  backToIngredients(): void {
    this.router.navigate(["/generator"]);
  }

  /** Starts recipe generation and shows the loading view while it runs. */
  generate(): void {
    if (!this.canGenerate()) return;
    this.router.navigate(["/loading"]);
  }
}
