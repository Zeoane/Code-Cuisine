import { Component, Input } from "@angular/core";

/** Logo image path per background it needs to sit on. */
const LOGO_SRC = {
  /** Creme wordmark, for use on the dark forest-green background. */
  cream: "assets/img/hero/logo-code-a-cuisine.svg",
  /** Full-colour wordmark, for use on white/light backgrounds. */
  color: "assets/img/Generate-Page/Capa_2.svg",
} as const;

/**
 * "Code à Cuisine" logo rendered as a single SVG
 * image for crisp scaling at any size. Use `variant="color"` on light
 * backgrounds and the default `"cream"` on the dark forest-green ones.
 */
@Component({
  selector: "app-logo",
  standalone: true,
  template: `
    <img [src]="LOGO_SRC[variant]" alt="Code à Cuisine" [class]="klass" draggable="false" />
  `,
})
export class LogoComponent {
  protected readonly LOGO_SRC = LOGO_SRC;

  /** Tailwind size classes applied to the logo image. */
  @Input() klass = "h-12 w-auto";
  /** Which colour variant to render. */
  @Input() variant: keyof typeof LOGO_SRC = "cream";
}
