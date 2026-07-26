import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IconComponent } from "../../shared/icon/icon.component";

const MAX_INGREDIENTS = 30;

/**
 * Ingredient entry with chip/tag display (User Story 1). Users add
 * ingredients one by one (Enter or button) and remove them individually.
 */
@Component({
  selector: "app-ingredient-input",
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: "./ingredient-input.component.html",
})
export class IngredientInputComponent {
  @Input() ingredients: string[] = [];
  @Input() disabled = false;
  @Output() ingredientsChange = new EventEmitter<string[]>();

  protected value = "";

  /** Adds the current input value as a chip and clears the field. */
  addIngredient(): void {
    this.ingredientsChange.emit(withIngredient(this.ingredients, this.value));
    this.value = "";
  }

  /** Removes a single ingredient by exact value. */
  removeIngredient(item: string): void {
    this.ingredientsChange.emit(this.ingredients.filter(i => i !== item));
  }

  /** Adds the ingredient when Enter is pressed inside the input. */
  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    this.addIngredient();
  }
}

/** Returns the list with the trimmed item appended, if new and within limit. */
function withIngredient(list: string[], raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed || list.length >= MAX_INGREDIENTS) return list;
  const exists = list.some(i => i.toLowerCase() === trimmed.toLowerCase());
  return exists ? list : [...list, trimmed];
}
