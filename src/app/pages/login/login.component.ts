import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { PASSWORD_REQUIREMENTS_HINT, isStrongPassword } from "../../core/services/password-policy";
import { SiteHeaderComponent } from "../../layout/site-header/site-header.component";

/** Which form the page currently shows. */
type Mode = "login" | "register";

/**
 * Login/registration page gating the personal cookbook: email/password
 * (sign in or create an account) plus a Google sign-in button.
 */
@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink, SiteHeaderComponent],
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  protected readonly mode = signal<Mode>("login");
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordHint = PASSWORD_REQUIREMENTS_HINT;

  /** Bound to the email/password inputs via ngModel (plain fields, not signals). */
  protected email = "";
  protected password = "";

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  /** Switches between the login and register forms, clearing any error. */
  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
  }

  /** Submits the email/password form for the current mode. */
  async submit(): Promise<void> {
    const email = this.email.trim();
    const password = this.password;
    if (!email || !password) return;

    if (this.mode() === "register" && !isStrongPassword(password)) {
      this.errorMessage.set(this.passwordHint);
      return;
    }

    await this.run(() =>
      this.mode() === "register"
        ? this.auth.registerWithEmail(email, password)
        : this.auth.loginWithEmail(email, password),
    );
  }

  /** Signs in with a Google account popup. */
  async submitWithGoogle(): Promise<void> {
    await this.run(() => this.auth.loginWithGoogle());
  }

  /** Runs an auth action, tracking loading state and surfacing errors. */
  private async run(action: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await action();
      const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl") ?? "/cookbook";
      this.router.navigateByUrl(returnUrl);
    } catch (error) {
      this.errorMessage.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
