import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IngredientEntry, IngredientUnit } from "../../core/models/recipe.models";
import { IconComponent } from "../../shared/icon/icon.component";

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
  imports: [FormsModule, IconComponent],
  templateUrl: "./ingredient-entry-list.component.html",
})
export class IngredientEntryListComponent {
  @Input() entries: IngredientEntry[] = [];
  @Output() update = new EventEmitter<IngredientEntry>();
  @Output() remove = new EventEmitter<number>();

  protected readonly editingId = signal<number | null>(null);
  protected editQuantity = 0;
  protected editUnit: IngredientUnit = "gram";

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

  /** Confirms the edit and emits the updated entry. */
  confirmEdit(entry: IngredientEntry): void {
    this.update.emit({ ...entry, quantity: this.editQuantity, unit: this.editUnit });
    this.editingId.set(null);
  }
}
