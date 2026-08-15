import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { environment } from "../../../environments/environment";

/**
 * True once a real Firebase project config (see environment.example.ts) has
 * been filled in. Until then, `auth`/`firestore` stay null so the rest of
 * the app keeps working without a Firebase project — only auth-gated
 * features degrade (see AuthService), instead of the whole app crashing on
 * Firebase's "invalid-api-key" error.
 */
export const isFirebaseConfigured = Boolean(environment.firebase.apiKey);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(environment.firebase);
  authInstance = getAuth(app);
  firestoreInstance = getFirestore(app);

  if (environment.useFirebaseEmulators) {
    connectAuthEmulator(authInstance, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(firestoreInstance, "127.0.0.1", 8080);
  }
}

/** Shared Firebase Auth instance, or null when no Firebase project is configured. */
export const auth = authInstance;

/** Shared Firestore instance, or null when no Firebase project is configured. */
export const firestore = firestoreInstance;
