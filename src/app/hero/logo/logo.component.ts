import { Component, Input } from "@angular/core";

/**
 * "Code à Cuisine" logo (chef hat + wordmark), rendered as a single SVG
 * image for crisp scaling at any size.
 */
@Component({
  selector: "app-logo",
  standalone: true,
  template: `
    <img
      src="assets/img/hero/logo-code-a-cuisine.svg"
      alt="Code à Cuisine"
      [class]="klass"
      draggable="false" />
  `,
})
export class LogoComponent {
  /** Tailwind size classes applied to the logo image. */
  @Input() klass = "h-12 w-auto";
}
