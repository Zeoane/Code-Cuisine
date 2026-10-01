import { Component } from "@angular/core";

/**
 * The overlapping circular plates on the landing page, as one column that runs
 * off the top and the bottom edge of the page. Sizing and placement live in the
 * stylesheet, which also explains why they are no longer pixel offsets.
 */
@Component({
  selector: "app-hero-plates",
  standalone: true,
  templateUrl: "./hero-plates.component.html",
  styleUrl: "./hero-plates.component.css",
})
export class HeroPlatesComponent {}
