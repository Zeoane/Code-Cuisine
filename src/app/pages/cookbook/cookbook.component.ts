import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { StoredRecipe } from "../../core/models/recipe.models";
import { CookbookService } from "../../core/services/cookbook.service";
import { ToastService } from "../../core/services/toast.service";
import { SiteFooterComponent } from "../../layout/site-footer/site-footer.component";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";
import { RecipeCardComponent } from "../../recipes/recipe-card/recipe-card.component";
import { IconComponent } from "../../shared/icon/icon.component";

/**
 * Personal cookbook page: lists saved recipes with removal support.
 * Stored in this browser only for now; Firebase sync (with login)
 * follows once it is wired in.
 */
@Component({
  selector: "app-cookbook",
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent, SiteFooterComponent, RecipeCardComponent, IconComponent],
  templateUrl: "./cookbook.component.html",
})
export class CookbookComponent {
  protected readonly recipes = signal<StoredRecipe[]>([]);

  constructor(
    private readonly cookbook: CookbookService,
    private readonly toast: ToastService,
  ) {
    this.recipes.set(this.cookbook.list());
  }

  /** Removes a saved recipe from the cookbook. */
  handleRemove(id: number): void {
    this.cookbook.remove(id);
    this.recipes.set(this.cookbook.list());
    this.toast.success("Rezept entfernt.");
  }
}
