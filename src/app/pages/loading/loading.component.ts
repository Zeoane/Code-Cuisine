import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { GenerationOptions } from "../../core/models/recipe.models";
import { hasEnoughIngredients } from "../../core/services/ingredient-check";
import { LibraryService } from "../../core/services/library.service";
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
  private readonly library = inject(LibraryService);
  private readonly router = inject(Router);

  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Shows the notice popup (not-enough-ingredients or a generation failure). */
  protected readonly notice = signal(false);
  protected readonly noticeTitle = signal(NOT_ENOUGH_TITLE);
  protected readonly noticeMessage = signal(NOT_ENOUGH_MESSAGE);

  ngOnInit(): void {
    const { servings } = this.wizard.preferences();

    if (!hasEnoughIngredients(this.wizard.ingredients(), servings)) {
      this.noticeTitle.set(NOT_ENOUGH_TITLE);
      this.noticeMessage.set(NOT_ENOUGH_MESSAGE);
      this.notice.set(true);
      return;
    }

    void this.runGeneration();
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  /** Dismissing the popup returns to the ingredient step. */
  closeNotice(): void {
    this.notice.set(false);
    this.router.navigate(["/generator"]);
  }

  /**
   * Runs the recipe generation while the animation plays, navigating to the
   * results only once both the minimum animation time and the generation
   * call have settled; shows the notice popup instead on any failure.
   */
  private async runGeneration(): Promise<void> {
    const minDelay = new Promise<void>(resolve => {
      this.timer = setTimeout(resolve, LOADER_DURATION_MS);
    });

    const { servings, helpers, timeCategory, cuisineStyle, diet } = this.wizard.preferences();
    const options: GenerationOptions = {
      ingredients: this.wizard.ingredients().map(entry => entry.name),
      servings,
      helpers,
      timeCategory: timeCategory ?? "medium",
      cuisineStyle: cuisineStyle ?? "german",
      diet: diet ?? "none",
    };

    let error: unknown = null;
    try {
      const recipes = await this.generator.generate(options);
      this.wizard.results.set(recipes);
      // Fire-and-forget: the library is a nice-to-have, so a Firestore hiccup
      // here must never block the user from seeing their own results.
      void this.library.addGenerated(recipes, options.helpers).catch(() => {});
    } catch (e) {
      error = e;
    }
    await minDelay;

    if (error) {
      this.showGenerationError(error);
      return;
    }
    this.router.navigate(["/results"]);
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
