import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { dietLabel, timeLabel } from "../../core/data/preference-options";
import { IngredientEntry, IngredientUnit } from "../../core/models/recipe.models";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { HeartIconComponent } from "../../shared/heart-icon/heart-icon.component";
import { IconComponent } from "../../shared/icon/icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/** Short display suffix appended directly after the quantity number. */
const UNIT_SUFFIX: Record<IngredientUnit, string> = {
  gram: "g",
  ml: "ml",
  piece: " piece",
};

/** Starting like count shown next to the heart, as in the Figma design. */
const BASE_LIKES = 66;

/**
 * "One recipe view": the full recipe with nutrition facts, the ingredients
 * split into the user's own and the extras, and the directions assigned to
 * the available cooks.
 */
@Component({
  selector: "app-recipe-view",
  standalone: true,
  imports: [RouterLink, LogoComponent, IconComponent, HeartIconComponent, LogoutButtonComponent],
  templateUrl: "./recipe-view.component.html",
})
export class RecipeViewComponent {
  private readonly wizard = inject(WizardStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** True when the user arrived from the cookbook instead of the results. */
  protected readonly fromCookbook =
    this.route.snapshot.queryParamMap.get("from") === "cookbook";

  /** The recipe addressed by the :index route parameter. */
  protected readonly recipe = computed(() => {
    const index = Number(this.route.snapshot.paramMap.get("index"));
    return this.wizard.results()[index] ?? null;
  });

  protected readonly preferences = this.wizard.preferences;
  protected readonly ownIngredients = this.wizard.ingredients;

  /** Cooks available for this run, rendered as Chef 1 / Chef 2 labels. */
  protected readonly cooks = computed(() =>
    Array.from({ length: this.preferences().helpers }, (_, i) => i + 1),
  );

  /** Diet and cooking time of this run, shown as tags in the header card. */
  protected readonly tags = computed(() => {
    const { diet, timeCategory } = this.preferences();
    return [dietLabel(diet), timeLabel(timeCategory)].filter(
      (label): label is string => label !== null,
    );
  });

  protected readonly liked = signal(false);

  /** Like count shown next to the heart tag. */
  protected readonly likes = computed(() => BASE_LIKES + (this.liked() ? 1 : 0));

  /** Quantity plus unit as shown in the "Your ingredients" column. */
  formatAmount(entry: IngredientEntry): string {
    return `${entry.quantity}${UNIT_SUFFIX[entry.unit]}`;
  }

  /** Asset for the chef label of a given cook number (1-3). */
  cookLabel(cook: number): string {
    const index = Math.min(Math.max(cook, 1), 3);
    return `assets/img/OneRecipe-Page/cook-label-${index}.svg`;
  }

  /** Toggles the "I cooked this" heart. */
  toggleLike(): void {
    this.liked.update(value => !value);
  }

  /** Back link target: cookbook when opened from there, results otherwise. */
  goBack(): void {
    this.router.navigate([this.fromCookbook ? "/cookbook" : "/results"]);
  }

  /** Starts a new run at the ingredient step. */
  generateNew(): void {
    this.router.navigate(["/generator"]);
  }
}
