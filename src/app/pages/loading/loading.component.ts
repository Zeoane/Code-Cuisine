import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { GenerationOptions, IngredientEntry, ResultRecipe } from "../../core/models/recipe.models";
import { dietSafeIngredients } from "../../core/services/diet-check";
import { hasEnoughIngredients } from "../../core/services/ingredient-check";
import { RecipeStoreService } from "../../core/services/recipe-store.service";
import { GenerationError, RecipeGeneratorService } from "../../core/services/recipe-generator.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";
import { NotEnoughModalComponent } from "../../shared/not-enough-modal/not-enough-modal.component";

/**
 * How long the loader stays on screen before the results view opens.
 *
 * Matches --loader-cycle in loading.component.css (11.2s) so the choreography
 * plays through exactly once: bowl, vegetables, the pepper mill and salt shaker
 * turning in and seasoning, and finally the spoon stirring. Keep the two in
 * sync - a shorter value cuts the stir off, a longer one restarts the loop.
 */
const LOADER_DURATION_MS = 11200;

/**
 * Longest the view waits for the cookbook write before it opens the results.
 * The ids that write hands back are what the heart on the recipe page counts
 * against, so waiting a moment makes the heart usable the instant the recipe
 * appears; a slow or unreachable Firestore must not hold the user up longer
 * than this, and a write that lands later still attaches its ids.
 */
const STORE_WAIT_MS = 2000;

const NOT_ENOUGH_TITLE = "Ups! Not quite enough...";
const NOT_ENOUGH_MESSAGE =
  "It looks like some ingredients aren't sufficient for your selected servings. Please add or adjust quantities and try again.";
const QUOTA_EXCEEDED_TITLE = "Daily limit reached";
const GENERATION_FAILED_TITLE = "Something went wrong";

/**
 * Loading view shown while the recipe generation runs: the bowl scene is built
 * from SVGs and animated in CSS, and the dots behind "Generating" fade out and
 * back in on a loop. Waits for the generation call to settle (in addition to
 * the animation's minimum runtime) before moving on, and shows a notice popup
 * instead of navigating on any failure.
 *
 * Reduced motion needs no special case here: the stylesheet switches the
 * animations off and the scene's resting state is the finished bowl.
 */
@Component({
  selector: "app-loading",
  standalone: true,
  imports: [LogoComponent, NotEnoughModalComponent, LogoutButtonComponent],
  templateUrl: "./loading.component.html",
  styleUrl: "./loading.component.css",
})
export class LoadingComponent implements OnInit, OnDestroy {
  private readonly wizard = inject(WizardStateService);
  private readonly generator = inject(RecipeGeneratorService);
  private readonly store = inject(RecipeStoreService);
  private readonly router = inject(Router);

  private timer: ReturnType<typeof setTimeout> | null = null;
  /** Caps how long the cookbook write may delay the results view. */
  private storeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Settles the minimum-runtime promise when the view goes away early. */
  private releaseDelay: (() => void) | null = null;
  /** True once the view is gone, so a late response changes nothing. */
  private abandoned = false;

  /** Shows the notice popup (not-enough-ingredients or a generation failure). */
  protected readonly notice = signal(false);
  protected readonly noticeTitle = signal(NOT_ENOUGH_TITLE);
  protected readonly noticeMessage = signal(NOT_ENOUGH_MESSAGE);

  /**
   * Entered ingredients minus the ones the selected diet rules out, so a vegan
   * run never cooks with the bacon the user happened to have at home.
   */
  private usableIngredients(): IngredientEntry[] {
    const { diet } = this.wizard.preferences();
    return dietSafeIngredients(this.wizard.ingredients(), diet ?? "none");
  }

  /** Checks the usable ingredients against the servings, then starts the generation. */
  ngOnInit(): void {
    const { servings } = this.wizard.preferences();

    if (!hasEnoughIngredients(this.usableIngredients(), servings)) {
      this.noticeTitle.set(NOT_ENOUGH_TITLE);
      this.noticeMessage.set(NOT_ENOUGH_MESSAGE);
      this.notice.set(true);
      return;
    }

    void this.runGeneration();
  }

  /**
   * Marks the run as abandoned and settles the minimum-runtime promise.
   * Without the release, `await minDelay` would never resolve after the timer
   * is cleared and the whole generation would stay suspended for the lifetime
   * of the tab; without the flag, a response arriving after the user left
   * would still overwrite the results of whatever run is current by then.
   */
  ngOnDestroy(): void {
    this.abandoned = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.storeTimer) clearTimeout(this.storeTimer);
    this.releaseDelay?.();
  }

  /** Dismissing the popup returns to the ingredient step. */
  closeNotice(): void {
    this.notice.set(false);
    this.router.navigate(["/generator"], { replaceUrl: true });
  }

  /**
   * Runs the recipe generation while the animation plays, navigating to the
   * results only once both the minimum animation time and the generation
   * call have settled; shows the notice popup instead on any failure.
   */
  private async runGeneration(): Promise<void> {
    const minDelay = new Promise<void>(resolve => {
      this.releaseDelay = resolve;
      this.timer = setTimeout(resolve, LOADER_DURATION_MS);
    });

    const { servings, helpers, timeCategory, cuisineStyle, diet } = this.wizard.preferences();
    const options: GenerationOptions = {
      ingredients: this.usableIngredients().map(entry => entry.name),
      servings,
      helpers,
      timeCategory: timeCategory ?? "medium",
      cuisineStyle: cuisineStyle ?? "german",
      diet: diet ?? "none",
    };

    let error: unknown = null;
    try {
      const recipes = await this.generator.generate(options);
      if (this.abandoned) return;
      this.wizard.results.set(recipes);
      await this.storeInCookbook(recipes, options.helpers);
    } catch (e) {
      error = e;
    }
    await minDelay;
    if (this.abandoned) return;

    if (error) {
      this.showGenerationError(error);
      return;
    }
    // Replace instead of push: this view starts a generation on every
    // activation, so leaving it in the history means the browser's Back
    // button runs a second one - spending another of the three daily
    // generations and overwriting the results the user was just looking at.
    this.router.navigate(["/results"], { replaceUrl: true });
  }

  /**
   * Writes the finished recipes to the cookbook and hands the ids they get
   * back to the wizard state, so the heart works on a recipe the moment it
   * is shown instead of only on a stored one opened from the cookbook later.
   *
   * Waits for the write, but never longer than STORE_WAIT_MS, and never
   * fails the run: the cookbook is a nice-to-have, the recipes the user has
   * been waiting for are not. The id handover deliberately survives this
   * view, so a write that only finishes after the results have opened still
   * enables the heart there.
   */
  private async storeInCookbook(recipes: ResultRecipe[], helpers: number): Promise<void> {
    const write = this.store
      .addGenerated(recipes, helpers)
      .then(stored => {
        if (stored.length === recipes.length) this.wizard.attachStoredIds(recipes, stored);
      })
      .catch(() => {});

    await Promise.race([
      write,
      new Promise<void>(resolve => {
        this.storeTimer = setTimeout(resolve, STORE_WAIT_MS);
      }),
    ]);

    if (this.storeTimer) clearTimeout(this.storeTimer);
    this.storeTimer = null;
  }

  /** Shows the notice popup with a title/message matching the failure kind. */
  private showGenerationError(error: unknown): void {
    const isQuotaExceeded = error instanceof GenerationError && error.code === "quota_exceeded";
    this.noticeTitle.set(isQuotaExceeded ? QUOTA_EXCEEDED_TITLE : GENERATION_FAILED_TITLE);
    this.noticeMessage.set(
      error instanceof Error ? error.message : "Please try again in a moment.",
    );
    this.notice.set(true);
  }
}
