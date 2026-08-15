/**
 * Template for `environment.ts` (gitignored). Copy this file to
 * `environment.ts` and fill in the real Firebase Web App config from
 * Firebase Console → Project Settings → General → Your apps.
 */
export const environment = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  },
  /** Set to true to connect to the local Firebase Auth/Firestore emulators. */
  useFirebaseEmulators: false,
  /**
   * n8n webhook URLs (production, i.e. the workflow's "Active" toggle is on).
   * Left empty until the n8n workflows are imported and activated — the app
   * falls back to the local mock generator until then (see
   * RecipeGeneratorService).
   */
  n8n: {
    generateUrl: "",
    quotaStatusUrl: "",
  },
};
