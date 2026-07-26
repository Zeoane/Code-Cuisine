import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { StoredRecipe } from "../../core/models/recipe.models";
import { LibraryService } from "../../core/services/library.service";
import { SiteFooterComponent } from "../../layout/site-footer/site-footer.component";
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
  imports: [RouterLink, SiteHeaderComponent, SiteFooterComponent, RecipeCardComponent, IconComponent],
  templateUrl: "./recipe-detail.component.html",
})
export class RecipeDetailComponent implements OnInit {
  protected readonly recipe = signal<StoredRecipe | undefined>(undefined);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly library: LibraryService,
  ) {}

  /** Resolves the recipe for the :id route parameter on init. */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.recipe.set(Number.isFinite(id) && id > 0 ? this.library.getById(id) : undefined);
  }
}
