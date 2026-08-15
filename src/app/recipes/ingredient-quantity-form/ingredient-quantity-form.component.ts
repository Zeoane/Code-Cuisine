import { Component, EventEmitter, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { INGREDIENT_SUGGESTIONS } from "../../core/data/ingredient-suggestions";
import { IngredientEntry, IngredientUnit } from "../../core/models/recipe.models";
import { UnitSelectComponent } from "../unit-select/unit-select.component";

/**
 * Maximum number of autocomplete suggestions shown at once. Kept generous
 * (rather than e.g. 6-8) because the suggestion list now has ~1000 entries
 * (see ingredient-suggestions.ts) — a single-letter query like "c" alone
 * matches 100+ ingredients, and a common word like "Chicken" can rank
 * well outside a small cap even when sorted shortest-first. The dropdown
 * scrolls (see the template), so a larger list here doesn't overwhelm the UI.
 */
const MAX_SUGGESTIONS = 30;

/** Delay before hiding suggestions on blur, so a click can still register. */
const BLUR_HIDE_DELAY_MS = 150;

/**
 * Left-panel form of the recipe generator: enter an ingredient's name
 * (with autocomplete), quantity and unit, then add it to the list on the
 * right (User Story 1).
 */
@Component({
  selector: "app-ingredient-quantity-form",
  standalone: true,
  imports: [FormsModule, UnitSelectComponent],
  templateUrl: "./ingredient-quantity-form.component.html",
})
export class IngredientQuantityFormComponent {
  @Output() add = new EventEmitter<Omit<IngredientEntry, "id">>();

  protected name = "";
  protected quantity = 100;
  protected unit: IngredientUnit = "gram";

  protected readonly suggestions = signal<string[]>([]);
  protected readonly showSuggestions = signal(false);

  /** Emits the current form values as a new ingredient and clears the name. */
  submit(): void {
    const trimmed = this.name.trim();
    if (!trimmed || this.quantity <= 0) return;
    this.add.emit({ name: trimmed, quantity: this.quantity, unit: this.unit });
    this.name = "";
    this.showSuggestions.set(false);
  }

  /** Submits the form when Enter is pressed inside the name field. */
  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter") return;
    event.preventDefault();
    this.submit();
  }

  /** Updates the name and recomputes matching autocomplete suggestions. */
  handleNameInput(value: string): void {
    this.name = value;
    const query = value.trim().toLowerCase();
    const matches = query ? matchSuggestions(query) : [];
    this.suggestions.set(matches);
    this.showSuggestions.set(matches.length > 0);
  }

  /** Fills the name field with a picked suggestion and closes the list. */
  pickSuggestion(value: string): void {
    this.name = value;
    this.showSuggestions.set(false);
  }

  /** Prevents the input from losing focus before a suggestion click lands. */
  handleSuggestionMouseDown(event: MouseEvent, value: string): void {
    event.preventDefault();
    this.pickSuggestion(value);
  }

  /** Reads the numeric quantity typed into the serving-size field. */
  handleQuantityInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    this.quantity = Number.isFinite(raw) ? raw : 0;
  }

  /** Hides suggestions shortly after the field loses focus. */
  handleBlur(): void {
    setTimeout(() => this.showSuggestions.set(false), BLUR_HIDE_DELAY_MS);
  }
}

/**
 * Returns ingredient names starting with the given lowercase query, shortest
 * (most likely to be the common base ingredient, e.g. "Chicken" over
 * "Chicken Bouillon Powder") first so a short query surfaces the everyday
 * word instead of being crowded out by longer compound matches.
 */
function matchSuggestions(query: string): string[] {
  return INGREDIENT_SUGGESTIONS.filter(item => item.toLowerCase().startsWith(query))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, MAX_SUGGESTIONS);
}
