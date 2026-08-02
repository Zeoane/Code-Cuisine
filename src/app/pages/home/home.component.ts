import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HeroPlatesComponent } from "../../hero/hero-plates/hero-plates.component";
import { LogoComponent } from "../../hero/logo/logo.component";
import { IconComponent } from "../../shared/icon/icon.component";

/**
 * Hero landing page - pixel-faithful implementation of the Figma design
 * (forest green background), responsive down to 320px width.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [RouterLink, LogoComponent, HeroPlatesComponent, IconComponent],
  templateUrl: "./home.component.html",
})
export class HomeComponent {}
