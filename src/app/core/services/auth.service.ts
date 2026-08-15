import { Injectable, computed, signal } from "@angular/core";
import {
  Auth,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase-app";

const NOT_CONFIGURED_MESSAGE = "Login isn't available yet (no Firebase project configured).";

/** Maps common Firebase Auth error codes to short, user-facing messages. */
const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "This email address is already registered.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters long.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
};
const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Wraps Firebase Authentication (email/password + Google) behind a small,
 * signal-based API matching the style of WizardStateService. Backs the
 * `authGuard` and the login page.
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

  /** Signs in via a Google account popup. */
  async loginWithGoogle(): Promise<void> {
    await this.run(a => signInWithPopup(a, new GoogleAuthProvider()));
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
      const code = (error as { code?: string }).code ?? "";
      throw new Error(ERROR_MESSAGES[code] ?? FALLBACK_ERROR_MESSAGE);
    }
  }
}
