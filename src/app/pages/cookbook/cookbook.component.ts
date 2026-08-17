import { Location } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CUISINE_CATEGORIES, CuisineCategory } from "../../core/data/cuisine-categories";
import { StoredRecipe } from "../../core/models/recipe.models";
import { CookbookService } from "../../core/services/cookbook.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { DragScrollDirective } from "../../shared/drag-scroll/drag-scroll.directive";
import { HeartIconComponent } from "../../shared/heart-icon/heart-icon.component";
import { IconComponent } from "../../shared/icon/icon.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/** One entry of the horizontally scrolling "Most liked recipes" row. */
export interface LikedRecipe {
  title: string;
  cookingTimeMinutes: number;
  likes: number;
}

/**
 * Placeholder entries so the row matches the design while the cookbook is
 * still empty. Replaced by real like counts once Firebase is wired in.
 */
const DEMO_LIKED: LikedRecipe[] = [
  { title: "Pasta with spinach and cherry tomatoes", cookingTimeMinutes: 20, likes: 66 },
  { title: "Low Carb Vegan No-Bake Paleo Bars", cookingTimeMinutes: 35, likes: 57 },
  { title: "Schnitzel with potato salad", cookingTimeMinutes: 45, likes: 51 },
  { title: "Creamy garlic shrimp pasta", cookingTimeMinutes: 22, likes: 44 },
  { title: "Pasta alla Trapanese", cookingTimeMinutes: 20, likes: 38 },
];

/**
 * Personal cookbook page. This step covers the intro panel and the
 * horizontally scrolling "Most liked recipes" row; the cuisine sections
 * follow next.
 */
@Component({
  selector: "app-cookbook",
  standalone: true,
  imports: [
    RouterLink,
    LogoComponent,
    IconComponent,
    HeartIconComponent,
    DragScrollDirective,
    LogoutButtonComponent,
  ],
  templateUrl: "./cookbook.component.html",
})
export class CookbookComponent {
  private readonly cookbook = inject(CookbookService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly wizard = inject(WizardStateService);

  protected readonly recipes = signal<StoredRecipe[]>(this.cookbook.list());
  protected readonly cuisines = CUISINE_CATEGORIES;

  /** Saved recipes for the liked row, falling back to the design's demo set. */
  protected readonly mostLiked = computed<LikedRecipe[]>(() => {
    const saved = this.recipes();
    if (saved.length === 0) return DEMO_LIKED;
    return saved.map(recipe => ({
      title: recipe.title,
      cookingTimeMinutes: recipe.cookingTimeMinutes,
      likes: 0,
    }));
  });

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
