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
  /** Delay before this item starts falling, in seconds. */
  delay: number;
  /**
   * Which stir animation to play once the spoon lands: the veggies get a
   * small side-to-side nudge, the spoon itself sweeps further and rocks.
   */
  stir?: "veg" | "spoon";
  /** Stir sweep distance in px (ignored when `stir` is unset). */
  stirDistance?: number;
  /**
   * Plays a tip-and-settle wobble right after this item lands, as if it just
   * poured out its contents (the salt shaker and pepper mill). The wobble
   * adds to the item's own resting tilt, so the two combine into one clear
   * dip toward the bowl (roughly 58° total at the peak).
   */
  pour?: boolean;
  /** Extra rotation at the pour's peak, in degrees (sign gives the direction). */
  pourRotate?: number;
}

/** Duration of the item-drop keyframe, in seconds (must match the CSS). */
const DROP_DURATION_S = 0.6;
/** When the spoon lands and the stir wiggle starts, in seconds. */
const SPOON_DELAY_S = 3.9;

/**
 * Elements dropping into the bowl, in order: the carrot, salad and tomato
 * land first as the base ingredients, sitting low enough that the bowl's
 * front rim (see the template) covers roughly their bottom half; the salt
 * shaker and pepper mill then arrive, dip toward the bowl to pour, and the
 * salt/pepper grains fall right as each peaks its dip; the spoon arrives
 * last to stir everything together.
 */
const FALLING_ITEMS: FallingItem[] = [
  { file: "carrot.svg", left: 78, top: 148, width: 44, rotate: 8, delay: 0.4, stir: "veg", stirDistance: 8 },
  { file: "salad.svg", left: 118, top: 138, width: 52, rotate: -6, delay: 0.55, stir: "veg", stirDistance: 8 },
  { file: "tomato.svg", left: 150, top: 160, width: 40, rotate: -10, delay: 0.7, stir: "veg", stirDistance: 8 },
  { file: "salt-shaker.svg", left: 86, top: 34, width: 30, rotate: 22, delay: 1.0, pour: true, pourRotate: 36 },
  { file: "salt.svg", left: 96, top: 138, width: 24, rotate: 15, delay: 1.9 },
  { file: "pepper-mill.svg", left: 150, top: 24, width: 26, rotate: -22, delay: 2.3, pour: true, pourRotate: 36 },
  { file: "pepper.svg", left: 138, top: 134, width: 24, rotate: -12, delay: 3.2 },
  {
    file: "spoon.svg",
    left: 112,
    top: 92,
    width: 28,
    rotate: -18,
    delay: SPOON_DELAY_S,
    stir: "spoon",
    stirDistance: 20,
  },
];

/** How long the loader stays on screen before the results view opens. */
const LOADER_DURATION_MS = 6150;

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
  private readonly library = inject(LibraryService);
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

  /** Delay before the stir wiggle starts: right when the spoon lands. */
  stirDelay(): string {
    return `${SPOON_DELAY_S + DROP_DURATION_S}s`;
  }

  /** Delay before a shaker/mill's pour wobble starts: right when it lands. */
  pourDelay(item: FallingItem): string {
    return `${item.delay + DROP_DURATION_S}s`;
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
