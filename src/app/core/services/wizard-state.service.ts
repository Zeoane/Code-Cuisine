import { Injectable, signal } from "@angular/core";
import {
  CuisineStyle,
  DietPreference,
  GeneratedRecipe,
  IngredientEntry,
  TimeCategory,
} from "../models/recipe.models";

/** Preferences collected in step 2 of the generator wizard. */
export interface WizardPreferences {
  servings: number;
  helpers: number;
  timeCategory: TimeCategory | null;
  cuisineStyle: CuisineStyle | null;
  diet: DietPreference | null;
}

/** Defaults shown when the preferences step is opened for the first time. */
const INITIAL_PREFERENCES: WizardPreferences = {
  servings: 2,
  helpers: 1,
  timeCategory: null,
  cuisineStyle: null,
  diet: null,
};

/**
 * Carries the generator wizard state across its steps (ingredients from
 * step 1, preferences from step 2) so navigating between the pages does not
 * lose what the user already entered.
 */
@Injectable({ providedIn: "root" })
export class WizardStateService {
  readonly ingredients = signal<IngredientEntry[]>([]);
  readonly preferences = signal<WizardPreferences>({ ...INITIAL_PREFERENCES });
  readonly results = signal<GeneratedRecipe[]>([]);

  /** Merges a partial preferences update into the current state. */
  patchPreferences(patch: Partial<WizardPreferences>): void {
    this.preferences.update(current => ({ ...current, ...patch }));
  }

  /** Clears ingredients, preferences and results (e.g. after a finished run). */
  reset(): void {
    this.ingredients.set([]);
    this.preferences.set({ ...INITIAL_PREFERENCES });
    this.results.set([]);
  }
}
