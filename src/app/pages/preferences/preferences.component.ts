import { Component, computed, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CuisineStyle, DietPreference, TimeCategory } from "../../core/models/recipe.models";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { ChoiceChipComponent } from "../../recipes/choice-chip/choice-chip.component";
import { IconComponent } from "../../shared/icon/icon.component";

/** Cooking time options with their English label and duration hint. */
const TIME_OPTIONS: { value: TimeCategory; label: string; hint: string }[] = [
  { value: "quick", label: "Quick", hint: "up to 20min" },
  { value: "medium", label: "Medium", hint: "25-40min" },
  { value: "elaborate", label: "Complex", hint: "over 45min" },
];

/** Cuisine options in the order used by the Figma design. */
const CUISINE_OPTIONS: { value: CuisineStyle; label: string }[] = [
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "indian", label: "Indian" },
  { value: "japanese", label: "Japanese" },
  { value: "gourmet", label: "Gourmet" },
  { value: "fusion", label: "Fusion" },
];

/** Diet options in the order used by the Figma design. */
const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "none", label: "No preferences" },
];

/**
 * Step 2 of the recipe generator wizard ("Choose your preferences"):
 * portions, number of chefs, cooking time, cuisine and diet.
 */
@Component({
  selector: "app-preferences",
  standalone: true,
  imports: [RouterLink, LogoComponent, IconComponent, ChoiceChipComponent],
  templateUrl: "./preferences.component.html",
})
export class PreferencesComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly router = inject(Router);

  protected readonly timeOptions = TIME_OPTIONS;
  protected readonly cuisineOptions = CUISINE_OPTIONS;
  protected readonly dietOptions = DIET_OPTIONS;

  protected readonly preferences = this.wizard.preferences;

  /** True once cooking time, cuisine and diet have all been picked. */
  protected readonly canGenerate = computed(() => {
    const { timeCategory, cuisineStyle, diet } = this.preferences();
    return timeCategory !== null && cuisineStyle !== null && diet !== null;
  });

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
