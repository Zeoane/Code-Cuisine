import { NgClass, NgTemplateOutlet } from "@angular/common";
import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IngredientEntry, IngredientUnit } from "../../core/models/recipe.models";
import { IconComponent } from "../../shared/icon/icon.component";
import { UnitSelectComponent } from "../unit-select/unit-select.component";

/** Short display suffix appended directly after the quantity number. */
const UNIT_SUFFIX: Record<IngredientUnit, string> = {
  gram: "g",
  ml: "ml",
  piece: "",
};

/**
 * Right-panel "List of your Ingredients": shows added ingredients with
 * inline quantity/unit editing and removal. Newest entries are rendered
 * first, in whatever order the parent passes them in.
 */
@Component({
  selector: "app-ingredient-entry-list",
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, FormsModule, IconComponent, UnitSelectComponent],
  templateUrl: "./ingredient-entry-list.component.html",
})
export class IngredientEntryListComponent {
  @Input() entries: IngredientEntry[] = [];
  @Output() update = new EventEmitter<IngredientEntry>();
  @Output() remove = new EventEmitter<number>();

  protected readonly editingId = signal<number | null>(null);
  /**
   * Nullable on purpose: a cleared number field hands ngModel `null`, not 0.
   * Typing this as plain `number` only hid that from the compiler - the
   * value still reached the recipe page and rendered as "nullg Tomatoes".
   */
  protected editQuantity: number | null = 0;
  protected editUnit: IngredientUnit = "gram";

  /** True while the edited amount is a real, positive number. */
  protected isEditQuantityValid(): boolean {
    const value = Number(this.editQuantity);
    return this.editQuantity !== null && Number.isFinite(value) && value > 0;
  }

  /** Suffix shown right after the quantity (e.g. "g", "ml", or none for pieces). */
  unitSuffix(unit: IngredientUnit): string {
    return UNIT_SUFFIX[unit];
  }

  /** Switches a row into edit mode, seeded with its current values. */
  startEdit(entry: IngredientEntry): void {
    this.editingId.set(entry.id);
    this.editQuantity = entry.quantity;
    this.editUnit = entry.unit;
  }

  /**
   * Confirms the edit and emits the updated entry. The confirm button is
   * already disabled for an empty or non-positive amount; the guard here
   * repeats that check because `min="0"` on a number input is not enforced
   * for typed input, so an invalid value must never leave this component
   * even if the button is reached by other means.
   */
  confirmEdit(entry: IngredientEntry): void {
    if (!this.isEditQuantityValid()) return;
    this.update.emit({ ...entry, quantity: Number(this.editQuantity), unit: this.editUnit });
    this.editingId.set(null);
  }
}
