import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { IconComponent } from "../icon/icon.component";

/**
 * Icon-only sign-out control shown opposite the logo in every page header.
 * Renders nothing while signed out, matching the quiet/optional feel of
 * auth throughout the app (nothing here is required to use the generator).
 */
@Component({
  selector: "app-logout-button",
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (isLoggedIn()) {
      <button
        type="button"
        (click)="logout()"
        [attr.aria-label]="'Log out (' + userEmail() + ')'"
        [class]="klass">
        <app-icon name="log-out" klass="h-5 w-5" />
      </button>
    }
  `,
})
export class LogoutButtonComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly userEmail = this.auth.userEmail;

  /** Tailwind classes applied to the button; override per page's header colors. */
  klass = "flex h-11 w-11 shrink-0 items-center justify-center transition-colors";

  /** Signs the current user out and returns to the home page. */
  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(["/"]);
  }
}
