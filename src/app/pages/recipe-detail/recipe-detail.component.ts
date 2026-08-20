import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LibraryService } from "../../core/services/library.service";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";
import { RecipeCardComponent } from "../../recipes/recipe-card/recipe-card.component";
import { IconComponent } from "../../shared/icon/icon.component";

/**
 * Full detail view of a single library recipe (User Story 14),
 * publicly accessible via /library/:id.
 */
@Component({
  selector: "app-recipe-detail",
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent, RecipeCardComponent, IconComponent],
  templateUrl: "./recipe-detail.component.html",
})
export class RecipeDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly library = inject(LibraryService);
  private readonly id = Number(this.route.snapshot.paramMap.get("id"));

  /**
   * Resolves the recipe for the :id route parameter reactively, since the
   * library loads from Firestore asynchronously and may not have delivered
   * this recipe yet on first render.
   */
  protected readonly recipe = computed(() =>
    Number.isFinite(this.id) && this.id > 0 ? this.library.getById(this.id) : undefined,
  );
}
