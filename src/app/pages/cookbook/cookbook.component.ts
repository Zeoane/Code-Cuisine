import { Location } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CUISINE_CATEGORIES, CuisineCategory } from "../../core/data/cuisine-categories";
import { RecipeStoreService } from "../../core/services/recipe-store.service";
import { ToastService } from "../../core/services/toast.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { DragScrollDirective } from "../../shared/drag-scroll/drag-scroll.directive";
import { HeartIconComponent } from "../../shared/heart-icon/heart-icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/** One entry of the horizontally scrolling "Most liked recipes" row. */
export interface LikedRecipe {
  /** Cookbook id, or null for the sample entries that have no recipe behind them. */
  id: number | null;
  title: string;
  cookingTimeMinutes: number;
  likes: number;
}

/**
 * Sample entries so the row matches the design while the cookbook is still
 * empty. They carry no hearts: every count on this page is one somebody
 * actually clicked.
 */
const DEMO_LIKED: LikedRecipe[] = [
  { id: null, title: "Pasta with spinach and cherry tomatoes", cookingTimeMinutes: 20, likes: 0 },
  { id: null, title: "Low Carb Vegan No-Bake Paleo Bars", cookingTimeMinutes: 35, likes: 0 },
  { id: null, title: "Schnitzel with potato salad", cookingTimeMinutes: 45, likes: 0 },
  { id: null, title: "Creamy garlic shrimp pasta", cookingTimeMinutes: 22, likes: 0 },
  { id: null, title: "Pasta alla Trapanese", cookingTimeMinutes: 20, likes: 0 },
];

/** How many recipes the "Most liked" row holds before it stops scrolling. */
const MOST_LIKED_COUNT = 10;

/**
 * The cookbook: the intro panel, the horizontally scrolling "Most liked
 * recipes" row and the cuisine tiles that lead to the recipe lists. Every
 * recipe ever generated lives here, so this page is the whole library.
 */
@Component({
  selector: "app-cookbook",
  standalone: true,
  imports: [
    RouterLink,
    LogoComponent,
    HeartIconComponent,
    DragScrollDirective,
    LogoutButtonComponent,
  ],
  templateUrl: "./cookbook.component.html",
})
export class CookbookComponent {
  private readonly store = inject(RecipeStoreService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly wizard = inject(WizardStateService);

  protected readonly cuisines = CUISINE_CATEGORIES;

  /** The most liked recipes, falling back to the design's sample set. */
  protected readonly mostLiked = computed<LikedRecipe[]>(() => {
    const saved = this.store.listMostLiked(MOST_LIKED_COUNT);
    if (saved.length === 0) return DEMO_LIKED;
    return saved.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      cookingTimeMinutes: recipe.cookingTimeMinutes,
      likes: recipe.likes,
    }));
  });

  /** Opens a recipe of the liked row in the recipe view. */
  openRecipe(entry: LikedRecipe): void {
    if (entry.id === null) {
      this.toast.info("Sample recipe - generate your own to open the full view.");
      return;
    }
    this.router.navigate(["/cookbook/recipe", entry.id]);
  }

  /** Opens the recipe list of a cuisine. */
  openCuisine(cuisine: CuisineCategory): void {
    this.router.navigate(["/recipes", cuisine.value]);
  }

  /** Starts a fresh run at the ingredient step. */
  generateNew(): void {
    this.wizard.startNewRun();
  }

  /** Returns to wherever the user came from. */
  goBack(): void {
    this.location.back();
  }
}
