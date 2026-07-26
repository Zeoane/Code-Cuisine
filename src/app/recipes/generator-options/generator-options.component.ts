import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CUISINE_LABELS, DIET_LABELS, TIME_CATEGORY_LABELS } from "../../core/data/recipe-labels";
import { CuisineStyle, DietPreference, TimeCategory } from "../../core/models/recipe.models";
import { IconComponent } from "../../shared/icon/icon.component";

/** Option values controlled by this panel (everything except ingredients). */
export interface OptionValues {
  servings: number;
  timeCategory: TimeCategory;
  cuisineStyle: CuisineStyle;
  diet: DietPreference;
  helpers: number;
}

/**
 * Option panel for the recipe generator: servings (1-12), time budget,
 * cuisine style, diet and number of cooking helpers (User Stories 2-6).
 */
@Component({
  selector: "app-generator-options",
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: "./generator-options.component.html",
})
export class GeneratorOptionsComponent {
  @Input({ required: true }) values!: OptionValues;
  @Input() disabled = false;
  @Output() valuesChange = new EventEmitter<OptionValues>();

  protected readonly timeEntries = Object.entries(TIME_CATEGORY_LABELS) as [TimeCategory, string][];
  protected readonly cuisineEntries = Object.entries(CUISINE_LABELS) as [CuisineStyle, string][];
  protected readonly dietEntries = Object.entries(DIET_LABELS) as [DietPreference, string][];

  /** Emits an updated option set with the given partial patch applied. */
  patch(change: Partial<OptionValues>): void {
    this.valuesChange.emit({ ...this.values, ...change });
  }

  /** Adjusts servings by the given delta, clamped to 1-12. */
  stepServings(delta: number): void {
    this.patch({ servings: clamp(this.values.servings + delta, 1, 12) });
  }

  /** Adjusts the helper count by the given delta, clamped to 1-3. */
  stepHelpers(delta: number): void {
    this.patch({ helpers: clamp(this.values.helpers + delta, 1, 3) });
  }
}

/** Clamps a number into an inclusive range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
