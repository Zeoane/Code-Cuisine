import { Component, Input, inject } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ICON_PATHS } from "./icon-paths";

/**
 * Renders one of the app's inline SVG icons by name (see icon-paths.ts).
 * Replaces the former lucide-react icon set with a small dependency-free set.
 */
@Component({
  selector: "app-icon",
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      [class]="klass"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [innerHTML]="markup()"
      aria-hidden="true"></svg>
  `,
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** Icon name, matching a key in ICON_PATHS. */
  @Input() name = "";
  /** Tailwind size/color classes applied to the <svg> element. */
  @Input() klass = "h-5 w-5";

  /** Resolves and sanitizes the inner SVG markup for the current icon name. */
  markup(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICON_PATHS[this.name] ?? "");
  }
}
