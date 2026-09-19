import { Component, Input, computed, signal } from "@angular/core";
import { NutritionInfo } from "../../core/models/recipe.models";
import { MacroKey, macroShares } from "../../core/services/nutrition-facts";

/**
 * Bar fill per macro. Written out so Tailwind finds the class names, and
 * validated as a categorical palette: distinguishable for protan, deutan and
 * tritan vision and at least 3:1 against the light card backgrounds.
 */
const MACRO_FILL: Record<MacroKey, string> = {
  protein: "bg-macro-protein",
  fat: "bg-macro-fat",
  carbs: "bg-macro-carbs",
};

/**
 * Shows how the recipe's energy splits across protein, fat and carbs as one
 * stacked bar with a labelled legend. The percentages come from the grams via
 * the Atwater factors, so they add up to 100 regardless of the calorie value.
 */
@Component({
  selector: "app-nutrition-split",
  standalone: true,
  templateUrl: "./nutrition-split.component.html",
})
export class NutritionSplitComponent {
  private readonly source = signal<NutritionInfo | null>(null);

  /** Per-serving nutrition facts the split is calculated from. */
  @Input({ required: true }) set nutrition(value: NutritionInfo) {
    this.source.set(value);
  }

  /** Macro shares in Figma's order: protein, fat, carbs. */
  protected readonly shares = computed(() => {
    const nutrition = this.source();
    return nutrition ? macroShares(nutrition) : [];
  });

  /** Only the macros that actually take up space, so the bar ends stay rounded. */
  protected readonly barShares = computed(() => this.shares().filter(share => share.percent > 0));

  /** Text alternative for the bar, which is decorative on its own. */
  protected readonly summary = computed(() =>
    this.shares()
      .map(share => `${share.label} ${share.percent}%`)
      .join(", "),
  );

  /** Tailwind background class for a macro's bar segment and legend swatch. */
  protected fill(key: MacroKey): string {
    return MACRO_FILL[key];
  }
}
