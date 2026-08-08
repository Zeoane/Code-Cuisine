import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { IngredientEntry } from "../../core/models/recipe.models";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { IngredientEntryListComponent } from "../../recipes/ingredient-entry-list/ingredient-entry-list.component";
import { IngredientQuantityFormComponent } from "../../recipes/ingredient-quantity-form/ingredient-quantity-form.component";

/** Session-wide counter so freshly added ingredients get a stable, unique id. */
let nextId = 1;

/**
 * Step 1 of the recipe generator wizard ("Generate recipe"): collect
 * ingredients with quantity and unit. Step 2 (Preferences) follows on
 * /preferences; the entered ingredients live in WizardStateService so
 * navigating between the steps keeps them.
 */
@Component({
  selector: "app-generator",
  standalone: true,
  imports: [RouterLink, LogoComponent, IngredientQuantityFormComponent, IngredientEntryListComponent],
  templateUrl: "./generator.component.html",
})
export class GeneratorComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly router = inject(Router);

  protected readonly ingredients = this.wizard.ingredients;

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

  /** Proceeds to step 2 of the wizard (Preferences). */
  handleNextStep(): void {
    if (this.ingredients().length === 0) return;
    this.router.navigate(["/preferences"]);
  }
}
