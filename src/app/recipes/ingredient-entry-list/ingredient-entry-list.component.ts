import { NgClass, NgTemplateOutlet } from "@angular/common";
import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MAX_QUANTITY, clampQuantity, isQuantityValid, quantityHint } from "../../core/data/quantity-limits";
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
 * inline quantity/unit editing and removal, in the order the parent passes
 * them in - which is the order they were entered, as in the mockup.
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

  /** True while the edited amount sits inside the range its unit allows. */
  protected isEditQuantityValid(): boolean {
    return isQuantityValid(this.editQuantity, this.editUnit);
  }

  /** Largest amount the edited row's unit accepts. */
  protected maxQuantity(): number {
    return MAX_QUANTITY[this.editUnit];
  }

  /** Range hint for the edited row, e.g. "1-20 pieces". */
  protected hint(): string {
    return quantityHint(this.editUnit);
  }

  /** Switches the edited row's unit and pulls the amount into its range. */
  protected changeEditUnit(unit: IngredientUnit): void {
    this.editUnit = unit;
    if (this.editQuantity !== null) this.editQuantity = clampQuantity(this.editQuantity, unit);
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
   * already disabled for an amount outside the unit's range; the guard here
   * repeats that check because `min`/`max` on a number input are not enforced
   * for typed input, so an invalid value must never leave this component
   * even if the button is reached by other means.
   */
  confirmEdit(entry: IngredientEntry): void {
    if (!this.isEditQuantityValid()) return;
    this.update.emit({ ...entry, quantity: Number(this.editQuantity), unit: this.editUnit });
    this.editingId.set(null);
  }
}
