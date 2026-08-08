import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { hasEnoughIngredients } from "../../core/services/ingredient-check";
import { RecipeGeneratorService } from "../../core/services/recipe-generator.service";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";
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

/**
 * Loading view shown while the recipe generation runs: the bowl slides in,
 * the ingredients drop into it one by one, and the dots behind "Generating"
 * fade out and back in on a loop.
 */
@Component({
  selector: "app-loading",
  standalone: true,
  imports: [LogoComponent, NotEnoughModalComponent],
  templateUrl: "./loading.component.html",
  styleUrl: "./loading.component.css",
})
export class LoadingComponent implements OnInit, OnDestroy {
  private readonly wizard = inject(WizardStateService);
  private readonly generator = inject(RecipeGeneratorService);
  private readonly router = inject(Router);

  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly items = FALLING_ITEMS;

  /** Shows the "Ups! Not quite enough..." popup over the loader. */
  protected readonly notEnough = signal(false);

  ngOnInit(): void {
    const { servings } = this.wizard.preferences();

    if (!hasEnoughIngredients(this.wizard.ingredients(), servings)) {
      this.notEnough.set(true);
      return;
    }

    this.runGeneration();
    this.timer = setTimeout(() => this.router.navigate(["/results"]), LOADER_DURATION_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  /** Delay before an item starts falling, staggered in list order. */
  itemDelay(index: number): string {
    return `${0.45 + index * 0.5}s`;
  }

  /** Dismissing the popup returns to the ingredient step. */
  closeNotEnough(): void {
    this.notEnough.set(false);
    this.router.navigate(["/generator"]);
  }

  /** Hides an illustration whose SVG has not been exported yet. */
  hideMissing(event: Event): void {
    (event.target as HTMLImageElement).style.display = "none";
  }

  /** Produces the recipe suggestions while the animation plays. */
  private runGeneration(): void {
    const { servings, helpers, timeCategory, cuisineStyle, diet } = this.wizard.preferences();
    this.wizard.results.set(
      this.generator.generate({
        ingredients: this.wizard.ingredients().map(entry => entry.name),
        servings,
        helpers,
        timeCategory: timeCategory ?? "medium",
        cuisineStyle: cuisineStyle ?? "german",
        diet: diet ?? "none",
      }),
    );
  }
}
