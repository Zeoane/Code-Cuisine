import { Component, Input } from "@angular/core";

/**
 * Overlapping circular plate images from the hero design. Rendered either
 * as the absolutely positioned desktop column or the compact mobile row,
 * selected via the `variant` input.
 */
@Component({
  selector: "app-hero-plates",
  standalone: true,
  templateUrl: "./hero-plates.component.html",
})
export class HeroPlatesComponent {
  /** Which layout to render. */
  @Input() variant: "desktop" | "mobile" = "desktop";
}
