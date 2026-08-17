import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CUISINE_CATEGORIES } from "../../core/data/cuisine-categories";
import {
  CUISINE_BANNERS,
  CuisineRecipe,
  RECIPES_PER_PAGE,
  recipesFor,
} from "../../core/data/cuisine-recipes";
import { CuisineStyle } from "../../core/models/recipe.models";
import { ToastService } from "../../core/services/toast.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { HeartIconComponent } from "../../shared/heart-icon/heart-icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/** Ellipsis marker used between distant page numbers. */
const GAP = "…";

/**
 * Recipe list of one cuisine ("IT recipes" in Figma): banner, paginated
 * recipe rows and the shortcut back into the generator.
 */
@Component({
  selector: "app-recipes",
  standalone: true,
  imports: [RouterLink, LogoComponent, HeartIconComponent, LogoutButtonComponent],
  templateUrl: "./recipes.component.html",
})
export class RecipesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly wizard = inject(WizardStateService);

  /** Cuisine addressed by the route, falling back to Italian. */
  protected readonly cuisine = computed<CuisineStyle>(() => {
    const param = this.route.snapshot.paramMap.get("cuisine") as CuisineStyle | null;
    return CUISINE_CATEGORIES.some(c => c.value === param) ? param! : "italian";
  });

  protected readonly category = computed(
    () => CUISINE_CATEGORIES.find(c => c.value === this.cuisine())!,
  );

  protected readonly banner = computed(
    () => `assets/img/Recipe-Page/${CUISINE_BANNERS[this.cuisine()]}`,
  );


  private readonly all = computed(() => recipesFor(this.cuisine()));

  protected readonly page = signal(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.all().length / RECIPES_PER_PAGE)),
  );

  /** Recipes of the current page. */
  protected readonly recipes = computed(() => {
    const start = (this.page() - 1) * RECIPES_PER_PAGE;
    return this.all().slice(start, start + RECIPES_PER_PAGE);
  });

  /** Running number of a row across all pages. */
  protected rowNumber(index: number): number {
    return (this.page() - 1) * RECIPES_PER_PAGE + index + 1;
  }

  /** Page buttons with an ellipsis for the skipped range. */
  protected readonly pageItems = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const items: (number | string)[] = [];
    const around = [current - 1, current, current + 1].filter(p => p > 1 && p < total);
    items.push(1);
    if (around[0] > 2) items.push(GAP);
    items.push(...around);
    if (around[around.length - 1] < total - 1) items.push(GAP);
    items.push(total);
    return items;
  });

  protected readonly gap = GAP;

  /** Switches to a page, ignoring the ellipsis markers. */
  goToPage(item: number | string): void {
    if (typeof item !== "number") return;
    this.page.set(Math.min(Math.max(item, 1), this.totalPages()));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Steps one page back or forward. */
  step(delta: number): void {
    this.goToPage(this.page() + delta);
  }

  /** Opens a single recipe (wired up once the recipes come from Firebase). */
  openRecipe(recipe: CuisineRecipe): void {
    this.toast.info(`"${recipe.title}" – Detailansicht folgt mit der Firebase-Anbindung.`);
  }

  /** Back to the cookbook overview. */
  goBack(): void {
    this.router.navigate(["/cookbook"]);
  }

  /** Shortcut into the generator, always starting with empty ingredients. */
  generate(): void {
    this.wizard.startNewRun();
  }
}
