import { Injectable, computed, signal } from "@angular/core";
import {
  Auth,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase-app";

const NOT_CONFIGURED_MESSAGE = "Login isn't available yet (no Firebase project configured).";

/**
 * Firebase Auth error codes mapped to short, user-facing messages.
 *
 * The list covers every code this app can actually produce, not just the happy
 * path: anything missing here used to surface as "Something went wrong", which
 * is exactly the message a user can do nothing with. The sign-in codes that
 * depend on the deployment (`unauthorized-domain`, `operation-not-allowed`)
 * are the ones that hit first after a move to a new domain, so they name the
 * cause rather than hiding it.
 */
const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "This email address is already registered.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-email": "Please enter your email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password": "Password must be at least 6 characters long.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment.",
  "auth/network-request-failed": "No connection to the server. Please check your internet.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/account-exists-with-different-credential":
    "This email address is already registered with a password. Please sign in with your password.",
  "auth/unauthorized-domain": "Google sign-in is not enabled for this address.",
  "auth/operation-not-allowed": "This sign-in method is switched off for the project.",
  "auth/internal-error": "The sign-in service is not responding. Please try again.",
};
const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Codes that mean "the user changed their mind", not "something broke". They
 * must not paint a red error onto the page: `cancelled-popup-request` even
 * fires on a perfectly normal second click while the first popup is still open.
 */
const CANCELLED_CODES = ["auth/cancelled-popup-request", "auth/user-cancelled"];

/** Thrown when the user aborted sign-in; the page stays silent on this one. */
export class AuthCancelledError extends Error {}

/**
 * Wraps Firebase Authentication (email/password + Google) behind a small,
 * signal-based API matching the style of WizardStateService. Backs the login
 * page and the header's login/logout control.
 */
@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly user = signal<User | null>(null);
  private readonly authReady: Promise<void>;

  /** True once a user is signed in. */
  readonly isLoggedIn = computed(() => this.user() !== null);
  /** Signed-in user's email, or null when logged out. */
  readonly userEmail = computed(() => this.user()?.email ?? null);

  constructor() {
    if (!auth) {
      this.authReady = Promise.resolve();
      return;
    }
    let resolveReady: () => void;
    this.authReady = new Promise(resolve => (resolveReady = resolve));
    onAuthStateChanged(auth, u => {
      this.user.set(u);
      resolveReady();
    });
  }

  /** Resolves once the initial auth session has been restored (or found absent). */
  ready(): Promise<void> {
    return this.authReady;
  }

  /** Registers a new account with email and password. */
  async registerWithEmail(email: string, password: string): Promise<void> {
    await this.run(a => createUserWithEmailAndPassword(a, email, password));
  }

  /** Signs in with an existing email/password account. */
  async loginWithEmail(email: string, password: string): Promise<void> {
    await this.run(a => signInWithEmailAndPassword(a, email, password));
  }

  /**
   * Signs in with Google. Browsers and extensions block popups routinely, and
   * a blocked popup used to end as "Something went wrong" with nothing the
   * user could do about it. If that happens the same sign-in is retried as a
   * full-page redirect, which no popup blocker can stop; the session is picked
   * up by onAuthStateChanged when the user comes back.
   */
  async loginWithGoogle(): Promise<void> {
    await this.run(async a => {
      try {
        await signInWithPopup(a, new GoogleAuthProvider());
      } catch (error) {
        if ((error as { code?: string }).code !== "auth/popup-blocked") throw error;
        await signInWithRedirect(a, new GoogleAuthProvider());
      }
    });
  }

  /** Signs the current user out. */
  async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  }

  /** Runs a Firebase Auth call, rethrowing a short, user-friendly message on failure. */
  private async run(action: (auth: Auth) => Promise<unknown>): Promise<void> {
    if (!auth) throw new Error(NOT_CONFIGURED_MESSAGE);
    try {
      await action(auth);
    } catch (error) {
      throw this.toUserError((error as { code?: string }).code ?? "");
    }
  }

  /**
   * Turns a Firebase error code into something worth showing. An unknown code
   * is logged once, because the generic message alone leaves no trace of what
   * actually failed - which is how an unmapped code stays unmapped.
   */
  private toUserError(code: string): Error {
    if (CANCELLED_CODES.includes(code)) return new AuthCancelledError(code);
    const message = ERROR_MESSAGES[code];
    if (message) return new Error(message);
    console.warn(`[auth] unhandled Firebase error code: ${code || "(none)"}`);
    return new Error(FALLBACK_ERROR_MESSAGE);
  }
}
