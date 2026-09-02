import { Component } from "@angular/core";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";

/**
 * Legal notice page equired by the project checklist.
 */
@Component({
  selector: "app-imprint",
  standalone: true,
  imports: [SiteHeaderComponent],
  templateUrl: "./imprint.component.html",
})
export class ImprintComponent {}
