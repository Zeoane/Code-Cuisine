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
  /** Index of the suggestion the arrow keys currently sit on, -1 for none. */
  protected readonly activeIndex = signal(-1);

  /** DOM id of a suggestion, needed for aria-activedescendant. */
  protected optionId(index: number): string {
    return `ingredient-suggestion-${index}`;
  }

  /** Emits the current form values as a new ingredient and clears the name. */
  submit(): void {
    const trimmed = this.name.trim();
    if (!trimmed || this.quantity <= 0) return;
    this.add.emit({ name: trimmed, quantity: this.quantity, unit: this.unit });
    this.name = "";
    this.closeSuggestions();
  }

  /**
   * Keyboard handling for the name field, which acts as a combobox: the
   * arrow keys walk the suggestion list, Enter takes the highlighted entry
   * (or submits when none is highlighted) and Escape closes the list. The
   * suggestions themselves are not focusable - that is what makes them
   * reachable by keyboard at all, since focus never leaves the input.
   */
  handleKeydown(event: KeyboardEvent): void {
    const open = this.showSuggestions();
    const items = this.suggestions();

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open || !items.length) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (this.activeIndex() + step + items.length + 1) % (items.length + 1);
      this.activeIndex.set(next === items.length ? -1 : next);
      this.scrollActiveIntoView();
      return;
    }

    if (event.key === "Escape") {
      if (!open) return;
      event.preventDefault();
      this.closeSuggestions();
      return;
    }

    if (event.key === "Tab") {
      this.closeSuggestions();
      return;
    }

    if (event.key !== "Enter") return;
    event.preventDefault();
    const active = items[this.activeIndex()];
    if (open && active !== undefined) {
      this.pickSuggestion(active);
      return;
    }
    this.submit();
  }

  /** Keeps the highlighted suggestion visible inside the scrolling list. */
  private scrollActiveIntoView(): void {
    const index = this.activeIndex();
    if (index < 0) return;
    queueMicrotask(() => {
      document.getElementById(this.optionId(index))?.scrollIntoView({ block: "nearest" });
    });
  }

  /** Hides the suggestion list and clears the arrow-key highlight. */
  private closeSuggestions(): void {
    this.showSuggestions.set(false);
    this.activeIndex.set(-1);
  }

  /** Updates the name and recomputes matching autocomplete suggestions. */
  handleNameInput(value: string): void {
    this.name = value;
    const query = value.trim().toLowerCase();
    const matches = query ? matchSuggestions(query) : [];
    this.suggestions.set(matches);
    this.showSuggestions.set(matches.length > 0);
    this.activeIndex.set(-1);
  }

  /** Fills the name field with a picked suggestion and closes the list. */
  pickSuggestion(value: string): void {
    this.name = value;
    this.closeSuggestions();
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
    setTimeout(() => this.closeSuggestions(), BLUR_HIDE_DELAY_MS);
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
