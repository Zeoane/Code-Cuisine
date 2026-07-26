import { Component, signal } from "@angular/core";
import { CardRecipe, GeneratedRecipe } from "../../core/models/recipe.models";
import { CookbookService } from "../../core/services/cookbook.service";
import { LibraryService } from "../../core/services/library.service";
import { RecipeGeneratorService } from "../../core/services/recipe-generator.service";
import { ToastService } from "../../core/services/toast.service";
import { SiteFooterComponent } from "../../layout/site-footer/site-footer.component";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";
import {
  GeneratorOptionsComponent,
  OptionValues,
} from "../../recipes/generator-options/generator-options.component";
import { IngredientInputComponent } from "../../recipes/ingredient-input/ingredient-input.component";
import { RecipeResultsComponent } from "../../recipes/recipe-results/recipe-results.component";
import { IconComponent } from "../../shared/icon/icon.component";

/** Default option values shown when the generator page first loads. */
const DEFAULT_OPTIONS: OptionValues = {
  servings: 2,
  timeCategory: "medium",
  cuisineStyle: "fusion",
  diet: "none",
  helpers: 1,
};

/** Simulated generation delay so the loading state is visible (User Story 8). */
const GENERATION_DELAY_MS = 900;

/**
 * Recipe generator page: ingredient chips plus servings, time budget,
 * cuisine, diet and helper options; generates exactly three recipes.
 */
@Component({
  selector: "app-generator",
  standalone: true,
  imports: [
    SiteHeaderComponent,
    SiteFooterComponent,
    GeneratorOptionsComponent,
    IngredientInputComponent,
    RecipeResultsComponent,
    IconComponent,
  ],
  templateUrl: "./generator.component.html",
})
export class GeneratorComponent {
  protected readonly ingredients = signal<string[]>([]);
  protected readonly options = signal<OptionValues>(DEFAULT_OPTIONS);
  protected readonly recipes = signal<CardRecipe[]>([]);
  protected readonly savedTitles = signal<Set<string>>(new Set());
  protected readonly isGenerating = signal(false);

  constructor(
    private readonly generator: RecipeGeneratorService,
    private readonly library: LibraryService,
    private readonly cookbook: CookbookService,
    private readonly toast: ToastService,
  ) {}

  /** Updates the ingredient list from the child input component. */
  setIngredients(list: string[]): void {
    this.ingredients.set(list);
  }

  /** Updates generator options from the child options panel. */
  setOptions(values: OptionValues): void {
    this.options.set(values);
  }

  /** Starts the generation with the current ingredients and options. */
  handleGenerate(): void {
    if (this.ingredients().length === 0) return;
    this.isGenerating.set(true);
    this.savedTitles.set(new Set());
    setTimeout(() => this.finishGenerate(), GENERATION_DELAY_MS);
  }

  /** Completes generation after the simulated loading delay. */
  private finishGenerate(): void {
    const options = this.options();
    const generated: GeneratedRecipe[] = this.generator.generate({
      ...options,
      ingredients: this.ingredients(),
    });
    const stored = this.library.addGenerated(generated, options.helpers);
    this.recipes.set(stored.map(r => ({ ...r, helpers: options.helpers })));
    this.isGenerating.set(false);
  }

  /** Saves a recipe into the personal cookbook. */
  handleSave(recipe: CardRecipe): void {
    this.cookbook.save(recipe, this.options().helpers);
    this.savedTitles.update(set => new Set(set).add(recipe.title));
    this.toast.success("Rezept im Kochbuch gespeichert!");
  }
}
