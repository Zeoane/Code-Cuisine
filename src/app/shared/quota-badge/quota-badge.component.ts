import { Component, inject } from "@angular/core";
import { QuotaService } from "../../core/services/quota.service";

/**
 * Shows the signed-in network's remaining daily recipe generations
 * (User Story 11) so the user can plan requests ahead of clicking Generate.
 * Renders nothing while the count is unknown (n8n not configured, or the
 * status call hasn't resolved yet) rather than showing a misleading "0".
 */
@Component({
  selector: "app-quota-badge",
  standalone: true,
  templateUrl: "./quota-badge.component.html",
})
export class QuotaBadgeComponent {
  private readonly quota = inject(QuotaService);

  protected readonly ipRemaining = this.quota.ipRemaining;
}
