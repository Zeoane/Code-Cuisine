import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { CardRecipe } from "../../core/models/recipe.models";
import { IconComponent } from "../../shared/icon/icon.component";
import { RecipeMetaComponent } from "../recipe-meta/recipe-meta.component";
import { RecipeNutritionComponent } from "../recipe-nutrition/recipe-nutrition.component";
import { RecipeStepsComponent } from "../recipe-steps/recipe-steps.component";

/**
 * Recipe card with metadata badges, ingredients (incl. missing ones),
 * nutrition facts and collapsible helper-aware preparation steps.
 */
@Component({
  selector: "app-recipe-card",
  standalone: true,
  imports: [RecipeMetaComponent, RecipeNutritionComponent, RecipeStepsComponent, IconComponent],
  templateUrl: "./recipe-card.component.html",
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: CardRecipe;
  @Input() saving = false;
  @Input() saved = false;
  @Input() deleting = false;
  @Input() showSave = false;
  @Input() showDelete = false;
  @Output() save = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  protected readonly expanded = signal(false);

  /** Toggles the collapsible preparation steps section. */
  toggleSteps(): void {
    this.expanded.update(v => !v);
  }
}
