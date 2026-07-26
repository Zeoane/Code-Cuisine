import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SiteFooterComponent } from "../../layout/site-footer/site-footer.component";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";

/** Fallback page for any route that doesn't match, styled to fit the app. */
@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: "./not-found.component.html",
})
export class NotFoundComponent {}
