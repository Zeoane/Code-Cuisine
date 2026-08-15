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

const NOT_CONFIGURED_MESSAGE =
  "Anmeldung ist noch nicht verfügbar (kein Firebase-Projekt konfiguriert).";

/** Maps common Firebase Auth error codes to short, user-facing German messages. */
const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Diese E-Mail-Adresse ist bereits registriert.",
  "auth/invalid-email": "Bitte gib eine gültige E-Mail-Adresse ein.",
  "auth/weak-password": "Das Passwort muss mindestens 6 Zeichen lang sein.",
  "auth/invalid-credential": "E-Mail oder Passwort ist falsch.",
  "auth/user-not-found": "E-Mail oder Passwort ist falsch.",
  "auth/wrong-password": "E-Mail oder Passwort ist falsch.",
  "auth/too-many-requests": "Zu viele Versuche. Bitte warte einen Moment.",
  "auth/popup-closed-by-user": "Anmeldung wurde abgebrochen.",
};
const FALLBACK_ERROR_MESSAGE = "Etwas ist schiefgelaufen. Bitte versuche es erneut.";

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
