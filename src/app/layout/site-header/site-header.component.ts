import { Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { LogoComponent } from "../../hero/logo/logo.component";
import { IconComponent } from "../../shared/icon/icon.component";

/** One navigation link in the header. */
interface NavItem {
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/generator", label: "Generator" },
  { path: "/library", label: "Bibliothek" },
  { path: "/cookbook", label: "Kochbuch" },
];

/**
 * Shared top navigation for all inner pages: logo, links to generator,
 * library and cookbook, plus a mobile burger menu. Auth controls return
 * once Firebase Auth is wired in.
 */
@Component({
  selector: "app-site-header",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  templateUrl: "./site-header.component.html",
})
export class SiteHeaderComponent {
  protected readonly navItems = NAV_ITEMS;
  protected readonly open = signal(false);

  /** Toggles the mobile navigation panel. */
  toggleMenu(): void {
    this.open.update(v => !v);
  }

  /** Closes the mobile navigation panel, e.g. after a link click. */
  closeMenu(): void {
    this.open.set(false);
  }

  /** Builds the class list for a nav link depending on its active state. */
  navLinkClass(active: boolean, extra = ""): string {
    const color = active ? "text-creme" : "text-creme/70 hover:text-creme";
    return `font-quicksand flex min-h-11 items-center text-lg font-medium transition-colors ${color} ${extra}`;
  }
}
