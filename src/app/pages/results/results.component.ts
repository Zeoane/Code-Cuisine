import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { WizardStateService } from "../../core/services/wizard-state.service";
import { LogoComponent } from "../../hero/logo/logo.component";

/**
 * Step 3 of the generator wizard ("The recipe results"). Placeholder that
 * keeps the wizard flow walkable; the full layout follows once the Figma
 * design for this screen is available.
 */
@Component({
  selector: "app-results",
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: "./results.component.html",
})
export class ResultsComponent {
  private readonly wizard = inject(WizardStateService);

  protected readonly recipes = this.wizard.results;
}
