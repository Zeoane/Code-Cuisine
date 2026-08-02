import { Component } from "@angular/core";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";

/**
 * Legal notice page (Impressum) required by the project checklist.
 * Content is a school-project placeholder to be filled with real data.
 */
@Component({
  selector: "app-imprint",
  standalone: true,
  imports: [SiteHeaderComponent],
  templateUrl: "./imprint.component.html",
})
export class ImprintComponent {}
