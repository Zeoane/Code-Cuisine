import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CUISINE_OPTIONS } from "../../core/data/preference-options";
import { CuisineStyle } from "../../core/models/recipe.models";
import { LibraryService } from "../../core/services/library.service";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";
import { RecipeMetaComponent } from "../../recipes/recipe-meta/recipe-meta.component";
import { IconComponent } from "../../shared/icon/icon.component";

/** Cuisine filter value, including the "all" option. */
type CuisineFilter = CuisineStyle | "all";

/**
 * Public recipe library (User Stories 12-14): all generated recipes with
 * a cuisine filter and pagination (20 per page), linking to detail pages.
 */
@Component({
  selector: "app-library",
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent, RecipeMetaComponent, IconComponent],
  templateUrl: "./library.component.html",
})
export class LibraryComponent {
  protected readonly cuisine = signal<CuisineFilter>("all");
  protected readonly page = signal(1);
  protected readonly filterEntries: [CuisineFilter, string][] = [
    ["all", "All"],
    ...CUISINE_OPTIONS.map((option): [CuisineFilter, string] => [option.value, option.label]),
  ];

  protected readonly result = computed(() => {
    const cuisine = this.cuisine();
    return this.library.list(this.page(), cuisine === "all" ? undefined : cuisine);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.result().total / this.result().pageSize)),
  );

  constructor(private readonly library: LibraryService) {}

  /** Applies a cuisine filter and resets to the first page. */
  setFilter(value: CuisineFilter): void {
    this.cuisine.set(value);
    this.page.set(1);
  }

  /** Moves to the given page, clamped to the valid range. */
  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }
}
