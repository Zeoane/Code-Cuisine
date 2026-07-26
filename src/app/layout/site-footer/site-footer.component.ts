import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";

/**
 * Shared footer with legal and navigation links, rendered on every page
 * below the main content. Use `dark` on the forest-green hero background.
 */
@Component({
  selector: "app-site-footer",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./site-footer.component.html",
})
export class SiteFooterComponent {
  /** True on the dark hero page background. */
  @Input() dark = false;

  /** Class list for the footer nav links, depending on the background. */
  get linkClass(): string {
    const base = this.dark ? "text-creme/70 hover:text-creme" : "text-forest/70 hover:text-forest";
    return `font-quicksand flex min-h-11 items-center text-base underline-offset-4 hover:underline ${base}`;
  }
}
