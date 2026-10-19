import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { dietLabel, timeLabel } from "../../core/data/preference-options";
import { IngredientUnit } from "../../core/models/recipe.models";
import { conflictingIngredients, dietSafeIngredients } from "../../core/services/diet-check";
import { totalNutrition } from "../../core/services/nutrition-facts";
import { RecipeStoreService } from "../../core/services/recipe-store.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { NutritionSplitComponent } from "../../recipes/nutrition-split/nutrition-split.component";
import { HeartIconComponent } from "../../shared/heart-icon/heart-icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/** Short display suffix appended directly after the quantity number. */
const UNIT_SUFFIX: Record<IngredientUnit, string> = {
  gram: "g",
  ml: "ml",
  piece: " piece",
};

/** One line of the "Your ingredients" column. */
interface IngredientLine {
  key: string;
  amount: string;
  name: string;
}

/**
 * "One recipe view": the full recipe with nutrition facts, the ingredients
 * split into the user's own and the extras, and the directions assigned to
 * the available cooks.
 *
 * Serves two routes with the same markup. /recipe/:index shows a recipe of
 * the run that just finished, together with the quantities the user entered
 * and the preferences they picked. /cookbook/recipe/:id shows a recipe from
 * the cookbook, where none of that context exists any more - there the
 * recipe's own stored ingredient list and difficulty stand in for it.
 */
@Component({
  selector: "app-recipe-view",
  standalone: true,
  imports: [
    RouterLink,
    LogoComponent,
    HeartIconComponent,
    LogoutButtonComponent,
    NutritionSplitComponent,
  ],
  templateUrl: "./recipe-view.component.html",
})
export class RecipeViewComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly store = inject(RecipeStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Id of the cookbook recipe to show, or null on the results route. */
  private readonly storedId = (() => {
    const raw = Number(this.route.snapshot.paramMap.get("id"));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  })();

  /** True when this page was opened from the cookbook instead of the results. */
  protected readonly fromCookbook = this.storedId !== null;

  /** The recipe addressed by the route, from the cookbook or the current run. */
  protected readonly recipe = computed(() => {
    if (this.storedId !== null) return this.store.getById(this.storedId) ?? null;
    const index = Number(this.route.snapshot.paramMap.get("index"));
    return this.wizard.results()[index] ?? null;
  });

  protected readonly preferences = this.wizard.preferences;

  /** Cooks the recipe was written for: the recipe's own number wins. */
  protected readonly helpers = computed(
    () => this.recipe()?.helpers ?? this.preferences().helpers,
  );

  /** Cooks available for this recipe, rendered as Chef 1 / Chef 2 labels. */
  protected readonly cooks = computed(() =>
    Array.from({ length: this.helpers() }, (_, index) => index + 1),
  );

  /**
   * The ingredient column. A finished run still knows the quantities the user
   * typed in, so those are shown; a cookbook recipe only carries its own
   * ingredient list, where the amount is already part of the text.
   */
  protected readonly ingredientLines = computed<IngredientLine[]>(() => {
    const recipe = this.recipe();
    if (this.storedId !== null) {
      return (recipe?.ingredients ?? []).map((text, index) => ({
        key: `${index}-${text}`,
        amount: "",
        name: text,
      }));
    }
    return dietSafeIngredients(this.wizard.ingredients(), this.preferences().diet ?? "none").map(
      entry => ({
        key: String(entry.id),
        amount: `${entry.quantity}${UNIT_SUFFIX[entry.unit]}`,
        name: entry.name,
      }),
    );
  });

  /** Entered ingredients the selected diet ruled out, shown as a footnote. */
  protected readonly skippedIngredients = computed(() =>
    this.storedId !== null
      ? []
      : conflictingIngredients(this.wizard.ingredients(), this.preferences().diet ?? "none"),
  );

  /** The skipped ingredients as one readable list. */
  protected readonly skippedNames = computed(() => {
    const names = this.skippedIngredients().map(entry => entry.name);
    if (names.length <= 1) return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  });

  /** Label of the selected diet, for the skipped-ingredients footnote. */
  protected readonly dietName = computed(() =>
    (dietLabel(this.preferences().diet) ?? "diet").toLowerCase(),
  );

  /**
   * Tags in the header card. A run shows what the user asked for; a cookbook
   * recipe shows what it turned out to be, the same pair the cuisine list
   * puts next to it.
   */
  protected readonly tags = computed(() => {
    const recipe = this.recipe();
    if (this.storedId !== null) {
      if (!recipe) return [];
      const difficulty = recipe.difficulty[0].toUpperCase() + recipe.difficulty.slice(1);
      return recipe.cookingTimeMinutes <= 20 ? [difficulty, "Quick"] : [difficulty];
    }
    const { diet, timeCategory } = this.preferences();
    return [dietLabel(diet), timeLabel(timeCategory)].filter(
      (label): label is string => label !== null,
    );
  });

  /** Id this page's heart writes to, or null while the recipe has none yet. */
  protected readonly likeId = computed(() => this.recipe()?.id ?? null);

  /** True when this browser has already given this recipe a heart. */
  protected readonly liked = computed(() => {
    const id = this.likeId();
    return id === null ? false : this.store.hasLiked(id);
  });

  /** Hearts this recipe has collected. */
  protected readonly likes = computed(() => {
    const id = this.likeId();
    return id === null ? 0 : this.store.likesOf(id);
  });

  /** Rounded whole-recipe nutrition, or null when the recipe is a single portion. */
  protected readonly wholeRecipe = computed(() => {
    const recipe = this.recipe();
    if (!recipe?.nutrition || recipe.servings <= 1) return null;
    const whole = totalNutrition(recipe.nutrition, recipe.servings);
    return {
      calories: Math.round(whole.caloriesPerServing),
      protein: Math.round(whole.proteinGrams),
      fat: Math.round(whole.fatGrams),
      carbs: Math.round(whole.carbsGrams),
    };
  });

  /** Asset for the chef label of a given cook number (1-3). */
  cookLabel(cook: number): string {
    const index = Math.min(Math.max(cook, 1), 3);
    return `assets/img/OneRecipe-Page/cook-label-${index}.svg`;
  }

  /** Adds or withdraws this browser's heart. */
  toggleLike(): void {
    const id = this.likeId();
    if (id === null) return;
    void this.store.toggleLike(id);
  }

  /** Back to the cuisine list it came from, or to the results of the run. */
  goBack(): void {
    const cuisine = this.recipe()?.cuisineStyle;
    if (this.storedId !== null) {
      this.router.navigate(cuisine ? ["/recipes", cuisine] : ["/cookbook"]);
      return;
    }
    this.router.navigate(["/results"]);
  }

  /** Discards the finished run and starts over with empty ingredients. */
  generateNew(): void {
    this.wizard.startNewRun();
  }
}
