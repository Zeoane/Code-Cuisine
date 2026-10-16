import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CUISINE_CATEGORIES } from "../../core/data/cuisine-categories";
import {
  CUISINE_BANNERS,
  CUISINE_BANNERS_MOBILE,
  CuisineRecipe,
  MAX_PAGES,
  RECIPES_PER_PAGE,
  recipesFor,
} from "../../core/data/cuisine-recipes";
import { CuisineStyle, StoredRecipe } from "../../core/models/recipe.models";
import { LibraryService } from "../../core/services/library.service";
import { ToastService } from "../../core/services/toast.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { HeartIconComponent } from "../../shared/heart-icon/heart-icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/** Ellipsis marker used between distant page numbers. */
const GAP = "…";

/** Longest a recipe list may get before the oldest rows fall off the end. */
const MAX_ROWS = MAX_PAGES * RECIPES_PER_PAGE;

/**
 * Turns a stored recipe into a list row. Likes start at zero because nothing
 * has voted on a freshly generated recipe yet; the sample rows carry the
 * counts from the design.
 */
function toRow(recipe: StoredRecipe): CuisineRecipe {
  const tags = [recipe.difficulty[0].toUpperCase() + recipe.difficulty.slice(1)];
  if (recipe.cookingTimeMinutes <= 20) tags.push("Quick");
  return {
    id: recipe.id,
    libraryId: recipe.id,
    title: recipe.title,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    tags,
    likes: 0,
  };
}

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
  private readonly library = inject(LibraryService);

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

  protected readonly bannerMobile = computed(
    () => `assets/img/Recipe-Page/${CUISINE_BANNERS_MOBILE[this.cuisine()]}`,
  );


  /**
   * The list: everything this cuisine has generated, newest first, then the
   * sample rows. Capped at six pages - the generated recipes keep coming and
   * the design does not provide for an endless list.
   */
  private readonly all = computed(() => {
    const generated = this.library.listByCuisine(this.cuisine()).map(toRow);
    return [...generated, ...recipesFor(this.cuisine())].slice(0, MAX_ROWS);
  });

  protected readonly page = signal(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.all().length / RECIPES_PER_PAGE)),
  );

  /**
   * The page actually shown. The list grows while the page is open - a recipe
   * generated in another tab arrives through Firestore - so the stored page
   * number can point past the end and has to be pulled back.
   */
  protected readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  /** Recipes of the current page. */
  protected readonly recipes = computed(() => {
    const start = (this.currentPage() - 1) * RECIPES_PER_PAGE;
    return this.all().slice(start, start + RECIPES_PER_PAGE);
  });

  /** Running number of a row across all pages. */
  protected rowNumber(index: number): number {
    return (this.currentPage() - 1) * RECIPES_PER_PAGE + index + 1;
  }

  /** Page buttons with an ellipsis for the skipped range. */
  protected readonly pageItems = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
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
    this.goToPage(this.currentPage() + delta);
  }

  /**
   * Opens a generated recipe in its library detail page. The sample rows have
   * no stored recipe behind them and say so instead of leading nowhere.
   */
  openRecipe(recipe: CuisineRecipe): void {
    if (recipe.libraryId === undefined) {
      this.toast.info("Sample recipe - generate your own to open the full view.");
      return;
    }
    this.router.navigate(["/library", recipe.libraryId]);
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
