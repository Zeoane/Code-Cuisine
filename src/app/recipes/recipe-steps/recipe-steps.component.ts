import { Component, Input } from "@angular/core";
import { RecipeStep } from "../../core/models/recipe.models";
import { IconComponent } from "../../shared/icon/icon.component";

/** Steps assigned to one helper, used for the per-person to-do lists. */
interface HelperGroup {
  helper: number;
  steps: RecipeStep[];
}

/**
 * Chronological cooking instructions. With more than one helper the steps
 * are split into a personal to-do list per helper (User Story 9).
 */
@Component({
  selector: "app-recipe-steps",
  standalone: true,
  imports: [IconComponent],
  templateUrl: "./recipe-steps.component.html",
})
export class RecipeStepsComponent {
  @Input({ required: true }) steps!: RecipeStep[];
  @Input() helpers = 1;

  /** Groups steps by assigned helper, sorted by helper number. */
  groups(): HelperGroup[] {
    const map = new Map<number, RecipeStep[]>();
    for (const step of this.steps) {
      const key = step.assignedTo || 1;
      map.set(key, [...(map.get(key) ?? []), step]);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([helper, steps]) => ({ helper, steps }));
  }
}
