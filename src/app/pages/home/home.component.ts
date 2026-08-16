import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HeroPlatesComponent } from "../../hero/hero-plates/hero-plates.component";
import { LogoComponent } from "../../hero/logo/logo.component";
import { IconComponent } from "../../shared/icon/icon.component";
import { ImpressumModalComponent } from "../../shared/impressum-modal/impressum-modal.component";
import { LogoutButtonComponent } from "../../shared/logout-button/logout-button.component";

/**
 * Hero landing page - pixel-faithful implementation of the Figma design
 * (forest green background), responsive down to 320px width.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    RouterLink,
    LogoComponent,
    HeroPlatesComponent,
    IconComponent,
    ImpressumModalComponent,
    LogoutButtonComponent,
  ],
  templateUrl: "./home.component.html",
})
export class HomeComponent {
  protected readonly impressumOpen = signal(false);
}
