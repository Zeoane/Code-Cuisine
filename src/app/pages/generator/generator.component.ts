import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { IngredientEntry } from "../../core/models/recipe.models";
import { dietSafeIngredients } from "../../core/services/diet-check";
import { hasEnoughIngredients } from "../../core/services/ingredient-check";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { IngredientEntryListComponent } from "../../recipes/ingredient-entry-list/ingredient-entry-list.component";
import { IngredientQuantityFormComponent } from "../../recipes/ingredient-quantity-form/ingredient-quantity-form.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";
import { NotEnoughModalComponent } from "../../shared/not-enough-modal/not-enough-modal.component";

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
  imports: [
    RouterLink,
    LogoComponent,
    IngredientQuantityFormComponent,
    IngredientEntryListComponent,
    LogoutButtonComponent,
    NotEnoughModalComponent,
  ],
  templateUrl: "./generator.component.html",
})
export class GeneratorComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly router = inject(Router);

  protected readonly ingredients = this.wizard.ingredients;

  /** Shows the "not quite enough" notice over this page. */
  protected readonly notice = signal(false);

  /**
   * Appends a new ingredient. The mockup lists them in the order they were
   * typed in, which is also the order the user remembers putting them in;
   * newest-first made the list reshuffle under the cursor after every add.
   */
  addIngredient(entry: Omit<IngredientEntry, "id">): void {
    this.ingredients.update(list => [...list, { ...entry, id: nextId++ }]);
  }

  /** Applies an inline edit (quantity/unit) to an existing ingredient. */
  updateIngredient(updated: IngredientEntry): void {
    this.ingredients.update(list => list.map(entry => (entry.id === updated.id ? updated : entry)));
  }

  /** Removes an ingredient from the list. */
  removeIngredient(id: number): void {
    this.ingredients.update(list => list.filter(entry => entry.id !== id));
  }

  /**
   * Proceeds to step 2 of the wizard (Preferences), but only once the entered
   * amounts can actually carry the servings. The check used to run on the
   * loading step, which meant the user watched the whole animation before
   * being told to go back; it belongs here, where the quantities are.
   *
   * The servings can still be raised afterwards on the preferences step, so
   * the loading step keeps checking as well - this is the first gate, not the
   * only one.
   */
  handleNextStep(): void {
    const entries = this.ingredients();
    if (entries.length === 0) return;

    const { diet, servings } = this.wizard.preferences();
    if (!hasEnoughIngredients(dietSafeIngredients(entries, diet ?? "none"), servings)) {
      this.notice.set(true);
      return;
    }
    this.router.navigate(["/preferences"]);
  }
}

