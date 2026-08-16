import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { GenerationOptions } from "../../core/models/recipe.models";
import { hasEnoughIngredients } from "../../core/services/ingredient-check";
import { GenerationError, RecipeGeneratorService } from "../../core/services/recipe-generator.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";
import { NotEnoughModalComponent } from "../../shared/not-enough-modal/not-enough-modal.component";

/** One illustration element that drops into the bowl, in animation order. */
interface FallingItem {
  /** File name inside assets/img/Loading-Page/. */
  file: string;
  /** Horizontal resting position inside the 253x309 card, in px. */
  left: number;
  /** Vertical resting position inside the card, in px. */
  top: number;
  /** Rendered width in px (height follows the SVG aspect ratio). */
  width: number;
  /** Rotation at rest, in degrees. */
  rotate: number;
}

/**
 * Elements dropping into the bowl, in the order used by the Figma prototype.
 * Positions are tuned for the 253x309 loader card and can be nudged once the
 * final SVG exports are in place.
 */
const FALLING_ITEMS: FallingItem[] = [
  { file: "salad.svg", left: 66, top: 176, width: 66, rotate: -6 },
  { file: "carrot.svg", left: 112, top: 158, width: 46, rotate: 12 },
  { file: "cucumber.svg", left: 90, top: 182, width: 46, rotate: -8 },
  { file: "broccoli.svg", left: 144, top: 166, width: 54, rotate: 6 },
  { file: "pepper.svg", left: 46, top: 36, width: 38, rotate: -12 },
  { file: "salt.svg", left: 160, top: 52, width: 40, rotate: 18 },
  { file: "spoon.svg", left: 150, top: 152, width: 34, rotate: 205 },
];

/** How long the loader stays on screen before the results view opens. */
const LOADER_DURATION_MS = 5200;

const NOT_ENOUGH_TITLE = "Ups! Not quite enough...";
const NOT_ENOUGH_MESSAGE =
  "It looks like some ingredients aren't sufficient for your selected servings. Please add or adjust quantities and try again.";
const QUOTA_EXCEEDED_TITLE = "Daily limit reached";
const GENERATION_FAILED_TITLE = "Something went wrong";

/**
 * Loading view shown while the recipe generation runs: the bowl slides in,
 * the ingredients drop into it one by one, and the dots behind "Generating"
 * fade out and back in on a loop. Waits for the generation call to settle
 * (in addition to the animation's minimum runtime) before moving on, and
 * shows a notice popup instead of navigating on any failure.
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
  private readonly router = inject(Router);

  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly items = FALLING_ITEMS;

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

  /** Delay before an item starts falling, staggered in list order. */
  itemDelay(index: number): string {
    return `${0.45 + index * 0.5}s`;
  }

  /** Dismissing the popup returns to the ingredient step. */
  closeNotice(): void {
    this.notice.set(false);
    this.router.navigate(["/generator"]);
  }

  /** Hides an illustration whose SVG has not been exported yet. */
  hideMissing(event: Event): void {
    (event.target as HTMLImageElement).style.display = "none";
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
