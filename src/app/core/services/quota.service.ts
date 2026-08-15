import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";

/** Remaining-generations counts returned by the n8n quota endpoints. */
export interface QuotaStatus {
  ipRemaining: number;
  totalRemaining: number;
}

/** True once a real n8n quota-status webhook URL has been configured. */
export const isQuotaStatusConfigured = Boolean(environment.n8n.quotaStatusUrl);

/**
 * Tracks the signed-in network's remaining daily recipe generations
 * (User Story 11), fed by n8n's IP-based quota check. Best-effort: quota
 * display must never block or crash the app, so failures leave the signals
 * at null (unknown) instead of surfacing an error.
 */
@Injectable({ providedIn: "root" })
export class QuotaService {
  private readonly http = inject(HttpClient);

  /** Recipes left today for the caller's IP, or null while unknown. */
  readonly ipRemaining = signal<number | null>(null);
  /** Recipes left today system-wide, or null while unknown. */
  readonly totalRemaining = signal<number | null>(null);

  /** Fetches the current quota status from n8n; silently no-ops on failure. */
  async refresh(): Promise<void> {
    if (!isQuotaStatusConfigured) return;
    try {
      const status = await firstValueFrom(
        this.http.get<QuotaStatus>(environment.n8n.quotaStatusUrl),
      );
      this.applyFromResponse(status);
    } catch {
      /* quota display is best-effort; leave signals as they were */
    }
  }

  /** Syncs the signals from a quota payload already returned by another call. */
  applyFromResponse(status: QuotaStatus): void {
    this.ipRemaining.set(status.ipRemaining);
    this.totalRemaining.set(status.totalRemaining);
  }
}
