import { Component } from "@angular/core";
import { SiteFooterComponent } from "../../layout/site-footer/site-footer.component";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";

/**
 * Legal notice page (Impressum) required by the project checklist.
 * Content is a school-project placeholder to be filled with real data.
 */
@Component({
  selector: "app-imprint",
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent],
  templateUrl: "./imprint.component.html",
})
export class ImprintComponent {}
