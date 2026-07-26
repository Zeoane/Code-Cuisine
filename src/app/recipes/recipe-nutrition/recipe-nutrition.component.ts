import { Component, Input } from "@angular/core";
import { NutritionInfo } from "../../core/models/recipe.models";

/** Compact nutrition facts grid per serving (User Story 10). */
@Component({
  selector: "app-recipe-nutrition",
  standalone: true,
  templateUrl: "./recipe-nutrition.component.html",
})
export class RecipeNutritionComponent {
  @Input({ required: true }) nutrition!: NutritionInfo;

  /** Label/value pairs shown in the nutrition grid. */
  rows(): [string, string][] {
    const n = this.nutrition;
    return [
      ["Kalorien", `${Math.round(n.caloriesPerServing)} kcal`],
      ["Protein", `${Math.round(n.proteinGrams)} g`],
      ["Kohlenhydrate", `${Math.round(n.carbsGrams)} g`],
      ["Fett", `${Math.round(n.fatGrams)} g`],
    ];
  }
}
