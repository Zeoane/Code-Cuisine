import { Component, Input, computed, signal } from "@angular/core";
import { NutritionInfo } from "../../core/models/recipe.models";
import { totalNutrition } from "../../core/services/nutrition-facts";
import { NutritionSplitComponent } from "../nutrition-split/nutrition-split.component";

/** Compact nutrition facts grid per serving (User Story 10). */
@Component({
  selector: "app-recipe-nutrition",
  standalone: true,
  imports: [NutritionSplitComponent],
  templateUrl: "./recipe-nutrition.component.html",
})
export class RecipeNutritionComponent {
  private readonly source = signal<NutritionInfo | null>(null);
  private readonly portions = signal(1);

  @Input({ required: true }) set nutrition(value: NutritionInfo) {
    this.source.set(value);
  }

  /** Portions the recipe yields, used for the whole-recipe totals. */
  @Input() set servings(value: number) {
    this.portions.set(value);
  }

  /** Per-serving label/value pairs shown in the nutrition grid. */
  protected readonly rows = computed<[string, string][]>(() => {
    const n = this.source();
    if (!n) return [];
    return [
      ["Calories", `${Math.round(n.caloriesPerServing)} kcal`],
      ["Protein", `${Math.round(n.proteinGrams)} g`],
      ["Carbs", `${Math.round(n.carbsGrams)} g`],
      ["Fat", `${Math.round(n.fatGrams)} g`],
    ];
  });

  /** Rounded whole-recipe values, or null when the recipe is a single portion. */
  protected readonly total = computed(() => {
    const n = this.source();
    if (!n || this.portions() <= 1) return null;
    const whole = totalNutrition(n, this.portions());
    return {
      calories: Math.round(whole.caloriesPerServing),
      protein: Math.round(whole.proteinGrams),
      carbs: Math.round(whole.carbsGrams),
      fat: Math.round(whole.fatGrams),
    };
  });

  /** Per-serving facts, for the macro split bar. */
  protected readonly nutritionValue = computed(() => this.source());

  /** How many portions the totals line refers to. */
  protected readonly servingCount = computed(() => this.portions());
}
