import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IngredientEntry } from "../../core/models/recipe.models";
import { ToastService } from "../../core/services/toast.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { IngredientEntryListComponent } from "../../recipes/ingredient-entry-list/ingredient-entry-list.component";
import { IngredientQuantityFormComponent } from "../../recipes/ingredient-quantity-form/ingredient-quantity-form.component";

/** Session-wide counter so freshly added ingredients get a stable, unique id. */
let nextId = 1;

/**
 * Step 1 of the recipe generator wizard ("Generate recipe"): collect
 * ingredients with quantity and unit. Preferences and results follow as
 * their own steps once those designs are ready.
 */
@Component({
  selector: "app-generator",
  standalone: true,
  imports: [RouterLink, LogoComponent, IngredientQuantityFormComponent, IngredientEntryListComponent],
  templateUrl: "./generator.component.html",
})
export class GeneratorComponent {
  protected readonly ingredients = signal<IngredientEntry[]>([]);

  constructor(private readonly toast: ToastService) {}

  /** Adds a new ingredient to the top of the list (most recent first). */
  addIngredient(entry: Omit<IngredientEntry, "id">): void {
    this.ingredients.update(list => [{ ...entry, id: nextId++ }, ...list]);
  }

  /** Applies an inline edit (quantity/unit) to an existing ingredient. */
  updateIngredient(updated: IngredientEntry): void {
    this.ingredients.update(list => list.map(entry => (entry.id === updated.id ? updated : entry)));
  }

  /** Removes an ingredient from the list. */
  removeIngredient(id: number): void {
    this.ingredients.update(list => list.filter(entry => entry.id !== id));
  }

  /** Proceeds to the next wizard step (Preferences), once it exists. */
  handleNextStep(): void {
    if (this.ingredients().length === 0) return;
    this.toast.info("Schritt 2 (Preferences) folgt als Nächstes.");
  }
}
